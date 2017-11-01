import Blockchain from '../ethWrappers/Blockchain';
import GasEstimator from '../utils/GasEstimator';
import TransactionConfirmationModal from '../components/TransactionConfirmationModal';
import BigNumber from 'bignumber.js';

export default class Wallet {
  static web3 = null;
  static blockListener = null;
  static managedWeb3 = false;
  static balance = 0;
  static balanceEth = 0;
  static etherToUsdConversion = -1;
  static etherToUsdConversionFailures = 0;
  static etherToUsdConversionMaxFailures = 10;
  static etherConfirmationSpeeds = {};
  static etherConfirmationSpeedsFailures = 0;
  static etherConfirmationSpeedsMaxFailures = 10;

  static initialize(web3, managedWeb3) {
    this.web3 = web3;
    this.managedWeb3 = managedWeb3;
    this.balanceUpdateListeners = [];
    this.web3.eth.getAccounts((error, accounts) => {
      this.web3.eth.defaultAccount = accounts[0];
      this.web3.eth.getBalance(this.getAccountAddress(), (error, balance) => {
        this.balance = balance;
        this.fireBalanceUpdateListeners(-1, balance);
        console.log("account balance =", this.weiToEther(this.balance).toLocaleString());
      });
    });
    this.blockListener = Blockchain.registerLatestBlockListener((error, blockid) => {
      this.web3.eth.getBalance(this.getAccountAddress(), (error, balance) => {
        if (!error) {
          if (!balance.equals(this.balance)) {
            const oldBalance = this.balance;
            this.balance = balance;
            this.fireBalanceUpdateListeners(oldBalance, balance);
            console.log("account balance updated to", this.weiToEther(this.balance).toLocaleString());
          }
        }
      });
    });
    this.fetchEthUsdPrice().then((ethUsdPrice) => {
      this.etherToUsdConversion = ethUsdPrice;
      console.log("eth to usd price:", this.etherToUsdConversion);
    });
    this.fetchEthConfirmationSpeeds().then((ethConfirmationSpeeds) => {
      this.ethConfirmationSpeeds = ethConfirmationSpeeds;
      console.log("eth confirmation speeds:", this.ethConfirmationSpeeds);
    }).catch((error) => {
      console.error("Failed to fetch eth confirmation speeds", error);
    });
  }

  static fetchEthUsdPrice() {
    return new Promise((resolve, reject) => {
      fetch('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD').then((response) => {
        this.etherToUsdConversionFailures = 0;
        response.json().then((json) => resolve(json.USD));
      }).catch((error) => {
        this.etherToUsdConversionFailures++;
        if (this.etherToUsdConversionFailures < this.etherToUsdConversionMaxFailures) {
          this.fetchEthUsdPrice().then(resolve).catch(reject);
        } else {
          reject(error);
        }
      });
    });
  }

  static fetchEthConfirmationSpeeds() {
    return new Promise((resolve, reject) => {
      fetch('https://www.eth.ttt222.org/ethgas.php').then((response) => {
        this.etherConfirmationSpeedsFailures = 0;
        response.json().then((json) => resolve(json));
      }).catch((error) => {
        this.etherConfirmationSpeedsFailures++;
        if (this.etherConfirmationSpeedsFailures < this.etherConfirmationSpeedsMaxFailures) {
          this.fetchEthConfirmationSpeeds().then(resolve).catch(reject);
        } else {
          reject(error);
        }
      });
    });
  }

  //TODO: update this so it actually runs the transaction
  static runTransaction(contract, methodName, description, ...args) {
    return GasEstimator.estimate(contract, methodName, ...args).then((gas) => {
      return new Promise((resolve, reject) => {
        if (!this.managedWeb3 && description) {
          TransactionConfirmationModal.show(gas, description, (gasPrice) => {
            resolve({ gas, gasPrice });
          }, reject);
        } else {
          resolve({ gas, gasPrice: this.defaultGasPrice() });
        }
      });
    });
  }

  static deployContract(contractTC) {
    return GasEstimator.estimateContractCreation(contractTC).then((gas) => {
      console.log("Gas estimator estimates that this contract creation will take", gas, "gas");
      return new Promise((resolve, reject) => {
        if (!this.managedWeb3) {
          TransactionConfirmationModal.show(gas, 'create this group', (gasPrice) => {
            contractTC.new({ gas, gasPrice }).then(resolve);
          }, reject);
        } else {
          contractTC.new({ gas, gasPrice: this.defaultGasPrice() }).then(resolve);
        }
      });
    });
  }

  static getAccountAddress() {
    return this.web3.eth.defaultAccount;
  }

  static getCurrentBalance() {
    return this.balance;
  }

  static getCurrentEthBalance() {
    return this.web3.fromWei(this.balance, 'ether');
  }

  static defaultGasPrice() {
    return this.web3.eth.gasPrice * 1;
  }

  static weiToEther(wei) {
    return this.web3.fromWei(wei);
  }

  static weiToUsd(wei) {
    if (this.etherToUsdConversion < 0) {
      return new BigNumber(NaN);
    } else {
      return (this.weiToEther(wei) * this.etherToUsdConversion);
    }
  }

  static minGasPrice() {
    if (this.ethConfirmationSpeeds) {
      return (Math.max(this.ethConfirmationSpeeds.safeLow, 1) / 10) * 1000000000;
    } else {
      return 0.1 * 1000000000;
    }
  }

  static maxGasPrice() {
    if (this.ethConfirmationSpeeds) {
      return (Math.min(this.ethConfirmationSpeeds.fastest, 200) / 10) * 1000000000;
    } else {
      return 20 * 1000000000;
    }
  }

  static timeEstimateForGasPrice(price) {
    const priceInGwei = price / 1000000000;
    if (this.ethConfirmationSpeeds) {
      if (priceInGwei >= this.ethConfirmationSpeeds.fast / 10) {
        return this.ethConfirmationSpeeds.fastWait + ' mins';
      } else {
        return (this.ethConfirmationSpeeds.safeLowWait - (this.ethConfirmationSpeeds.safeLowWait - this.ethConfirmationSpeeds.fastWait) * ((priceInGwei - (this.ethConfirmationSpeeds.safeLow / 10)) / (this.ethConfirmationSpeeds.fast / 10))).toFixed(1) + ' mins';
      }
    } else {
      return 'Unknown';
    }
  }

  static registerBalanceUpdateListener(callback) {
    this.balanceUpdateListeners.push(callback);
    return ({
      num: this.balanceUpdateListeners.length,
    });
  }

  static unregisterBalanceUpdateListener(handle) {
    if (handle) {
      let {num} = handle;
      delete (this.balanceUpdateListeners[num - 1]);
    }
  }

  static fireBalanceUpdateListeners(oldBalance, newBalance) {
    this.balanceUpdateListeners.forEach((listener) => {
      listener(oldBalance, newBalance);
    });
  }

}
