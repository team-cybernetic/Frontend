import PostsContract from './contracts/Posts.json'
import getWeb3 from './utils/getWeb3'
import TruffleContract from 'truffle-contract';
import GasEstimator from './utils/GasEstimator';
import PostStore from './stores/PostStore';
import WalletStore from './stores/WalletStore';
import PostContract from './ethWrappers/PostContract';
import Ipfs from './utils/Ipfs';

function instantiateContract(web3, resolve) {
  /*
  * SMART CONTRACT EXAMPLE
    *
    * Normally these functions would be called in the context of a
    * state management library, but for convenience I've placed them here.
    */

  const postsContract = TruffleContract(PostsContract);
  postsContract.setProvider(web3.currentProvider);
  postsContract.defaults({
    gasLimit: '5000000'
  });
  postsContract.deployed().then((instance) => {
    [
      GasEstimator,
      PostStore,
      WalletStore,
    ].forEach((toInitialize) => toInitialize.initialize(web3, instance));
    PostContract.initialize(web3, instance, postsContract);
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
