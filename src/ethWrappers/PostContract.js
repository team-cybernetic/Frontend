import GasEstimator from '../utils/GasEstimator';

export default class PostContract {
  static postsContractInstance = null;
  static web3 = null;
  static createdPostsAwaitingPromiseResolution = {};

  static initialize(web3, postsContractInstance) {
    this.web3 = web3;
    this.postsContractInstance = postsContractInstance;
    this.web3.eth.filter("pending").watch((error, txid) => this.listenForPendingPostTransactions(error, txid));
  }

  static createPost({ title, content, contentType, multiHashArray, creationTime }) {
    return new Promise((resolve, reject) => {
      GasEstimator.estimate('createPost', title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime).then((gas) => {
        let actualGas = gas * 3;
        console.log("gas estimator estimates that this createPost call will cost", gas, "gas, actualGas =", actualGas);
        this.postsContractInstance.createPost(title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime, { gas: actualGas }).then((result) => {
          this.createdPostsAwaitingPromiseResolution[result.tx] = { resolve, reject };
        }).catch((error) => {
          console.error("Error while executing createPost contract function.", error);
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
        this.createdPostsAwaitingPromiseResolution[transactionId].resolve(transactionId);
      } else {
        this.createdPostsAwaitingPromiseResolution[transactionId].reject(error);
      }
      delete this.createdPostsAwaitingPromiseResolution[transactionId];
    }
  }
}
