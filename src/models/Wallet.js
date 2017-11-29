import Blockchain from '../blockchain/Blockchain';
import CyberneticChat from '../blockchain/CyberneticChat';
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
  static defaultGasPrice = 0;

  static initialize(web3, managedWeb3) {
    this.web3 = web3;
    this.managedWeb3 = managedWeb3;
    this.balanceUpdateListeners = [];
    this.web3.eth.getGasPrice((error, price) => {
      this.defaultGasPrice = price * 1;
    });
    this.web3.eth.getAccounts((error, accounts) => {
      this.web3.eth.defaultAccount = accounts[1];
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
          setTimeout(() => {
            this.fetchEthUsdPrice().then(resolve).catch(reject);
          }, 3000);
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
          setTimeout(() => {
            this.fetchEthConfirmationSpeeds().then(resolve).catch(reject);
          }, 3000);
        } else {
          reject(error);
        }
      });
    });
  }

  static runTransaction(sync, methodName, description, ...args) {
    return new Promise((resolve, reject) => {
      new Promise((resolve, reject) => {
        console.log("runTransaction(", methodName, ",", ...args, ");");
        //TODO: pre-call transaction to see if it will even succeeed
        GasEstimator.estimate(methodName, ...args).then((gas) => {
          if (!this.managedWeb3 && description) {
            TransactionConfirmationModal.show(gas, description, (gasPrice) => {
              resolve({ gas, gasPrice });
            }, reject);
          } else {
            resolve({ gas, gasPrice: this.defaultGasPrice });
          }
        }).catch((error) => {
          reject(error);
          //resolve({ gas: 4000000, gasPrice: 1 }); //TODO: remove this
        });
      }).then(({gas, gasPrice}) => {
        const options = { gas, gasPrice, from: this.getAccountAddress() };
        if (sync) {
          CyberneticChat.getContractInstance()[methodName](...args, options).then(resolve).catch(reject);
        } else {
          CyberneticChat.getContractInstance().contract[methodName](...args, options, (error, txid) => {
            if (!error) {
              resolve(txid);
            } else {
              reject(error);
            }
          });
        }
      }).catch((error) => {
        if (!error.cancel) {
          console.error("Failed to run " + (sync ? '' : 'a') + "synchronous transaction:", error);
        }
        reject(error);
      });
    });
  }

  static runTransactionSync(methodName, description, ...args) {
    return (this.runTransaction(true, methodName, description, ...args));
  }

  static runTransactionAsync(methodName, description, ...args) {
    return (this.runTransaction(false, methodName, description, ...args));
  }

  static getAccountAddress() {
    return this.web3.eth.defaultAccount;
  }

  static getCurrentBalance() {
    return this.balance;
  }

  static getCurrentEthBalance() {
    return !!this.balance ? this.web3.fromWei(this.balance, 'ether') : new BigNumber(0);
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
