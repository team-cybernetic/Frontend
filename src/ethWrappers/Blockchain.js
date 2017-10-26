
export default class Blockchain {
  static web3 = null;

  static initialize(web3) {
    this.web3 = web3;
    this.pendingTransactionListeners = [[]];
    this.latestTransactionListeners = [[]];
    this.web3.eth.filter("pending").watch((error, txid) => {
      this.firePendingTransactionListeners(error, txid);
    });
    this.web3.eth.filter("latest").watch((error, txid) => {
      this.fireLatestTransactionListeners(error, txid);
    });
  }

  static getNullAddressRaw() {
    return ('0000000000000000000000000000000000000000');
  }

  static getNullAddress() {
    return ('0x' + this.getNullAddressRaw());
  }

  static isAddressNull(addr) {
    return (!addr || addr === '0x' || addr === this.getNullAddress() || addr === this.getNullAddressRaw());
  }

  static isAddressValid(addr) {
    return (!this.isAddressNull(addr) && this.web3.isAddress(addr));
  }

  static registerPendingTransactionListener(transactionId, callback) {
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

  static unregisterPendingTransactionListener(handle) {
    if (handle) {
      let {transactionId, num} = handle;
      if (this.pendingTransactionListeners[transactionId] && Array.isArray(this.pendingTransactionListeners[transactionId])) {
        delete (this.pendingTransactionListeners[transactionId][num - 1]);
      }
    }
  }

  static waitForPendingTransaction(transactionId) {
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

  static firePendingTransactionListeners(error, transactionId) {
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

  static registerLatestTransactionListener(transactionId, callback) {
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

  static unregisterLatestTransactionListener(handle) {
    if (handle) {
      let {transactionId, num} = handle;
      if (this.latestTransactionListeners[transactionId] && Array.isArray(this.latestTransactionListeners[transactionId])) {
        delete (this.latestTransactionListeners[transactionId][num - 1]);
      }
    }
  }

  static waitForLatestTransaction(transactionId) {
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

  static fireLatestTransactionListeners(error, transactionId) {
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
