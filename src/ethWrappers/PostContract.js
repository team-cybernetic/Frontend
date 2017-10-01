import GasEstimator from '../utils/GasEstimator';

export default class PostContract {
  static postsContract = null;
  static postsContractInstance = null;
  static web3 = null;
  static createdPostsAwaitingPromiseResolution = {};

  static initialize(web3, postsContractInstance, postsContract) {
    this.web3 = web3;
    this.postsContract = postsContract;
    this.postsContractInstance = postsContractInstance;
    this.web3.eth.filter("pending").watch((error, txid) => {
      this.listenForPendingPostTransactions(error, txid);
    });
  }

  static setParent() {
    var address = this.postsContractInstance.address;
    return new Promise((resolve, reject) => {
      GasEstimator.estimate('setParent').then((gas) => {
        let actualGas = gas * 3;
        console.log("gas estimator estimates that this setParent call will cost", gas, "gas, actualGas =", actualGas);
        this.postsContractInstance.setParent(address,{ gas: actualGas }).then((result) => {
          this.createdPostsAwaitingPromiseResolution[result.tx] = { resolve, reject };
        }).catch((error) => {
          console.error("Error while executing createPost contract function.", error);
        });
      }).catch((error) => {
        console.error("Error while estimating gas.", error);
      });
    });
  }

  static createPost({ title, content, contentType, multiHashArray, creationTime }) {
    return new Promise((resolve, reject) => {
      GasEstimator.estimate('createPost', title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime).then((gas) => {
        console.log("double benchmark")
        let actualGas = gas * 3;
        console.log("gas estimator estimates that this createPost call will cost", gas, "gas, actualGas =", actualGas);
        console.log(multiHashArray);
        this.postsContractInstance.contract.createPost(title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime, { gas: actualGas }, (error, transactionId) => {
          if (error) {
            console.error("Error while executing createPost contract function.", error);
          } else {
            this.createdPostsAwaitingPromiseResolution[transactionId] = { resolve, reject };
          }
        });
      }).catch((error) => {
        console.error("Error while estimating gas.", error);
      });
    });
  }

  static setGroupAddress({postNum, groupAddress}) {
    return new Promise((resolve, reject) => {
      GasEstimator.estimate('setGroupAddress', postNum, groupAddress).then((gas) => {
        let actualGas = gas * 3;
        console.log("gas estimator estimates that this setGroupAddress call will cost", gas, "gas, actualGas =", actualGas);
        this.postsContractInstance.setGroupAddress(postNum, groupAddress, { gas: actualGas }).then((result) => {
          this.createdPostsAwaitingPromiseResolution[result.tx] = { resolve, reject };
        }).catch((error) => {
          console.error("Error while executing createPost contract function.", error);
        });
      }).catch((error) => {
        console.error("Error while estimating gas.", error);
      });
    });
  }

  static convertPost2Group({postNum}) {
    console.log("converting post", postNum, "to group");
    this.makeContract().then((newInstance) => {
    }).catch((err) => {
      console.log("Error while converting post to group:", err);
    });
  }

  static makeContract() {
    return new Promise((resolve, reject) => {
      this.postsContract.new({gas: 4000000}).then((newInstance) => {
        resolve(newInstance);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  static getAddress(txn) {
    return new Promise((resolve, reject) => {
        var trm = this.getTransactionReceiptMined(txn);
        resolve(trm);
    });
  }

   static getTransactionReceiptMined(txnHash, interval) { 
    var transactionReceiptAsync;
    interval = interval ? interval : 500;
    transactionReceiptAsync = function(txnHash, resolve, reject) {
        try {
            var receipt = this.web3.eth.getTransactionReceipt(txnHash);
            if (receipt == null) {
                setTimeout(function () {
                    transactionReceiptAsync(txnHash, resolve, reject);
                }, interval);
            } else {
                resolve(receipt);
            }
        } catch(e) {
            reject(e);
        }
    };

    if (Array.isArray(txnHash)) {
        var promises = [];
        txnHash.forEach(function (oneTxHash) {
            promises.push(this.web3.eth.getTransactionReceiptMined(oneTxHash, interval));
        });
        return Promise.all(promises);
    } else {
        return new Promise(function (resolve, reject) {
                transactionReceiptAsync(txnHash, resolve, reject);
            });
    }
}

  static getPost(id) {
    return this.postsContractInstance.getPostByNumber.call(id);
  }

  static getPostIds() {
    return this.postsContractInstance.getPostNumbers.call()
  }

  static listenForPendingPostTransactions(error, transactionId) {
    if (this.createdPostsAwaitingPromiseResolution[transactionId]) {
      if (error) {
        this.createdPostsAwaitingPromiseResolution[transactionId].reject(error);
      } else {
        this.createdPostsAwaitingPromiseResolution[transactionId].resolve(transactionId);
      }
      delete this.createdPostsAwaitingPromiseResolution[transactionId];
    }
  }
}
