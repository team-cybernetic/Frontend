pragma solidity ^0.4.11;

import "./ContentLib.sol";
import "./CurrencyLib.sol";
import "./PostLib.sol";
import "./UserLib.sol";
import "./PermissionLib.sol";
import "./StateLib.sol";

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
      title,
      mimeType,
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      creationTime,
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
    var p = PostLib.getPost(state, num);
    return (
      p.number,
      p.parentNum,
      p.contents.title,
      p.contents.mimeType,
      p.contents.multihash.hashFunction,
      p.contents.multihash.hashLength,
      p.contents.multihash.hash,
      p.contents.creator,
      p.contents.creationTime,
      p.balance,
      p.tokens,
      p.permissions
    );
  }

  function getChildren(uint256 num) constant public returns (uint256[]) {
    return (PostLib.getChildren(state, num));
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
  ) public returns (uint256) {
    return (PostLib.createPost(
      state,
      parentNum,
      title,
      mimeType,
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      creationTime,
      userPermissionsFlagsMode
    ));
  }

  function userExists(uint256 parentNum, address addr) constant public returns (bool) {
    return (UserLib.userExists(state, parentNum, addr));
  }

  function joinGroup(uint256 parentNum) public {
    //TODO: payable
    UserLib.join(state, parentNum);
  }

  function leaveGroup(uint256 parentNum) public { 
    UserLib.leave(state, parentNum);
  }

  function getUsers(uint256 parentNum) constant public returns (address[]) {
    return (UserLib.getUsers(state, parentNum));
  }

  function getUser(uint256 parentNum, address userAddress) constant public returns (
    uint256 parentNumber,
    string nickname,
    string profileMimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    address addr,
    uint256 joinTime,
    uint256 balance,
    int256 permissions,
    bool banned
  ) {
    var u = UserLib.getUser(state, parentNum, userAddress);
    return (
      u.parentNum,
      u.contents.title,
      u.contents.mimeType,
      u.contents.multihash.hashFunction,
      u.contents.multihash.hashLength,
      u.contents.multihash.hash,
      u.contents.creator,
      u.contents.creationTime,
      u.balance,
      u.permissions,
      u.banned
    );
  }

  function getUserBanReason(uint256 parentNum, address userAddress) constant public returns (string) {
    var u = UserLib.getUser(state, parentNum, userAddress);
    return (u.banReason);
  }

  function transferTokensToUser(uint256 parentNum, address userAddress, uint256 amount, bool increase) public {
    CurrencyLib.transferTokensToUser(state, PostLib.getPost(state, parentNum), userAddress, amount, increase);
  }

  function transferTokensToPost(uint256 parentNum, uint256 num, uint256 amount, bool increase) public {
    CurrencyLib.transferTokensToPost(state, PostLib.getPost(state, parentNum), PostLib.getPost(state, num), amount, increase);
  }
}

