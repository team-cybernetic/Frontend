pragma solidity ^0.4.11;

import "./CyberneticChat.sol";
import "./UserLib.sol";
import "./PostLib.sol";
import "./CurrencyLib.sol";
import "./PermissionLib.sol";

library StateLib {

  struct Main {
    mapping (uint256 => PostLib.Post) posts;
    mapping (address => ContentLib.Content) userProfiles;
    bool initialized;
  }

  struct State {
    Main main;
    PostLib.State postLib;
    UserLib.State userLib;
    PermissionLib.State permissionLib;
    CurrencyLib.State currencyLib;
  }
}
