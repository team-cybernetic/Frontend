import RootGroupContractJson from './contracts/Group.json'
import getWeb3 from './utils/getWeb3'
import TruffleContract from 'truffle-contract';
import GroupStore from './stores/GroupStore';
import WalletStore from './stores/WalletStore';
import Ipfs from './utils/Ipfs';

function instantiateContract(web3, resolve) {
  return new Promise((resolve, reject) => {
    const groupContract = TruffleContract(RootGroupContractJson);
    groupContract.setProvider(web3.currentProvider);
    groupContract.defaults({
      gasLimit: '5000000'
    });
    groupContract.deployed().then((rootInstance) => {
      console.log("groupContract root instance deployed at address:", rootInstance.address);
      [
        WalletStore,
      ].forEach((toInitialize) => toInitialize.initialize(web3, rootInstance));
      GroupStore.initialize(web3, rootInstance, groupContract);
      Ipfs.initialize().then(resolve);
    }).catch((error) => {
      console.error('Error deploying contract: ', error);
      reject(error);
    });
  });
}

export default function initializeApp() {
  return new Promise((resolve, reject) => {
    getWeb3().then((results) => {
      instantiateContract(results.web3).then(resolve).catch(reject);
    }).catch(reject);
  });
}
