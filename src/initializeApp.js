import RootGroupContractJson from './contracts/Group.json'
import getWeb3 from './utils/getWeb3'
import TruffleContract from 'truffle-contract';
import GroupStore from './stores/GroupStore';
import Wallet from './models/Wallet';
import GasEstimator from './utils/GasEstimator';
import Ipfs from './utils/Ipfs';

export default function initializeApp() {
  return new Promise((resolve, reject) => {
    getWeb3().then((results) => {
      const { web3, managedWeb3 } = results;
      const groupContract = TruffleContract(RootGroupContractJson);
      groupContract.setProvider(web3.currentProvider);
      groupContract.defaults({
        gasLimit: '5000000'
      });
      groupContract.deployed().then((rootInstance) => {
        console.log("groupContract root instance deployed at address:", rootInstance.address);
        Wallet.initialize(web3, managedWeb3);
        GasEstimator.initialize(web3);
        GroupStore.initialize(web3, rootInstance, groupContract);
        Ipfs.initialize().then(resolve);
      }).catch((error) => {
        console.error('Error deploying contract: ', error);
        reject(error);
      });
    }).catch(reject);
  });
}
