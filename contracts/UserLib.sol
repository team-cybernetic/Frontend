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
    address addr;
    uint256 parentNum;
    uint256 joinTime;
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

  function getUserProfile(StateLib.State storage state, address userAddress) constant internal returns (ContentLib.Content) {
    return (state.main.userProfiles[userAddress]);
  }

  function userProfileExists(StateLib.State storage state, address userAddress) constant internal returns (bool) {
    var profile = getUserProfile(state, userAddress);
    return (profile.creationTime != 0);
  }

  function setProfileChecks(
//    StateLib.State storage state,
    address userAddress,
    string nickname,
    string profileMimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    uint256 updateTime
  ) private view returns (
    uint256 _updateTime
  ) {

    require(userAddress != 0x0);
    //TODO: check nickname length via global ruleset
    //TODO: UTF-8 length != bytes().length
    require(bytes(nickname).length <= 64);

    bool checksPassed;
    (checksPassed, _updateTime) = ContentLib.contentCheck(
//      state,
      nickname,
      profileMimeType,
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      updateTime
    );
    require(checksPassed);
  }

  function setProfile(
    StateLib.State storage state,
    address userAddress,
    string nickname,
    string profileMimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    uint256 updateTime
  ) public {
    (updateTime) = setProfileChecks(
//      state,
      userAddress,
      nickname,
      profileMimeType,
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      updateTime
    );

    state.main.userProfiles[userAddress] = ContentLib.Content({
      title: nickname,
      mimeType: profileMimeType,
      multihash: ContentLib.IpfsMultihash({
        hashFunction: ipfsHashFunction,
        hashLength: ipfsHashLength,
        hash: ipfsHash
      }),
      creator: userAddress,
      creationTime: updateTime
    });
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
        addr: msg.sender,
        balance: 0, //TODO: ruleset
        joined: true,
        joinTime: block.timestamp,
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

    //TODO: send the user their ether, based on ruleset
    removeUser(state, parentNum, msg.sender);
  }

}
