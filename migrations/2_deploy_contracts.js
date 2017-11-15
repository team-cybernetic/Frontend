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

  deployer.deploy(CyberneticChat, "Cybernetic Chat Root", "text/plain", 18, 32, "0x671a2d8d519c51f1c33d5c05318f1f7bdbda8abd6d9cce2492d09bdebbe04551", 0);
};
