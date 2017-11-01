pragma solidity ^0.4.11;

import "./UserLib.sol";

library PermissionLib {

  struct State {
    mapping (address => int256) userPermissions;
    mapping (address => bool) userBanned;
    mapping (address => bool) userMuted;
    mapping (address => string) userBanReason;
    bool flagsMode;
  }

  event UserJoinDenied(address indexed userAddress, string reason);
  event CreatePostDenied(address indexed userAddress, string reason);

  /*
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
    Group_permissions_edit,   //user wants to edit the assignable permissions of the group
  }
  */

  function userJoin(State storage self, UserLib.State storage userlib, address userAddress) returns (bool) {
    if (self.userBanned[userAddress]) {
      UserJoinDenied(userAddress, self.userBanReason[userAddress]);
      return (false);
    }
    return (true);
  }

  function createPost(State storage self, address userAddress) returns (bool) {
    if (self.userMuted[userAddress]) {
      CreatePostDenied(userAddress, "User is muted");
      return (false);
    }
    return (true);
  }
}
