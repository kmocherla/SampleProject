// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app_escrow.css";
import "../stylesheets/pure-min.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract';
var Mustache = require('./mustache.min.js');

import TimeClock from '../../build/contracts/TimeClock.json';
var TimeClockContract = contract(TimeClock);

var accounts;
var account;

var pendingTransactions;
var template;

window.App = {

  start: function() {
    var self = this;
    self.checkAccounts();
    self.initContracts();
    self.initParams();
    self.refreshDisplay();
  },

  initContracts: function() {
    TimeClockContract.setProvider(web3.currentProvider);
    TimeClockContract.defaults({from: web3.eth.coinbase});
  },

  initParams: function() {
    pendingTransactions = [];
    template = document.getElementById('template').innerHTML;
    TimeClockContract.deployed().then(function(instance) {
      document.forms['contractSelection'].timeClockContract.value = instance.address;
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error address; see log.");
    });
  },

  getIntervalString: function (value) {
    var seconds = value % 60;
    value = (value - seconds) / 60;
    var minutes = value % 60;
    value = (value - minutes) / 60;
    var hours = value % 24;
    value = (value - hours) / 24;
    var days = value
    return days + " days, " + hours + " hours, " + minutes + " minutes, " + seconds + " seconds";
  },

  hasAccessToAddress: function (addressIn) {
    return web3.eth.accounts.filter(function(userAccount) {
        return userAccount == addressIn
    }).length > 0;
  },

  displayContract: function () {
    var self = this;
    pendingTransactions = [];
    self.refreshDisplay();
  },

  setStatus: function (message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  rerenderPage: function (data) {
    if(typeof data.contractorAddress == 'undefined' || data.contractorAddress == '0x') {
      document.getElementById('templateInsert').innerHTML = "<b>Contract not found</b>";
    } else {
      data.allowUpdate = data.nextPaymentTime < new Date();
      var output = Mustache.render(template, data);
      document.getElementById('templateInsert').innerHTML = output;
    }
  },

  refreshDisplay: function () {
    var self = this;
    if (typeof TimeClockContract == 'undefined') {
        document.getElementById('templateInsert').innerHTML = "";
        return;
    }

    var templateData = {
        contractees: [],
        accounts: web3.eth.accounts,
        pendingTransactions: pendingTransactions,
        hasPendingTransactions: pendingTransactions.length > 0,
        allowUpdate : true
    };

    var timeClock;
    TimeClockContract.deployed().then(function(instance) {
      timeClock = instance;
      return timeClock.contractDetails.call();
      }).then(function(contractDetails) {
        templateData['contractDetails'] = contractDetails;
        self.rerenderPage(templateData);
      })

      .then(function() {
        return timeClock.startTime.call();
      }).then(function(startTime) {
        templateData['startTime'] = new Date(new Number(startTime.toString()) * 1000);
        self.rerenderPage(templateData);
      })

      .then(function() {
        return timeClock.getNextPaymentDate.call();
      }).then(function(nextPaymentTime) {
        templateData['nextPaymentTime'] = new Date(new Number(nextPaymentTime.toString()) * 1000);
        self.rerenderPage(templateData);
      })

      .then(function() {
        return timeClock.paymentInterval.call();
      }).then(function(paymentInterval) {
        templateData['paymentInterval'] = self.getIntervalString(paymentInterval);
        self.rerenderPage(templateData);
      })

      .then(function() {
        return timeClock.paymentsCount.call();
      }).then(function(paymentsCount) {
        templateData['paymentsCount'] = paymentsCount;
        self.rerenderPage(templateData);
      })

      .then(function() {
        return timeClock.paymentsRemaining.call();
      }).then(function(paymentsRemaining) {
        templateData['paymentsRemaining'] = paymentsRemaining;
        self.rerenderPage(templateData);
      })

      .then(function() {
        return timeClock.minimumPayment.call();
      }).then(function(minimumPayment) {
        templateData['minimumPayment'] = web3.fromWei(minimumPayment, 'ether');
        self.rerenderPage(templateData);
      })

      .then(function() {
        return timeClock.currentPaymentsCount.call();
      }).then(function(currentPaymentsCount) {
        templateData['currentPaymentsCount'] = currentPaymentsCount;
        self.rerenderPage(templateData);
      })

      .then(function() {
        return timeClock.contractorAddress.call();
      }).then(function(contractorAddress) {
        templateData['contractorAddress'] = contractorAddress;
        self.rerenderPage(templateData);
      })

      .then(function() {
        return timeClock.contracteesSize.call();
      }).then(function(contracteesSize) {
        templateData['contracteesSize'] = contracteesSize;
        self.rerenderPage(templateData);

        for (var i = 0; i < contracteesSize; i++) {
          (function(index) {
            timeClock.contractees.call(index)
            .then(function(returned) {
              if (returned[1] > 0) {
                templateData.contractees.push({
                  index: index,
                  address: returned[0],
                  balance: web3.fromWei(returned[1], 'ether'),
                  description: returned[2],
                  isContractee: self.hasAccessToAddress(returned[0])
                });
              }
              self.rerenderPage(templateData);
            }).catch(function(e) {
              console.log(e);
              self.setStatus("Error getting balance; see log.");
            });;
          })(i);
        }
      })

      .then(function() {
        return timeClock.amountInEscrow.call();
      }).then(function(amountInEscrow) {
        templateData['amountInEscrow'] = web3.fromWei(amountInEscrow, 'ether');
        self.rerenderPage(templateData);
      })

      .then(function() {
        return timeClock.contractorBalance.call();
      }).then(function(contractorBalance) {
        templateData['contractorBalance'] = web3.fromWei(contractorBalance, 'ether');
        self.rerenderPage(templateData);
      })

      .catch(function(e) {
        console.log(e);
    });
    templateData.isContractor = self.hasAccessToAddress(templateData.contractorAddress);
  },

  pay: function () {
    var self = this;
    
    var accountToPayFrom = document.forms['timeClockForm'].accountToPayFrom.value;
    var paymentAmountFromForm = document.forms['timeClockForm'].paymentAmount.value;
    var paymentAmount = web3.toWei(paymentAmountFromForm, 'ether');
    var paymentDescription = document.forms['timeClockForm'].paymentDescription.value;
    var gasAmount = document.forms['timeClockForm'].gasAmount.value;

    if (confirm("Are you sure you want to send " + paymentAmountFromForm + " ether to this TimeClock TimeClockContract?\n\n" +
            "(Note: some funds will be immediately transferred into escrow and will not be withdrawable by you)")) {

        var pendingTransaction = {
            type: "Payment",
            amount: paymentAmountFromForm + " ether",
            description: paymentDescription,
            status: "Pending",
            class: "transactionPending"
        };
        var timeClock;
        TimeClockContract.deployed().then(function(instance) {
          timeClock = instance;
          return timeClock.purchase(paymentDescription,
            {from: accountToPayFrom, value: paymentAmount, gas: gasAmount});
        }).then(function(transaction) {
            self.getTransactionStatus(pendingTransaction, transaction);
            pendingTransactions.push(pendingTransaction);
            self.refreshDisplay();
        }).catch(function(e) {
            pendingTransaction.status = "Failed:" + e.message;
            pendingTransaction.class = "transactionFailed";
            pendingTransactions.push(pendingTransaction);
            console.log(e);
            self.refreshDisplay();
        });
    }
  },

  getTransactionStatus: function (pendingTransaction, txId) {
    var transactionData = web3.eth.getTransaction(txId.tx);
    var transactionReceipt = web3.eth.getTransactionReceipt(txId.tx);
    console.log("txid:" + txId.tx + ", gas used:" + transactionReceipt.gasUsed);
    if (transactionData.gas == transactionReceipt.gasUsed) {
        pendingTransaction.status = "Transaction failed";
        pendingTransaction.class = "transactionFailed";
    } else {
        pendingTransaction.status = "Processed";
        pendingTransaction.class = "transactionProcessed";
    }
  },

  contractorWithdraw: function () {

    var self = this;
    if (confirm("This will transfer all withdrawable funds to the contractor and will cost you gas. \n\nDo you wish to proceed?")) {

      var accountToPayFrom = document.forms['contractorWithdrawForm'].accountToPayFrom.value;
      var gasAmount = document.forms['contractorWithdrawForm'].gasAmount.value;

      var pendingTransaction = {
        type: "Contractor Withdraw",
        amount: "",
        description: "Withdraw to contractor address",
        status: "Pending",
        class: "transactionPending"
      };

      var timeClock;
      TimeClockContract.deployed().then(function(instance) {
        timeClock = instance;
        return timeClock.contractorWithdraw({from: accountToPayFrom, gas: gasAmount});
      }).then(function(transaction) {
        self.getTransactionStatus(pendingTransaction, transaction);
        pendingTransactions.push(pendingTransaction);
        self.refreshDisplay();
      }).catch(function(e) {
        pendingTransaction.status = "Failed:" + e.message;
        pendingTransaction.class = "transactionFailed";
        pendingTransactions.push(pendingTransaction);
        console.log(e);
        self.refreshDisplay();
      });
    }
  },

  contracteeWithdraw: function () {

    var self = this;
    if (confirm("Are you sure you want to withdraw your remaining payments from this TimeClock TimeClockContract?\n\n(Note: this will withdraw all payments made from " + withdrawAddress + ")")) {

        var withdrawAddress = document.forms['contracteeWithdrawForm'].withdrawAddress.value;
        var gasAmount = document.forms['contracteeWithdrawForm'].gasAmount.value;
        var withdrawIndex = document.forms['contracteeWithdrawForm'].withdrawIndex.value;

        var pendingTransaction = {
            type: "Contractee Withdraw",
            amount: "",
            description: "Withdraw all Contractee balance from " + withdrawAddress,
            status: "Pending",
            class: "transactionPending"
        };

        var timeClock;
        TimeClockContract.deployed().then(function(instance) {
          timeClock = instance;
          return timeClock.contracteeWithdraw(withdrawIndex, {from: withdrawAddress, gas: gasAmount});
        }).then(function(transaction) {
            self.getTransactionStatus(pendingTransaction, transaction);
            pendingTransactions.push(pendingTransaction);
            self.refreshDisplay();
        }).catch(function(e) {
            pendingTransaction.status = "Failed:" + e.message;
            pendingTransaction.class = "transactionFailed";
            pendingTransactions.push(pendingTransaction);
            console.log(e);
            self.refreshDisplay();
        });
    }
  },

  updateContract: function () {
    var self = this;
    if (confirm("This will attempt to move the Contract to the next payment interval. This will update the 'Current payment #' and change balances.\n\n" +
        "This can only be done after the 'Next update time' has passed. This operation will cost gas.\n\n" +
        "Do you wish to proceed?"
      )) {
      var updateAddress = document.forms['updateContractForm'].accountToPayFrom.value;
      var gasAmount = document.forms['updateContractForm'].gasAmount.value;

      var pendingTransaction = {
          type: "Update",
          amount: "",
          description: "Update the Contract state.",
          status: "Pending",
          class: "transactionPending"
      };

      var timeClock;
      TimeClockContract.deployed().then(function(instance) {
        timeClock = instance;
        return timeClock.update({from: updateAddress, gas: gasAmount});
      }).then(function(transaction) {        
        self.getTransactionStatus(pendingTransaction, transaction);
        pendingTransactions.push(pendingTransaction);
        self.refreshDisplay();
      }).catch(function(e) {
        pendingTransaction.status = "Failed:" + e.message;
        pendingTransaction.class = "transactionFailed";
        pendingTransactions.push(pendingTransaction);
        alert("The TimeClockContract could not be updated." + 
          "This is normally caused by trying to update the Contract before the 'Next update time'. Error was " + e.message);
        self.refreshDisplay();
        console.log(e);
      });
    }
  },

  overlay: function (dialogName) {
    var element = document.getElementById(dialogName);
    element.style.visibility = (element.style.visibility == "visible") ? "hidden" : "visible";
  },

  checkAccounts: function() {
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

      if (typeof accounts == 'undefined') {
        accounts = web3.eth.accounts;
      }

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