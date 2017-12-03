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


import CyberneticChatJson from './contracts/CyberneticChat.json'
import getWeb3 from './utils/getWeb3'
import Ipfs from './utils/Ipfs';
import Wallet from './models/Wallet';
import GroupStore from './stores/GroupStore';
import UserStore from './stores/UserStore';
import PostStore from './stores/PostStore';
import GasEstimator from './utils/GasEstimator';
import CyberneticChat from './blockchain/CyberneticChat';
import Blockchain from './blockchain/Blockchain';

import TruffleContract from 'truffle-contract';

export default function initializeApp() {
  return new Promise((resolve, reject) => {
    console.log("Initializing...");
    getWeb3().then((results) => {
      const { web3, managedWeb3 } = results;
      console.log("Initializing: got web3, managed by external:", managedWeb3 ? "true" : "false");
      Wallet.rootContract = TruffleContract(CyberneticChatJson);
      Wallet.rootContract.setProvider(web3.currentProvider);
      Wallet.rootContract.defaults({
        gasLimit: 4712388,
      });
      Wallet.rootContract.deployed().then((rootInstance) => {
        console.log("CyberneticChat root instance deployed at address:", rootInstance.address);
        Wallet.initialize(web3, managedWeb3);
        GasEstimator.initialize(web3);
        Blockchain.initialize(web3);
        CyberneticChat.initialize(web3, rootInstance);
        UserStore.initialize();
        PostStore.initialize();
        GroupStore.initialize();
        Ipfs.initialize().then(resolve);
      }).catch((error) => {
        console.error('Error getting deployed instance of root contract: ', error);
        if (error.message.indexOf("has not been deployed to detected network") !== -1) {
          error.userMessage = "The Cybernetic Chat contract has not yet been deployed to this network (" + web3.version.network + ")!";
        }
        reject(error);
      });
    }).catch(reject);
  });
}
