import CyberneticChat from '../blockchain/CyberneticChat';

const GAS_MULTIPLIER = 1.5; //this ensures the calculated gas amount will actually work

export default class GasEstimator {
  static web3 = null;

  static initialize(web3) {
    this.web3 = web3;
  }

  static estimate(methodName, ...args) {
    return new Promise((resolve, reject) => {
      CyberneticChat.getContractInstance()[methodName].estimateGas(...args).then((gas) => {
        resolve(Math.ceil(gas * GAS_MULTIPLIER));
      }).catch((error) => {
        reject(error);
      });
    });
  }

  /*
  static estimateContractCreation() {
    return new Promise((resolve, reject) => {
      let args = Array.prototype.slice.call(arguments);
      const TC = args.shift();
      const Contract = this.web3.eth.contract(TC.abi);
      args.push({ data: TC.linked_binary });
      const data = Contract.new.getData.apply(Contract, args);
      this.web3.eth.estimateGas({ data }, (error, result) => {
        if (!error) {
          resolve(result);
        } else {
          reject(error);
        }
      });
    });
  }
  */
}
