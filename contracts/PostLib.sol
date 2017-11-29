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
import "./UserLib.sol";
import "./CurrencyLib.sol";
import "./PermissionLib.sol";
import "./StateLib.sol";
import "./GroupLib.sol";

library PostLib {

  event PostCreated(
    uint256 indexed parentNumber,
    uint256 indexed postNumber,
    address indexed userAddress
  );

  struct State {
    uint256 count;
  }

  struct Post {
    ContentLib.Content contents;
    GroupLib.Group group;
    uint256 number; //must be > 0 if post exists, unique, immutable
    uint256 parentNum; //0 == no parent
    uint256 balance; //balance in the parent group
    int256 permissions; //permission level of post in parent group
  }

  function getPostRaw(StateLib.State storage state, uint256 num) constant internal returns (Post storage) {
    return (state.main.posts[num]);
  }

  function postExists(StateLib.State storage state, uint256 num) constant internal returns (bool) {
    return (num <= state.postLib.count && getPostRaw(state, num).number != 0);
  }

  function getPost(StateLib.State storage state, uint256 num) constant internal returns (Post storage) {
    require(postExists(state, num));
    return (getPostRaw(state, num));
  }

  function createPostChecks(
    StateLib.State storage state,
    uint256 parentNum,
    ContentLib.Content content
  ) private returns (
    bool checksPassed,
    uint256 creationTime
  ) {
    checksPassed = false;
    creationTime = 0;
    if (state.main.initialized) { //if the contract hasn't been fully deployed yet (I.E. it's being deployed right now, in this call), the original creator won't even have permissions to create the first post, so just skip these checks
      if (!GroupLib.groupExists(state, parentNum))
        return;
      //TODO: ruleset? creating a post (could) auto-join to group
      if (!PermissionLib.createPost(state, GroupLib.getGroup(state, parentNum), content.creator))
        return;
    }

    //require(!PermissionLib.postLocked(parentNum)); //TODO: self.byNumber[parentNum].locked ??

    //TODO: check title length via group's ruleset
    //TODO: UTF-8 length != bytes().length
    if (bytes(content.title).length > 255)
      return;

    (checksPassed, creationTime) = ContentLib.contentCheck(content);

    /*
//      state,
      title,
      mimeType,
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      creationTime
    );
    */
  }

  function createPost(
    StateLib.State storage state,
    uint256 parentNum,
    ContentLib.Content memory content,
    bool userPermissionsFlagsMode
  ) internal returns (
    uint256 newNum
  ) {

    newNum = 0;
    bool checksPassed;

    (checksPassed, content.creationTime) = createPostChecks(state, parentNum, content);
    if (!checksPassed)
      return;

    var newPost = GroupLib.addPost(
      state,
      parentNum,
      content,
      0,    //TODO: ruleset, default balance in parent group of newly created post
      0,    //TODO: ruleset? default tokens (shouldn't it always be 0?)
      userPermissionsFlagsMode,
      0     //TODO: ruleset, default permissions for new post
    );

    //should the user join the new group?
    //TODO: ruleset? does it make sense to create a group but not be part of it?
    if (!GroupLib.joinGroup(state, newPost.group))
      return;
      

    var u = GroupLib.getUserProperties(state, newPost.group, msg.sender);
    u.permissions = -1; //TODO: ruleset, permissions of creator

    //should the user join the parent group? TODO: ruleset TODO: can you actually even get here without being in the group, since PermissionsLib fails the check earlier if the user has no permissions
    var parent = GroupLib.getGroup(state, parentNum);
    if (!GroupLib.userExists(state, parent, msg.sender)) {
      GroupLib.joinGroup(state, parent);
    }

    var u2 = GroupLib.getUserProperties(state, parent, msg.sender);

    CurrencyLib.awardTokensToUser(parent, u2, 8, true); //TODO: ruleset; how much should they get, if anything? also TODO msg.value for money paid in


    PostCreated(parentNum, newPost.number, msg.sender);
  }
}
