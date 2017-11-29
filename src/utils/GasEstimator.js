/*
This file is part of Cybernetic Chat.

Cybernetic Chat is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Cybernetic Chat is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Cybernetic Chat.  If not, see <http://www.gnu.org/licenses/>.
*/


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
