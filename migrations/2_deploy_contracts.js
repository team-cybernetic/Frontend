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


var CyberneticChat = artifacts.require("./CyberneticChat.sol");
var PostLib = artifacts.require("./PostLib.sol");
var UserLib = artifacts.require("./UserLib.sol");
var ContentLib = artifacts.require("./ContentLib.sol");
var CurrencyLib = artifacts.require("./CurrencyLib.sol");
var PermissionLib = artifacts.require("./PermissionLib.sol");
var GroupLib = artifacts.require("./GroupLib.sol");

module.exports = function(deployer) {
  deployer.deploy(ContentLib);

  deployer.deploy(PermissionLib);

  deployer.link(PermissionLib, GroupLib);
  deployer.deploy(GroupLib);

  deployer.link(GroupLib, CurrencyLib);
  deployer.deploy(CurrencyLib);


  deployer.link(PermissionLib, UserLib);
  deployer.link(ContentLib, UserLib);
  deployer.deploy(UserLib);

  deployer.link(UserLib, PostLib);
  deployer.link(CurrencyLib, PostLib);
  deployer.link(ContentLib, PostLib);
  deployer.link(PermissionLib, PostLib);
  deployer.deploy(PostLib);

  deployer.link(UserLib, CyberneticChat);
  deployer.link(PostLib, CyberneticChat);
  deployer.link(ContentLib, CyberneticChat);
  deployer.link(CurrencyLib, CyberneticChat);
  deployer.link(PermissionLib, CyberneticChat);
  deployer.link(GroupLib, CyberneticChat);

  deployer.deploy(CyberneticChat, "Cybernetic Chat Root", "text/plain", 18, 32, "0x3e4b46fd1b9b020d87a1737ae6cfac6339e6b586fddd1e760a1d3cb1628b50da", 0);
};
