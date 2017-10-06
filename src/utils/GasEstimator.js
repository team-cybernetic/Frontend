export default class GasEstimator {
  static contractInstance = null;
  static web3 = null;

  constructor(web3, contractInstance, contractTC) {
    this.web3 = web3;
    this.contractInstance = contractInstance;
    this.contractTC = contractTC;
  }

  estimate(methodName, ...args) {
    return new Promise((resolve, reject) => {
      this.contractInstance[methodName].estimateGas(...args).then((gas) => {
        resolve(gas);
      }).catch((error) => {
        console.log("error while estimating gas for '", methodName, "'(", ...args, "):", error);
        reject(error);
      });
    });
  }

  estimateContractCreation() {
    return new Promise((resolve, reject) => {
      console.log("TC:", this.contractTC);
//      console.log("CI.contract:", this.contractTC.contract);
      console.log("TC.new:", this.contractInstance.new);
//      console.log("TC.unlinked_binary:", this.contractTC.unlinked_binary);
      var args = Array.prototype.slice.call(arguments);
      var tx_params = {data: this.contractTC.unlinked_binary};
      args.push(tx_params); //TODO: all of this
      console.log("data?", this.contractInstance.contract.new.getData.apply(this.contractInstance, args));
      var contractData = this.contractTC.new.request.apply(this.contractTC, args);
      this.web3.estimateGas({data: contractData}, (error, result) => {
        console.log("GasEstimator estimates this new contract deployment will cost", result);
        if (!error) {
          resolve(result);
        } else {
          reject(error);
        }
      });
    });
  }
}
