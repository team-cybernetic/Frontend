pragma solidity ^0.4.11;

import "./ContentLib.sol";
import "./PostLib.sol";
import "./UserLib.sol";

contract Group {

  ContentLib.Content contents; //the contents of this group

  using PostLib for PostLib.State;
  PostLib.State postlib;

  using UserLib for UserLib.State;
  UserLib.State userlib;

  event PostCreated(uint256 indexed postNumber);
  event SubgroupCreated(uint256 indexed postNumber, address groupAddress);
  event UserJoined(uint256 indexed userNumber, address indexed userAddress);
  event UserLeft(uint256 indexed userNumber, address indexed userAddress);
  event UserBalanceChanged(uint256 indexed userNumber, int256 amount);

  function Group(string title, string contentType, uint8 ipfsHashFunction, uint8 ipfsHashLength, bytes ipfsHash, uint256 creationTime) payable {
    require(ipfsHashLength == ipfsHash.length);

    contents.title = title;
    contents.mimeType = contentType;
    contents.multihash.hashFunction = ipfsHashFunction;
    contents.multihash.hashLength = ipfsHashLength;
    contents.multihash.hash = ipfsHash;
    contents.creator = msg.sender;

    if (!userExistsByAddress(contents.creator)) {
      joinGroup();
    }

    if (creationTime > block.timestamp || creationTime <= (block.timestamp - 1 hours)) {
      //TODO ruleset? moving average across all posts in the last hour?
      creationTime = block.timestamp;
      //timestamp was invalid, just get the best time we can from the block
    }

    contents.creationTime = creationTime;
  }

  function postExistsByNumber(uint256 num) returns (bool) {
    return (postlib.postExistsByNumber(num));
  }


  function getPostByNumber(uint256 num) returns (
    string title,
    uint256 number,
    string mimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    address creator,
    uint256 creationTime,
    address groupAddress,
    int256 balance,
    int256 permissions
  ) {
    PostLib.Post memory p = postlib.getPostByNumber(num);
    return (
      p.contents.title,
      p.number,
      p.contents.mimeType,
      p.contents.multihash.hashFunction,
      p.contents.multihash.hashLength,
      p.contents.multihash.hash,
      p.contents.creator,
      p.contents.creationTime,
      p.groupAddress,
      p.balance,
      p.permissions
    );
  }

  function setGroupAddressOfPost(uint256 num, address groupAddress) {
    postlib.setGroupAddressOfPost(num, groupAddress);
  }

  function getPostNumbers() constant returns (uint256[]) {
    return (postlib.numbers);
  }


  function createPost(
    string title,
    string mimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    uint256 creationTime
  ) returns (uint256) {
    return (postlib.createPost(
      userlib,
      title,
      mimeType,
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      creationTime
    ));
  }

  function userExistsByAddress(address addr) returns (bool) {
    return (userlib.userExistsByAddress(addr));
  }

  function userExistsByNumber(uint256 num) returns (bool) {
    return (userlib.userExistsByNumber(num));
  }

  function joinGroup() {
    //TODO: payable
    userlib.join();
  }

  function leaveGroup() { 
    userlib.leave();
  }

  function getUserNumbers() returns (uint256[]) {
    return (userlib.numbers);
  }

  function getUserAddresses() returns (address[]) {
    return (userlib.addresses);
  }

  function getUserByAddress(address userAddress) returns (
    string nickname,
    uint256 number,
    string profileMimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    address addr,
    uint256 joinTime,
    address directAddress,
    int256 balance,
    int256 permissions
  ) {
    UserLib.User memory u = userlib.getUserByAddress(userAddress);
    return (
      u.contents.title,
      u.number,
      u.contents.mimeType,
      u.contents.multihash.hashFunction,
      u.contents.multihash.hashLength,
      u.contents.multihash.hash,
      u.contents.creator,
      u.contents.creationTime,
      u.directAddress,
      u.balance,
      u.permissions
    );
  }

  function getUserByNumber(uint256 num) returns (
    string nickname,
    uint256 number,
    string profileMimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    address addr,
    uint256 joinTime,
    address directAddress,
    int256 balance,
    int256 permissions
  ) {
    UserLib.User memory u = userlib.getUserByNumber(num);
    return (
      u.contents.title,
      u.number,
      u.contents.mimeType,
      u.contents.multihash.hashFunction,
      u.contents.multihash.hashLength,
      u.contents.multihash.hash,
      u.contents.creator,
      u.contents.creationTime,
      u.directAddress,
      u.balance,
      u.permissions
    );
  }

  /*
  function transferTokensToUser(address _userAddress, int256 _amount) returns (bool success) {
    require(userExistsByAddress(msg.sender));
    require(userExistsByAddress(_userAddress));
    if (_amount != 0) {
      User memory sender = usersByAddress[msg.sender];
      User memory receiver = usersByAddress[_userAddress];
      if (_amount > 0) {
        if (sender.balance >= _amount &&
            receiver.balance + _amount > receiver.balance) {
          awardTokensToUser(sender, _amount * -1);
          awardTokensToUser(receiver, _amount);
          //TODO: ruleset taxes?
          return (true);
        } else {
          return (false);
        }
      } else {
        if (sender.balance >= (_amount * -1) &&
            receiver.balance + _amount < receiver.balance) {
          awardTokensToUser(sender, _amount); //negative amount decreases when adding
          awardTokensToUser(receiver, _amount);
          //TODO: ruleset taxes, not 1:1 deduction?
          return (true);
        } else {
          return (false);
        }
      }
    } else {
      return (true);
    }
  }

  //internal function, does _no_ sanity checks (like _user.number != 0)
  function awardTokensToUser(User _user, int256 _amount) private {
    _user.balance += _amount;
    UserBalanceChanged(_user.number, _amount);
  }
  */

  function getTitle() returns (string) {
    return (contents.title);
  }

  function getContentType() returns (string) {
    return (contents.mimeType);
  }

  function getContentAddress() returns (uint8, uint8, bytes) {
    return (
      contents.multihash.hashFunction,
      contents.multihash.hashLength,
      contents.multihash.hash
    );
  }

  function getCreator() returns (address) {
    return (contents.creator);
  }

  function getCreationTime() returns (uint256) {
    return (contents.creationTime);
  }


}

