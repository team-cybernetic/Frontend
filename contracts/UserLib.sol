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

  event UserProfileChanged(
    address indexed userAddress,
    string nickname,
    uint256 timestamp
  );

  struct User {
    address addr;
    uint256 number;
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

  function getUserProfile(StateLib.State storage state, address userAddress) constant internal returns (ContentLib.Content) {
    return (state.main.userProfiles[userAddress]);
  }

  function userProfileExists(StateLib.State storage state, address userAddress) constant internal returns (bool) {
    var profile = getUserProfile(state, userAddress);
    return (profile.creationTime != 0);
  }

  function setProfileChecks(ContentLib.Content content) private view returns (
    bool checksPassed,
    uint256 updateTime
  ) {

    checksPassed = false;
    updateTime = 0;

    require(content.creator != 0x0);
    //TODO: check nickname length via global ruleset
    //TODO: UTF-8 length != bytes().length
    if (bytes(content.title).length > 64)
      return;

    (checksPassed, updateTime) = ContentLib.contentCheck(content);
  }

  function setProfile(StateLib.State storage state, ContentLib.Content content) public returns (
    bool checksPassed
  ) {
    (checksPassed, content.creationTime) = setProfileChecks(content);

    if (!checksPassed)
      return;

    state.main.userProfiles[content.creator] = content;
    UserProfileChanged(content.creator, content.title, content.creationTime);
  }
}
