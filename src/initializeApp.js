import PostsContract from './contracts/Posts.json'
import getWeb3 from './utils/getWeb3'
import contract from 'truffle-contract';
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

  const postsContract = contract(PostsContract);
  postsContract.setProvider(web3.currentProvider);
  postsContract.defaults({
    gasLimit: '5000000'
  });
  postsContract.deployed().then((instance) => { //once the contract is surely deployed
    [
      GasEstimator,
      PostStore,
      PostContract,
      WalletStore,
    ].forEach((toInitialize) => toInitialize.initialize(web3, instance));
    Ipfs.initialize().then(resolve);
  }).catch((error) => {
    console.error('Error deploying contract: ', error);
  });
}

export default function initializeApp() {
  return new Promise((resolve) => {
    if (window.history.state == null) {
        window.history.pushState({ path: "/" }, "Blokkchat: /", "/");
    }
    window.onpopstate = (ev) => {
      console.log("state popped to:", ev.state.path); //TODO: probably a better way of doing this state management
    };
    getWeb3().then((results) => {
      instantiateContract(results.web3, resolve);
    }).catch((error) => {
      console.error('Error finding web3: ', error.message);
      resolve();
    });
  });
}
