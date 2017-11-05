pragma solidity ^0.4.11;

import "./UserLib.sol";
import "./PostLib.sol";
import "./StateLib.sol";

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

  function isPermitted(StateLib.State storage state, uint256 parentNum, int256 permissions, Action action) constant public returns (bool) {
    var p = PostLib.getPost(state, parentNum);
    if (!p.userPermissionsFlagsMode) {
      permissions = p.userPermissions[permissions]; //user.permissions just maps to some flags
    }
    require(uint256(action) < 256);
    return ((uint256(permissions) & (uint256(1) << uint256(action))) != 0);
  }

  function userJoin(StateLib.State storage state, uint256 parentNum, address userAddress) public returns (bool) {
    var u = UserLib.getUserRaw(state, parentNum, userAddress);
    if (u.banned) {
      UserJoinDenied(
        parentNum,
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

  function createPost(StateLib.State storage state, uint256 parentNum, address userAddress) public returns (bool) {
    var u = UserLib.getUser(state, parentNum, userAddress);
    //if (u.muted) {
    if (!isPermitted(state, parentNum, u.permissions, Action.Post_create)) {
      PostCreationDenied(parentNum, userAddress, "User is muted");
      return (false);
    }
    return (true);
  }
}
