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
