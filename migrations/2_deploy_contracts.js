var usingOraclize = artifacts.require("usingOraclize");
var Storage = artifacts.require("Storage");
var Twitter = artifacts.require("Twitter");
var TimeClock = artifacts.require("TimeClock");
var OraclizeTest = artifacts.require("OraclizeTest");

module.exports = function(deployer) {
  deployer.deploy(usingOraclize);
  deployer.deploy(Storage);
  deployer.deploy(Twitter);
  deployer.deploy(TimeClock, "This is the unit test contract",1, 1, 10, web3.toWei(0.01, 'ether'));
//  deployer.deploy(OraclizeTest);
};