var Group = artifacts.require("./Group.sol");

module.exports = function(deployer) {
    deployer.deploy([
        Group
    ]);
};
