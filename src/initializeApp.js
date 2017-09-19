import PostsContract from './contracts/Posts.json'
import getWeb3 from './utils/getWeb3'
import contract from 'truffle-contract';
import GasEstimator from './utils/GasEstimator';
import PostStore from './stores/PostStore';
import WalletStore from './stores/WalletStore';
import Ipfs from './utils/Ipfs';

function instantiateContract(web3, resolve) {
  /*
  * SMART CONTRACT EXAMPLE
    *
    * Normally these functions would be called in the context of a
    * state management library, but for convenience I've placed them here.
    */

  const postsContract = contract(PostsContract);
  postsContract.setProvider(web3.currentProvider);
  postsContract.defaults({
    gasLimit: '50000'
  });
  postsContract.deployed().then((instance) => { //once the contract is surely deployed
    [
      GasEstimator,
      PostStore,
      WalletStore,
    ].forEach((toInitialize) => toInitialize.initialize(web3, instance));
    Ipfs.initialize().then(resolve);
  }).catch((error) => {
    console.error('Error deploying contract: ', error);
  });
}

export default function initializeApp() {
  return new Promise((resolve) => {
    getWeb3().then((results) => {
      instantiateContract(results.web3, resolve);
    }).catch((error) => {
      console.error('Error finding web3: ', error.message);
      resolve();
    });
  });
}
