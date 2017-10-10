export default class GasEstimator {
  static contractInstance = null;
  static web3 = null;

  constructor(web3, contractInstance) {
    this.web3 = web3;
    this.contractInstance = contractInstance;
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
      var args = Array.prototype.slice.call(arguments);
      let TC = args.shift();
      let Contract = this.web3.eth.contract(TC.abi);
      var tx_params = {data: TC.unlinked_binary};
      args.push(tx_params);
      let data = Contract.new.getData.apply(Contract, args);
      /*
      var contractData = Contract.new.apply(Contract, {data});
      console.log("contractData", contractData);
      */
      this.web3.eth.estimateGas({data}, (error, result) => {
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
