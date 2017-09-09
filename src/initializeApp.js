import PostsContract from './contracts/Posts.json'
import getWeb3 from './utils/getWeb3'
import contract from 'truffle-contract';
import PostStore from './stores/PostStore';
import WalletStore from './stores/WalletStore';

function instantiateContract(web3, resolve) {
  /*
  * SMART CONTRACT EXAMPLE
    *
    * Normally these functions would be called in the context of a
    * state management library, but for convenience I've placed them here.
    */

  const postsContract = contract(PostsContract);
  postsContract.setProvider(web3.currentProvider);
  postsContract.deployed().then((instance) => { //once the contract is surely deployed
    PostStore.initialize(web3, instance);
    WalletStore.initialize(web3, instance);
    resolve();
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
