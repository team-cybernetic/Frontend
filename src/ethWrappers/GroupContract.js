//import GasEstimator from '../utils/GasEstimator';

export default class GroupContract {

  static EVENT_NEW_POST = 'NewPost';

  constructor(web3, contractInstance) {
    this.web3 = web3;
    this.contractInstance = contractInstance;
    this.pendingTransactionListeners = [[]];
    this.latestTransactionListeners = [[]];
    this.eventListeners = [[]];
    this.web3.eth.filter("pending").watch((error, txid) => {
      this.firePendingTransactionListeners(error, txid);
    });
    this.web3.eth.filter("latest").watch((error, txid) => {
      this.fireLatestTransactionListeners(error, txid);
    });
    this.watchForEvent(GroupContract.EVENT_NEW_POST, {}, (error, response) => {
      this.fireEventListener(GroupContract.EVENT_NEW_POST, error, response);
    });

  }

  getContractInstance() {
    return (this.contractInstance);
  }

  watchEvent(eventName, filter, options, callback) {
    this.contractInstance[eventName](filter, options).watch(callback);
  }

  watchForEvent(eventName, filter, callback) {
    this.watchEvent(eventName, filter, {fromBlock: this.web3.eth.blockNumber, toBlock: 'latest'}, callback);
  }

  getPost(id) {
    return (this.contractInstance.getPostByNumber.call(id));
  }

  getPostIds() {
    return (this.contractInstance.getPostNumbers.call());
  }

  waitForConfirmation(txid) {
    return new Promise((resolve, reject) => {
      this.latestTransactonListeners[txid].push({ resolve, reject });
    });
  }

  unregisterEventListener({eventName, num}) {
    delete (this.eventListeners[eventName][num]);
  }

  registerEventListener(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(callback);
    return ({
      eventName,
      num: this.eventListeners[eventName].length,
    });
  }

  registerNewPostEventListener(callback) {
    return (this.registerEventListener(this.EVENT_NEW_POST, callback));
  }

  firePendingTransactionListeners(error, transactionId) {
    if (this.pendingTransactionListeners[transactionId] && this.pendingTransactionListeners[transactionId].length > 0) {
      this.pendingTransactionListeners[transactionId].forEach((listener) => {
        if (!error) {
          listener.resolve(transactionId);
        } else {
          listener.reject(error);
        }
      });
      delete (this.pendingTransactionListeners[transactionId]);
    }
  }

  fireLatestTransactionListeners(error, transactionId) {
    if (this.latestTransactionListeners[transactionId] && this.latestTransactionListeners[transactionId].length > 0) {
      this.latestTransactionListeners[transactionId].forEach((listener) => {
        if (!error) {
          listener.resolve(transactionId);
        } else {
          listener.reject(error);
        }
      });
      delete (this.latestTransactionListeners[transactionId]);
    }
  }

  fireEventListener(eventName, error, response) {
    if (this.eventListeners[eventName] && this.eventListeners[eventName].length > 0) {
      this.eventListeners[eventName].forEach((listener) => {
        listener(error, response);
      });
    }
  }
}
