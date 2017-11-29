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

import "./CyberneticChat.sol";
import "./UserLib.sol";
import "./PostLib.sol";
import "./CurrencyLib.sol";
import "./PermissionLib.sol";
import "./GroupLib.sol";

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
    GroupLib.State groupLib;
  }
}
