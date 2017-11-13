pragma solidity ^0.4.11;

import "./ContentLib.sol";
import "./UserLib.sol";
import "./CurrencyLib.sol";
import "./PermissionLib.sol";
import "./StateLib.sol";

library PostLib {

  event PostCreated(
    uint256 indexed parentNumber,
    uint256 indexed postNumber,
    address indexed userAddress
  );

  struct State {
    uint256 count;
    mapping (uint256 => address[]) userAddressesBacking;
    mapping (uint256 => uint256[]) childrenBacking;
  }

  struct Post {
    ContentLib.Content contents;
    uint256 number; //must be > 0 if post exists, unique, immutable
    uint256 parentNum; //0 == no parent, but only the root should have parentNum == 0
    uint256 balance; //balance in the parent group
    uint256 tokens; //total balance of all sub-objects
    int256 permissions; //permission level of post in parent group
    mapping (int256 => int256) userPermissions; //for levels mode, permissions maps to the flags the level posesses
    bool userPermissionsFlagsMode;
    mapping (address => UserLib.User) users;
    address[] userAddresses;
    mapping (address => uint256) userAddressesMap; //maps a user address to the corresponding index in userAddresses, for deleting users
    uint256[] children;
    mapping (uint256 => uint256) childrenMap; //maps a child post number to the index +1 at which it is stored in the children array
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

  function getChildren(StateLib.State storage state, uint256 num) constant internal returns (uint256[]) {
    var p = getPost(state, num);
    return (p.children);
  }

  function isChild(StateLib.State storage state, uint256 parentNum, uint256 num) constant internal returns (bool) {
    var p = getPost(state, parentNum);
    return (p.childrenMap[num] != 0);
  }

  function addPost(
    StateLib.State storage state,
    uint256 parentNum,
    uint256 number,
    ContentLib.Content contents,
    uint256 balance,
    uint256 tokens,
    bool userPermissionsFlagsMode,
    int256 permissions
  ) private returns (Post) {
    if (state.main.initialized) {
      var parent = getPostRaw(state, parentNum);
      parent.childrenMap[number] = parent.children.length + 1;
      parent.children.push(number);
    }
    state.main.posts[number] = Post({
      contents: contents,
      number: number,
      parentNum: parentNum,
      balance: balance,
      tokens: tokens,
      permissions: permissions,
      userPermissionsFlagsMode: userPermissionsFlagsMode,
      userAddresses: state.postLib.userAddressesBacking[number],
      children: state.postLib.childrenBacking[number]
    });
//    state.main.posts[number].userAddressesMap[contents.creator] = 1; //everything is set to 0 by default
//    state.main.posts[number].userAddresses.push(0); //the 0th user is null (users start at 1)
    if (!state.main.initialized) {
      state.main.posts[number].childrenMap[number] = 1; //length is 0, explicit call not needed
      state.main.posts[number].children.push(0);
    }
    return (state.main.posts[number]);
  }

  function createPostChecks(
    StateLib.State storage state,
    uint256 parentNum,
    string title,
    string mimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    uint256 creationTime
  ) private returns (
    uint256 _creationTime
  ) {
    if (state.main.initialized) { //if the contract hasn't been fully deployed yet (I.E. it's being deployed right now, in this call), the original creator won't even have permissions to create the first post, so just skip these checks
      require(PermissionLib.createPost(state, parentNum, msg.sender));
      require(postExists(state, parentNum));
    }

    //require(!PermissionLib.postLocked(parentNum)); //TODO: self.byNumber[parentNum].locked ??

    //TODO: check title length via group's ruleset
    //TODO: UTF-8 length != bytes().length
    require(bytes(title).length <= 255);

    bool checksPassed;
    (checksPassed, _creationTime) = ContentLib.contentCheck(
//      state,
      title,
      mimeType,
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      creationTime
    );
    require(checksPassed);
  }

  function createPost(
    StateLib.State storage state,
    uint256 parentNum,
    string title,
    string mimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    uint256 creationTime,
    bool userPermissionsFlagsMode
  ) public returns (uint256) {

    (creationTime) = createPostChecks(
      state,
      parentNum,
      title,
      mimeType,
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      creationTime
    );


    state.postLib.count++;

    uint256 newNum = state.postLib.count;

    addPost(
      state,
      parentNum,
      newNum,
      ContentLib.Content({
        title: title,
        mimeType: mimeType,
        multihash: ContentLib.IpfsMultihash({
          hashFunction: ipfsHashFunction,
          hashLength: ipfsHashLength,
          hash: ipfsHash
        }),
        creator: msg.sender,
        creationTime: creationTime
      }),
      0,    //TODO: ruleset, default balance in parent group of newly created post
      0,    //TODO: ruleset? default tokens (shouldn't it always be 0?)
      userPermissionsFlagsMode,
      0     //TODO: ruleset, default permissions for new post
    );

    //should the user join the new group?
    UserLib.join(state, newNum); //TODO: ruleset? does it make sense to create a group but not be part of it?

    var u = UserLib.getUser(state, newNum, msg.sender);
    u.permissions = -1; //TODO: ruleset, permissions of creator

    //should the user join the parent group? TODO: ruleset
    if (!UserLib.userExists(state, parentNum, msg.sender)) {
      UserLib.join(state, parentNum);
    }

    u = UserLib.getUser(state, parentNum, msg.sender);

    CurrencyLib.awardTokensToUser(getPost(state, parentNum), u, 8, true); //TODO: ruleset; how much should they get, if anything? also TODO msg.value for money paid in


    PostCreated(parentNum, newNum, msg.sender);

    return (newNum);
  }
}
