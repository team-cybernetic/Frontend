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

  event UserProfileChanged(
    address indexed userAddress,
    string nickname,
    uint256 timestamp
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
//    uint256 count;
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
    bool checksPassed,
    uint256 _updateTime
  ) {

    checksPassed = false;
    _updateTime = 0;

    require(userAddress != 0x0);
    //TODO: check nickname length via global ruleset
    //TODO: UTF-8 length != bytes().length
    if (bytes(nickname).length > 64)
      return;

    (checksPassed, _updateTime) = ContentLib.contentCheck(
//      state,
      nickname,
      profileMimeType,
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      updateTime
    );
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
  ) public returns (
    bool checksPassed
  ) {
    (checksPassed, updateTime) = setProfileChecks(
//      state,
      userAddress,
      nickname,
      profileMimeType,
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      updateTime
    );

    if (!checksPassed)
      return;

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
    UserProfileChanged(userAddress, nickname, updateTime);
  }

  function getUsers(StateLib.State storage state, uint256 parentNum) constant internal returns (address[]) {
    return (PostLib.getPost(state, parentNum).userAddresses);
  }

  function join(StateLib.State storage state, uint256 parentNum) public {
    if (userExists(state, parentNum, msg.sender)) {
      return;
    }

    if (state.main.initialized) {
      if (!PermissionLib.userJoin(state, parentNum, msg.sender))
        return;
        //UserJoinDenied event emitted by permissionlib
    }

    var p = PostLib.getPost(state, parentNum);

    if (p.userAddressesMap[msg.sender] == 0) { //user has never been in the group before
//      state.userLib.count++;
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

      p.userAddresses.push(msg.sender);
      p.userAddressesMap[msg.sender] = p.userAddresses.length;
    } else { //user has been in the group before, just restore the user
      p.users[msg.sender].joined = true;
      p.userAddresses[p.userAddressesMap[msg.sender] - 1] = msg.sender;
    }

    UserJoined(parentNum, msg.sender);
  }

  function removeUser(StateLib.State storage state, uint256 parentNum, address userAddress) internal {
    var p = PostLib.getPost(state, parentNum);
    if (p.userAddressesMap[msg.sender] == 0) //user has never been in the group before
      return;
    p.users[userAddress].joined = false;
    p.userAddresses[p.userAddressesMap[userAddress] - 1] = address(0x0);
    UserLeft(parentNum, userAddress);
  }

  //apparently this function MUST be internal, otherwise joined=false in removeUser throws invalild opcode??
  function leave(StateLib.State storage state, uint256 parentNum) internal { 
    if (!userExists(state, parentNum, msg.sender)) {
      return;
    }

    //TODO: send the user their ether, based on ruleset
    removeUser(state, parentNum, msg.sender);
  }

}
