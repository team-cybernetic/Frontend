/*
This file is part of Cybernetic Chat.

Cybernetic Chat is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Cybernetic Chat is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Cybernetic Chat.  If not, see <http://www.gnu.org/licenses/>.
*/


pragma solidity ^0.4.11;

import "./ContentLib.sol";
import "./CurrencyLib.sol";
import "./PostLib.sol";
import "./PermissionLib.sol";
import "./StateLib.sol";
import "./UserLib.sol";

library GroupLib {

  event UserJoined(
    uint256 indexed parentNumber,
    address indexed userAddress
  );
  event UserLeft(
    uint256 indexed parentNumber,
    address indexed userAddress
  );
  event UserKicked(
    uint256 indexed parentNumber,
    address indexed kickedUserAddress,
    address indexed kickingUserAddress,
    string reason
  );
  event UserBanned(
    uint256 indexed parentNumber,
    address indexed bannedUserAddress,
    address indexed banningUserAddress,
    string reason
  );
  event UserMuted(
    uint256 indexed parentNumber,
    address indexed mutedUserAddress,
    address indexed mutingUserAddress
  );

  event Debug(
    uint256 indexed major,
    uint256 indexed minor,
    uint256 indexed micro,
    string message,
    uint256 dat1,
    uint256 dat2
  );



  struct State {
    mapping (uint256 => address[]) userAddressesBacking;
    mapping (uint256 => uint256[]) subpostsBacking;
  }

  struct Group {
    uint256 parentNum;
    uint256 number;
    uint256 tokens; //total amount of tokens managed by this group (post balances + user balances + group owned tokens)

    mapping (address => UserLib.User) users;
    uint256 userCount;

    address[] userAddresses;
    mapping (address => uint256) userAddressesMap; //maps a user address to the corresponding index in userAddresses, for deleting users

    uint256[] subposts;
    mapping (uint256 => uint256) subpostsMap; //maps a subpost number to the index +1 at which it is stored in the subpost array

    bool userPermissionsFlagsMode;
    mapping (int256 => int256) userPermissions; //for levels mode, user.permissions maps to a set of flags in userPermissions
  }

  function getGroupRaw(StateLib.State storage state, uint256 num) constant internal returns (Group storage) {
    return (PostLib.getPostRaw(state, num).group);
  }

  function groupExists(StateLib.State storage state, uint256 num) constant internal returns (bool) {
    return (PostLib.postExists(state, num) && getGroupRaw(state, num).number != 0);
  }

  function getGroup(StateLib.State storage state, uint256 num) constant internal returns (Group storage) {
    require(groupExists(state, num));
    return (getGroupRaw(state, num));
  }

  function getUserPropertiesRaw(StateLib.State storage state, Group storage group, address userAddress) constant internal returns (UserLib.User storage) {
    return (group.users[userAddress]);
  }

  function userExists(StateLib.State storage state, Group storage group, address userAddress) constant public returns (bool) {
    return (userAddress != 0x0 && getUserPropertiesRaw(state, group, userAddress).joined);
  }

  function getUserProperties(StateLib.State storage state, Group storage group, address userAddress) constant internal returns (UserLib.User storage) {
    require(userExists(state, group, userAddress));
    return (getUserPropertiesRaw(state, group, userAddress));
  }

  function getUsers(StateLib.State storage state, Group storage group) constant internal returns (address[]) {
    return (group.userAddresses);
  }

  function joinGroup(StateLib.State storage state, Group storage group) internal returns (bool) {
    if (userExists(state, group, msg.sender)) {
      return (true);
    }

    if (state.main.initialized) {
      if (!PermissionLib.userJoin(state, group, msg.sender))
        return (false);
        //UserJoinDenied event emitted by permissionlib
    }

    if (group.userAddressesMap[msg.sender] == 0) { //user has never been in the group before
      group.userCount++;
      group.users[msg.sender] = UserLib.User({
        parentNum: group.number,
        number: group.userCount,
        addr: msg.sender,
        balance: 0, //TODO: ruleset
        joined: true,
        joinTime: block.timestamp,
        banned: false,
        banReason: "",
        permissions: -1 //TODO: ruleset, permissions for new users
      });

      group.userAddresses.push(msg.sender);
      group.userAddressesMap[msg.sender] = group.userAddresses.length;
    } else { //user has been in the group before, just restore the user
      group.users[msg.sender].joined = true;
      group.userAddresses[group.userAddressesMap[msg.sender] - 1] = msg.sender;
    }

    UserJoined(group.number, msg.sender);
    return (true);
  }

  function removeUser(StateLib.State storage state, Group storage group, address userAddress) internal {
    if (group.userAddressesMap[msg.sender] == 0) //user has never been in the group before
      return;
    group.users[userAddress].joined = false;
    group.userAddresses[group.userAddressesMap[userAddress] - 1] = address(0x0);
    UserLeft(group.number, userAddress);
  }

  //apparently this function MUST be internal, otherwise joined=false in removeUser throws invalild opcode??
  function leaveGroup(StateLib.State storage state, Group storage group) internal { 
    if (!userExists(state, group, msg.sender)) {
      return;
    }

    //TODO: send the user their ether, based on ruleset
    removeUser(state, group, msg.sender);
  }

  function getSubposts(StateLib.State storage state, Group storage group) constant internal returns (uint256[]) {
    return (group.subposts);
  }

  function isSubpost(StateLib.State storage state, Group storage group, uint256 num) constant public returns (bool) {
    return (group.subpostsMap[num] != 0);
  }

  function addPost(
    StateLib.State storage state,
    uint256 parentNum,
    ContentLib.Content contents,
    uint256 balance,
    uint256 tokens,
    bool userPermissionsFlagsMode,
    int256 permissions
  ) internal returns (PostLib.Post storage) {
    uint256 number = ++state.postLib.count;
    if (state.main.initialized) {
      var parent = getGroup(state, parentNum);
      parent.subposts.push(number);
      parent.subpostsMap[number] = parent.subposts.length;
    }
    state.main.posts[number] = PostLib.Post({
      contents: contents,
      group: GroupLib.Group({
        number: number,
        parentNum: parentNum,
        userCount: 0,
        tokens: tokens,
        userPermissionsFlagsMode: userPermissionsFlagsMode,
        userAddresses: state.groupLib.userAddressesBacking[number],
        subposts: state.groupLib.subpostsBacking[number]
      }),
      number: number,
      parentNum: parentNum,
      balance: balance,
      permissions: permissions
    });
    if (!state.main.initialized) {
      state.main.posts[number].group.subposts.push(0);
      state.main.posts[number].group.subpostsMap[number] = 1; //state.main.posts[number].group.subposts.length
    }
    return (state.main.posts[number]);
  }
}
