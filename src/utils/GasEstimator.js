import CyberneticChat from '../blockchain/CyberneticChat';

const GAS_MULTIPLIER = 2.5; //this ensures the calculated gas amount will actually work

export default class GasEstimator {
  static web3 = null;

  static initialize(web3) {
    this.web3 = web3;
  }

  static estimate(methodName, ...args) {
    return new Promise((resolve, reject) => {
      CyberneticChat.getContractInstance()[methodName].estimateGas(...args).then((gas) => {
        resolve(Math.ceil(gas * GAS_MULTIPLIER));
      }).catch(reject);
    });
  }
}
