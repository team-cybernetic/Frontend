import CyberneticChatJson from './contracts/CyberneticChat.json'
import getWeb3 from './utils/getWeb3'
import Ipfs from './utils/Ipfs';
import Wallet from './models/Wallet';
import GroupStore from './stores/GroupStore';
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
      const rootContract = TruffleContract(CyberneticChatJson);
      rootContract.setProvider(web3.currentProvider);
      rootContract.defaults({
        gasLimit: 4712388,
      });
      //rootContract.linked_binary = CyberneticChatJson.networks[web3.version.network].linked_binary;
      rootContract.deployed().then((rootInstance) => {
        console.log("CyberneticChat root instance deployed at address:", rootInstance.address);
        Wallet.initialize(web3, managedWeb3);
        GasEstimator.initialize(web3);
        Blockchain.initialize(web3);
        CyberneticChat.initialize(web3, rootInstance);
        GroupStore.initialize(web3, rootInstance);
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
