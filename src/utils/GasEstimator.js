import CyberneticChat from '../blockchain/CyberneticChat';
import Wallet from '../models/Wallet';

const GAS_MULTIPLIER = 1.01; //this ensures the calculated gas amount will actually work

export default class GasEstimator {
  static web3 = null;

  static initialize(web3) {
    this.web3 = web3;
  }

  static estimate(methodName, ...args) {
    return new Promise((resolve, reject) => {
      CyberneticChat.getContractInstance()[methodName].estimateGas(...args, {from: Wallet.getAccountAddress()}).then((gas) => {
        console.log("Gas estimator estimates that this transaction will actually require", gas, "gas");
        let safeGas = Math.round(gas * GAS_MULTIPLIER);
//        resolve(Math.ceil(gas * GAS_MULTIPLIER));
        switch (methodName) {
          case 'leaveGroup':
            safeGas = gas * 2; //normal is 18485, on testrpc required is 36970, but spent is still 18485???
            break;
          case 'transferTokensToUser':
            safeGas = gas * 3;
            break;
          case 'transferTokensToPost':
            safeGas = gas * 3;
            break;
          default:
            break;
        }
        console.log("Gas estimator estimates a safe amount of gas is", safeGas, "gas");
        resolve(safeGas);
      }).catch(reject);
    });
  }
}
