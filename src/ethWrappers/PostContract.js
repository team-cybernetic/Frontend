import GasEstimator from '../utils/GasEstimator';

export default class PostContract {
  static postsContractInstance = null;
  static web3 = null;
  static createdPostsAwaitingPromiseResolution = {};

  static initialize(web3, postsContractInstance) {
    this.web3 = web3;
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
