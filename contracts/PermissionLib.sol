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

import "./UserLib.sol";
import "./PostLib.sol";
import "./StateLib.sol";
import "./GroupLib.sol";

library PermissionLib {

  struct State {
  }

  event UserJoinDenied(
    uint256 indexed parentNumber,
    address indexed userAddress,
    string reason
  );
  event PostCreationDenied(
    uint256 indexed parentNumber,
    address indexed userAddress,
    string reason
  );

  enum Action {
    User_join,                //user wants to join the group
    User_leave,               //user wants to leave the group
    User_kick,                //user wants to kick a user from the group
    User_ban,                 //user wants to prevent a user from joining the group
    User_mute,                //user wants to prevent a user from posting in the group
    User_tip_send,            //user wants to send a tip to a user
    User_tip_receive,         //user wants to receive a tip from a user
    User_title_edit,          //user wants to edit the title of a user
    User_content_edit,        //user wants to edit the profile content of a user
    User_permissions_edit,    //user wants to edit the permissions of a user
    Post_create,              //user wants to create a post
    Post_delete,              //user wants to delete a post
    Post_currency_withdraw,   //user wants to withdraw currency from a post
    Post_currency_deposit,    //user wants to send currency to a post
    Post_title_edit,          //user wants to edit the title of a post
    Post_content_edit,        //user wants to edit the content of a post
    Post_permissions_edit,    //user wants to edit the permissions of another user
    Post_subgroup_create,     //user wants to add a subgroup to a post
    Post_subgroup_delete,     //user wants to delete a subgroup from a post
    Group_currency_withdraw,  //user wants to withdraw ether from the group contract
    Group_currency_deposit,   //user wants to deposit ether into the group contract
    Group_title_edit,         //user wants to edit the title of the group
    Group_content_edit,       //user wants to edit the content of the group
    Group_lock,               //user wants to lock the group
    Group_unlock,             //user wants to unlock the group
    Group_permissions_edit    //user wants to edit the assignable permissions of the group
  }

  function isPermitted(StateLib.State storage state, GroupLib.Group storage group, int256 permissions, Action action) constant public returns (bool) {
    if (!group.userPermissionsFlagsMode) {
      permissions = group.userPermissions[permissions]; //user.permissions just maps to some flags
    }
    require(uint256(action) < 256);
    return ((uint256(permissions) & (uint256(1) << uint256(action))) != 0);
  }

  function userJoin(StateLib.State storage state, GroupLib.Group storage group, address userAddress) public returns (bool) {
    var u = GroupLib.getUserPropertiesRaw(state, group, userAddress);
    if (u.banned) {
      UserJoinDenied(
        group.parentNum,
        userAddress,
        (bytes(u.banReason).length != 0) ?
          u.banReason
        :
          "User is banned"
      );
      return (false);
    }
    return (true);
  }

  function createPost(StateLib.State storage state, GroupLib.Group storage group, address userAddress) public returns (bool) {
    var u = GroupLib.getUserProperties(state, group, userAddress);
    if (!isPermitted(state, group, u.permissions, Action.Post_create)) {
      PostCreationDenied(group.parentNum, userAddress, "User is not allowed to post");
      return (false);
    }
    return (true);
  }
}
