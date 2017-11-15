pragma solidity ^0.4.11;

import "./ContentLib.sol";
import "./CurrencyLib.sol";
import "./PostLib.sol";
import "./UserLib.sol";
import "./PermissionLib.sol";
import "./StateLib.sol";
import "./GroupLib.sol";

contract CyberneticChat {

  StateLib.State state;

  event PostCreated(
    uint256 indexed parentNumber,
    uint256 indexed postNumber,
    address indexed userAddress
  );
  event PostLocked(
    uint256 indexed parentNumber,
    uint256 indexed postNumber,
    address indexed userAddress
  );
  event PostUnlocked(
    uint256 indexed parentNumber,
    uint256 indexed postNumber,
    address indexed userAddress
  );
  event PostBalanceChanged(
    uint256 indexed parentNumber,
    uint256 indexed postNumber,
    uint256 amount,
    bool increased
  );
  event PostTokensChanged(
    uint256 indexed postNumber,
    uint256 amount,
    bool increased
  );


  event UserProfileChanged(
    address indexed userAddress,
    string nickname,
    uint256 timestamp
  );

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
  event UserBalanceChanged(
    uint256 indexed parentNumber,
    address indexed userAddress,
    uint256 amount,
    bool increased
  );



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

  function CyberneticChat(
    string title,
    string mimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    uint256 creationTime
  ) public {
    //TODO: initial setup on libraries as needed
    PostLib.createPost(
      state,
      1, //it will be post number 1, with parent number 1
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
      true //flags mode
    );
    state.main.initialized = true;
  }

  function postExists(uint256 num) constant public returns (bool) {
    return (PostLib.postExists(state, num));
  }

  function getPost(uint256 num) constant public returns (
    uint256 number,
    uint256 parentNum,
    string title,
    string mimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    address creator,
    uint256 creationTime,
    uint256 balance,
    uint256 tokens,
    int256 permissions
  ) {
    var post = PostLib.getPost(state, num);
    return (
      post.number,
      post.parentNum,
      post.contents.title,
      post.contents.mimeType,
      post.contents.multihash.hashFunction,
      post.contents.multihash.hashLength,
      post.contents.multihash.hash,
      post.contents.creator,
      post.contents.creationTime,
      post.balance,
      post.group.tokens,
      post.permissions
    );
  }

  function getSubposts(uint256 num) constant public returns (uint256[]) {
    return (GroupLib.getSubposts(state, GroupLib.getGroup(state, num)));
  }

  function createPost(
    uint256 parentNum,
    string title,
    string mimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    uint256 creationTime,
    bool userPermissionsFlagsMode
  ) public returns (
    uint256 newPostNum
  ) {
    return (PostLib.createPost(
      state,
      parentNum,
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
      userPermissionsFlagsMode
    ));
  }

  function userExists(uint256 parentNum, address addr) constant public returns (bool) {
    return (GroupLib.userExists(state, GroupLib.getGroup(state, parentNum), addr));
  }

  function joinGroup(uint256 parentNum) public returns (bool) {
    //TODO: payable
    GroupLib.joinGroup(state, GroupLib.getGroup(state, parentNum));
  }

  function leaveGroup(uint256 parentNum) public returns (bool) { 
    GroupLib.leaveGroup(state, GroupLib.getGroup(state, parentNum));
  }

  function getUsers(uint256 parentNum) constant public returns (address[]) {
    return (GroupLib.getUsers(state, GroupLib.getGroup(state, parentNum)));
  }

  function userProfileExists(address userAddress) constant public returns (bool) {
    return (UserLib.userProfileExists(state, userAddress));
  }

  function getUserProfile(address userAddress) constant public returns (
    string nickname,
    string profileMimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    uint256 profileLastUpdateTime
  ) {
    var profile = UserLib.getUserProfile(state, userAddress);
    return (
      profile.title,
      profile.mimeType,
      profile.multihash.hashFunction,
      profile.multihash.hashLength,
      profile.multihash.hash,
      profile.creationTime
    );
  }

  function setUserProfile(
    string nickname,
    string profileMimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash
  ) public returns (bool) {
    return (UserLib.setProfile(
      state,
      ContentLib.Content({
        title: nickname,
        mimeType: profileMimeType,
        multihash: ContentLib.IpfsMultihash({
          hashFunction: ipfsHashFunction,
          hashLength: ipfsHashLength,
          hash: ipfsHash
        }),
        creator: msg.sender,
        creationTime: block.timestamp
      })
    ));
  }

  function getUserProperties(uint256 parentNum, address userAddress) constant public returns (
    uint256 parentNumber,
    uint256 joinTime,
    uint256 balance,
    int256 permissions,
    bool joined,
    bool banned,
    string banReason
  ) {
    var user = GroupLib.getUserPropertiesRaw(state, GroupLib.getGroup(state, parentNum), userAddress);
    return (
      parentNum,
      user.joinTime,
      user.balance,
      user.permissions,
      user.joined,
      user.banned,
      user.banReason
    );
  }

  function transferTokensToUser(uint256 parentNum, address userAddress, uint256 amount, bool increase) public {
    CurrencyLib.transferTokensToUser(state, GroupLib.getGroup(state, parentNum), userAddress, amount, increase);
  }

  function transferTokensToPost(uint256 parentNum, uint256 num, uint256 amount, bool increase) public {
    CurrencyLib.transferTokensToPost(state, GroupLib.getGroup(state, parentNum), PostLib.getPost(state, num), amount, increase);
  }
}

