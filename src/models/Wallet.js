import GasEstimator from '../utils/GasEstimator';
import TransactionConfirmationModal from '../components/TransactionConfirmationModal';

export default class Wallet {
  static web3 = null;
  static managedWeb3 = false;
  static balance = 0;
  static balanceEth = 0;
  static etherToUsdConversion = -1;

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
    fetch('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD').then((response) => {
      response.json().then((json) => this.etherToUsdConversion = json.USD);
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
