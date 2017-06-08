// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';

// Import our contract artifacts and turn them into usable abstractions.
import Storage from '../../build/contracts/Storage.json';
var StorageContract = contract(Storage);

import Twitter from '../../build/contracts/Twitter.json';
var TwitterContract = contract(Twitter);

var _personId;
var _uniqueId;
var _twitterScore;

var accounts;
var account;

window.App = {
  start: function() {
    var self = this;
    self.checkAccounts();
    self.initContracts();
  },

  initContracts: function() {

    StorageContract.setProvider(web3.currentProvider);
    StorageContract.defaults({from: web3.eth.coinbase});
    TwitterContract.setProvider(web3.currentProvider);
    TwitterContract.defaults({from: web3.eth.coinbase});
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  register: function() {
    console.log("Registering...");
    var self = this;

    var contract;
    StorageContract.deployed().then(function(instance) {
      contract = instance;
      return contract.register();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error register; see log.");
    });
  },

  getPersonId: function() {
    console.log("Fetching Persion ID...");
    var self = this;

    var contract;
    StorageContract.deployed().then(function(instance) {
      contract = instance;
      return contract.getPersonId.call();
    }).then(function(id) {
      _personId = id;
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getPersonId; see log.");
    });
  },

  linkTwitter: function() {

    if (_personId == null) {
      alert("Please register first before using Twitter");
      return;
    }
    console.log("Linking with Twitter...");

    var self = this;
    var twitterUsername = document.getElementById("twitterUsername").value;
    var verificationTweet = document.getElementById("verificationTweet").value;

    var contract;
    TwitterContract.deployed().then(function(instance) {
      contract = instance;
      return contract.verify(
        _personId,
        twitterUsername,
        verificationTweet,
        {from: web3.eth.coinbase, value: web3.toWei('1', 'ether'), gas: 300000});
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error twitter; see log.");
    });
  },

  verifyTweet: function() {
    var self = this;

    var contract;
    TwitterContract.deployed().then(function(instance) {
      contract = instance;
      return contract.tweet.call();
    }).then(function(tweet) {
      var tweetId = tweet.replace(/\D/g,'');
      console.log("Verification ID: " + tweetId);
      var getTweet = document.getElementById("getTweet");
      getTweet.innerHTML = tweet;
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getTweet; see log.");
    });
  },

  computeTwitterScore: function() {

    if (_personId == null) {
      alert("Please register first before using Twitter");
      return;
    }
    console.log("Computing Twitter Score...");

    var self = this;
    var twitterUsername = document.getElementById("twitterUsername").value;

    var contract;
    TwitterContract.deployed().then(function(instance) {
      contract = instance;
      return contract.getScore(
        _personId,
        twitterUsername,
        {from: web3.eth.coinbase, value: web3.toWei('1', 'ether'), gas: 300000});
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error computeTwitterScore; see log.");
    });
  },

  getTwitterScore: function() {
    var self = this;

    var contract;
    TwitterContract.deployed().then(function(instance) {
      contract = instance;
      return contract.score.call();
    }).then(function(score) {
      console.log("Twitter Score: " + score);
      var getTwitterScore = document.getElementById("getTwitterScore");
      getTwitterScore.innerHTML = score;
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getTwitterScore; see log.");
    });
  },

 checkAccounts: function() {
   // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        console.log(err);
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];
    });
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  App.start();
});
