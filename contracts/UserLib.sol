pragma solidity ^0.4.11;

import "./ContentLib.sol";
import "./CurrencyLib.sol";
import "./PostLib.sol";
import "./PermissionLib.sol";
import "./StateLib.sol";

library UserLib {

  using UserLib for State;
  using PostLib for PostLib.State;
  using CurrencyLib for CurrencyLib.State;
  using PermissionLib for PermissionLib.State;

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


  struct User {
    ContentLib.Content contents;
    uint256 parentNum;
    uint256 balance;
    int256 permissions; //permission level of user, permit negatives for banned/muted/etc type users, also use largest type to permit flags instead of linear values
    bool joined;
    bool banned;
    string banReason;
  }

  struct State {
    uint256 count;
//    mapping (uint256 => mapping (address => User)) byAddress; //maps ethereum address (public key) to user objects
//    mapping (uint256 => address[]) addresses;
  }

  function getUserRaw(StateLib.State storage state, uint256 parentNum, address userAddress) constant internal returns (User storage) {
    var p = PostLib.getPost(state, parentNum);
    return (p.users[userAddress]);
  }

  function userExists(StateLib.State storage state, uint256 parentNum, address userAddress) constant internal returns (bool) {
    return (userAddress != 0x0 && getUserRaw(state, parentNum, userAddress).joined);
  }

  function getUser(StateLib.State storage state, uint256 parentNum, address userAddress) constant internal returns (User storage) {
    require(userExists(state, parentNum, userAddress));
    return (getUserRaw(state, parentNum, userAddress));
  }

  function getUsers(StateLib.State storage state, uint256 parentNum) constant internal returns (address[]) {
    var p = PostLib.getPost(state, parentNum);
    return (p.userAddresses);
  }

  function join(StateLib.State storage state, uint256 parentNum) public {
    require(!userExists(state, parentNum, msg.sender));

    if (state.main.initialized) {
      if (!PermissionLib.userJoin(state, parentNum, msg.sender)) {
        //UserJoinDenied event emitted by permissionlib
        return;
      }
    }

    var p = PostLib.getPost(state, parentNum);

    if (p.userAddressesMap[msg.sender] == 0) { //user has never been in the group before
      state.userLib.count++;
      p.users[msg.sender] = User({
        parentNum: parentNum,
        contents: ContentLib.Content({
          title: "",
          mimeType: "",
          multihash: ContentLib.IpfsMultihash({
            hashFunction: 0,
            hashLength: 0,
            hash: ""
          }),
          creator: msg.sender,
          creationTime: block.timestamp
        }),
        balance: 0, //TODO: ruleset
        joined: true,
        banned: false,
        banReason: "",
        permissions: -1 //TODO: ruleset, permissions for new users
      });

      p.userAddressesMap[msg.sender] = p.userAddresses.length;
      p.userAddresses.push(msg.sender);
    } else { //user has been in the group before, just restore the profile
      p.users[msg.sender].joined = true;
      //p.users[msg.sender].parentNum = parentNum;
      p.userAddresses[p.userAddressesMap[msg.sender]] = msg.sender;
    }

    UserJoined(parentNum, msg.sender);
  }

  function removeUser(StateLib.State storage state, uint256 parentNum, address userAddress) internal {
    var p = PostLib.getPost(state, parentNum);
    p.users[userAddress].joined = false;
    p.userAddresses[p.userAddressesMap[userAddress]] = address(0x0);
    UserLeft(parentNum, userAddress);
  }

  function leave(StateLib.State storage state, uint256 parentNum) public { 
    require(userExists(state, parentNum, msg.sender));

    removeUser(state, parentNum, msg.sender);
    //TODO: send the user their ether, based on ruleset

//    var u = getUser(state, parentNum, msg.sender);
//    var p = PostLib.getPost(state, parentNum);
    //u.parentNum = 0;
    //p.users[msg.sender].parentNum = 0;
    //p.userAddresses[p.userAddressesMap[msg.sender]] = 0;
  }

}
