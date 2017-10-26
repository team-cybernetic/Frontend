import Blockchain from '../ethWrappers/Blockchain';
import GasEstimator from '../utils/GasEstimator';
import TransactionConfirmationModal from '../components/TransactionConfirmationModal';

export default class Wallet {
  static web3 = null;
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
    this.web3.eth.getAccounts((error, accounts) => {
      this.web3.eth.defaultAccount = accounts[0];
      this.web3.eth.getBalance(this.getAccountAddress(), (error, balance) => {
        this.balance = balance;
        console.log("account balance =", this.balance);
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
      return null;
    } else {
      return (this.weiToEther(wei) * this.etherToUsdConversion);
    }
  }
}
