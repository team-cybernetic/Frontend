const EVENT_POST_CREATED = 'PostCreated';
const EVENT_GROUP_CREATED = 'SubgroupCreated';
const EVENT_USER_JOINED = 'UserJoined';
const EVENT_USER_LEFT = 'UserLeft';
const EVENT_PENDING = '_pending';
const EVENT_LATEST = '_latest';

export default class GroupContract {
  constructor(web3, contractInstance) {
    this.web3 = web3;
    this.contractInstance = contractInstance;
    this.pendingTransactionListeners = [[]];
    this.latestTransactionListeners = [[]];
    this.eventListeners = [[]];
    this.web3.eth.filter("pending").watch((error, txid) => {
      this.fireEventListener(EVENT_PENDING, error, txid);
      this.firePendingTransactionListeners(error, txid);
    });
    this.web3.eth.filter("latest").watch((error, txid) => {
      this.fireEventListener(EVENT_LATEST, error, txid);
      this.fireLatestTransactionListeners(error, txid);
    });
    this.watchForEvent(EVENT_POST_CREATED, {}, (error, response) => {
      this.fireEventListener(EVENT_POST_CREATED, error, response);
    });
    this.watchForEvent(EVENT_GROUP_CREATED, {}, (error, response) => {
      this.fireEventListener(EVENT_GROUP_CREATED, error, response);
    });
    this.watchForEvent(EVENT_USER_JOINED, {}, (error, response) => {
      this.fireEventListener(EVENT_USER_JOINED, error, response);
    });
    this.watchForEvent(EVENT_USER_LEFT, {}, (error, response) => {
      this.fireEventListener(EVENT_USER_LEFT, error, response);
    });
  }

  isAddressValid(addr) {
    return (this.web3.isAddress(addr) && addr !== '0x0000000000000000000000000000000000000000' && addr !== '0000000000000000000000000000000000000000');
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

  getUserIds() {
    return (this.contractInstance.getUserNumbers.call());
  }

  userExistsByAddress(addr) {
    return (this.contractInstance.userExistsByAddress.call(addr));
  }

  userExistsByNumber(num) {
    return (this.contractInstance.userExistsByNumber.call(num));
  }

  postExistsByNumber(num) {
    return (this.contractInstance.postExistsByNumber.call(num));
  }

  getUserByNumber(num) {
    return (this.contractInstance.getUserByNumber.call(num));
  }

  getUserByAddress(address) {
    return (this.contractInstance.getUserByAddress.call(address));
  }

  waitForConfirmation(txid) {
    return new Promise((resolve, reject) => {
      let handle = this.registerLatestEventListener((error, txid) => {
        if (!error) {
          resolve(txid);
        } else {
          reject(error);
        }
        this.unregisterEventListener(handle);
      });
    });
  }

  unregisterEventListener(handle) {
    if (handle) {
      let {eventName, num} = handle;
      delete (this.eventListeners[eventName][num - 1]);
    }
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

  registerPendingEventListener(callback) {
    return (this.registerEventListener(EVENT_PENDING, callback));
  }

  registerLatestEventListener(callback) {
    return (this.registerEventListener(EVENT_LATEST, callback));
  }

  registerPostCreatedEventListener(callback) {
    return (this.registerEventListener(EVENT_POST_CREATED, callback));
  }

  registerSubgroupCreatedEventListener(callback) {
    return (this.registerEventListener(EVENT_GROUP_CREATED, callback));
  }

  registerUserJoinedEventListener(callback) {
    return (this.registerEventListener(EVENT_USER_JOINED, callback));
  }

  registerUserLeftEventListener(callback) {
    return (this.registerEventListener(EVENT_USER_LEFT, callback));
  }

  fireEventListener(eventName, error, response) {
    if (this.eventListeners[eventName] && this.eventListeners[eventName].length > 0) {
      this.eventListeners[eventName].forEach((listener) => {
        listener(error, response);
      });
    }
  }

  registerPendingTransactionListener(transactionId, callback) {
    if (!this.pendingTransactionListeners[transactionId]) {
      this.pendingTransactionListeners[transactionId] = [];
    }
    if (!Array.isArray(this.pendingTransactionListeners[transactionId])) {
      callback(this.pendingTransactionListeners[transactionId].error, this.pendingTransactionListeners[transactionId].transactionId);
      return (null);
    }
    this.pendingTransactionListeners[transactionId].push(callback);
    return ({
      transactionId,
      num: this.pendingTransactionListeners[transactionId].length,
    });
  }

  unregisterPendingTransactionListener(handle) {
    if (handle) {
      let {transactionId, num} = handle;
      if (this.pendingTransactionListeners[transactionId] && Array.isArray(this.pendingTransactionListeners[transactionId])) {
        delete (this.pendingTransactionListeners[transactionId][num - 1]);
      }
    }
  }

  waitForPendingTransaction(transactionId) {
    return new Promise((resolve, reject) => {
      this.registerPendingTransactionListener(transactionId, (error, txid) => {
        if (!error) {
          resolve(txid);
        } else {
          reject(error);
        }
      });
    });
  }

  firePendingTransactionListeners(error, transactionId) {
    if (this.pendingTransactionListeners[transactionId]) {
      if (Array.isArray(this.pendingTransactionListeners[transactionId])) {
        this.pendingTransactionListeners[transactionId].forEach((listener) => {
          listener(error, transactionId);
        });
      } //if it's not an array, we've already been through here once before, so lets just take the latest result
      this.pendingTransactionListeners[transactionId] = {
        error,
        transactionId,
      };
    }
  }

  registerLatestTransactionListener(transactionId, callback) {
    if (!this.latestTransactionListeners[transactionId]) {
      this.latestTransactionListeners[transactionId] = [];
    }
    if (!Array.isArray(this.latestTransactionListeners[transactionId])) {
      callback(this.latestTransactionListeners[transactionId].error, this.latestTransactionListeners[transactionId].transactionId);
      return (null);
    }
    this.latestTransactionListeners[transactionId].push(callback);
    return ({
      transactionId,
      num: this.latestTransactionListeners[transactionId].length,
    });
  }

  unregisterLatestTransactionListener(handle) {
    if (handle) {
      let {transactionId, num} = handle;
      if (this.latestTransactionListeners[transactionId] && Array.isArray(this.latestTransactionListeners[transactionId])) {
        delete (this.latestTransactionListeners[transactionId][num - 1]);
      }
    }
  }

  waitForLatestTransaction(transactionId) {
    return new Promise((resolve, reject) => {
      this.registerLatestTransactionListener(transactionId, (error, txid) => {
        if (!error) {
          resolve(txid);
        } else {
          reject(error);
        }
      });
    });
  }

  fireLatestTransactionListeners(error, transactionId) {
    if (this.latestTransactionListeners[transactionId]) {
      if (Array.isArray(this.latestTransactionListeners[transactionId])) {
        this.latestTransactionListeners[transactionId].forEach((listener) => {
          listener(error, transactionId);
        });
      } //if it's not an array, we've already been through here once before, so lets just take the latest result
      this.latestTransactionListeners[transactionId] = {
        error,
        transactionId,
      };
    }
  }
}
