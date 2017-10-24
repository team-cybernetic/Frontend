var Group = artifacts.require("./Group.sol");
var PostLib = artifacts.require("./PostLib.sol");
var UserLib = artifacts.require("./UserLib.sol");
var ContentLib = artifacts.require("./ContentLib.sol");
var CurrencyLib = artifacts.require("./CurrencyLib.sol");

module.exports = function(deployer) {
  deployer.deploy([
    PostLib,
    UserLib,
    ContentLib,
    CurrencyLib,
  ]);
  deployer.link(PostLib, Group);
  deployer.link(UserLib, Group);
  deployer.link(ContentLib, Group);
  deployer.link(CurrencyLib, Group);
};
