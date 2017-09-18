export default class GasEstimator {
  static postsContractInstance = null;
  static web3 = null;

  static initialize(web3, postsContractInstance) {
    this.web3 = web3;
    this.postsContractInstance = postsContractInstance;
  }

  static estimate(methodName, ...args) {
    return new Promise((resolve, reject) => {
      this.postsContractInstance[methodName].estimateGas(...args).then((gas) => {
        resolve(gas);
      }).catch((error) => {
          console.log("error while estimating gas for '", methodName, "'(", ...args, "):", error);
          reject(error.message);
      });
    });
  }
}
