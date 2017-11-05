var CyberneticChat = artifacts.require("./CyberneticChat.sol");
var PostLib = artifacts.require("./PostLib.sol");
var UserLib = artifacts.require("./UserLib.sol");
var ContentLib = artifacts.require("./ContentLib.sol");
var CurrencyLib = artifacts.require("./CurrencyLib.sol");
var PermissionLib = artifacts.require("./PermissionLib.sol");

module.exports = function(deployer) {
  deployer.deploy(ContentLib);
  deployer.deploy(CurrencyLib);
  deployer.deploy(PermissionLib);

  deployer.link(PermissionLib, UserLib);
  deployer.deploy(UserLib);

  deployer.link(UserLib, PostLib);
  deployer.link(CurrencyLib, PostLib);
  deployer.link(PermissionLib, PostLib);
  deployer.deploy(PostLib);

  deployer.link(UserLib, CyberneticChat);
  deployer.link(PostLib, CyberneticChat);
  deployer.link(ContentLib, CyberneticChat);
  deployer.link(CurrencyLib, CyberneticChat);

  deployer.deploy(CyberneticChat, "title", "text/plain", 0, 0, "", 0);
};
