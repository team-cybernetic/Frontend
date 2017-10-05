import Ipfs from '../utils/Ipfs';
import GroupContract from '../ethWrappers/GroupContract';
import GasEstimator from '../utils/GasEstimator';
import Post from './Post';
import moment from 'moment';

export default class Group {
  constructor(web3, contractInstance) {
    this.cache = {};
    this.web3 = web3;
    this.contractInstance = contractInstance;
    this.groupContract = new GroupContract(this.web3, this.contractInstance);
    this.groupContract.registerNewPostEventListener((error, response) => {
      if (!error) {
        console.log("Group NewPost event listener got a new post:", response);
        /*
        //TODO
        const id = response.args.number.c[0]; //TODO: bigint to string?
        Object.keys(this.agnosticNewPostListeners).forEach((key) => {
          const post = this.getPost(id);
          post.transactionId = response.transactionHash;
          this.agnosticNewPostListeners[key](post);
        });
        if (this.transactionIdListeners[response.transactionHash]) {
          this.transactionIdListeners[response.transactionHash](id);
          delete this.transactionIdListeners[response.transactionHash];
        }
        */
      }
    });

  }

  createPost({title, content, contentType}) {
    return new Promise((resolve, reject) => {
      Ipfs.saveContent(content).then((multiHashString) => {
        const multiHashArray = Ipfs.extractMultiHash(multiHashString);
        const creationTime = moment.unix();
        const post = new Post({ title, content, contentType, multiHashArray, multiHashString, creationTime});
        GasEstimator.estimate('createPost', title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime).then((gas) => {
          let actualGas = gas * 3;
          console.log("gas estimator estimates that this createPost call will cost", gas, "gas, actualGas =", actualGas);
          this.contractInstance.contract.createPost(title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime, { gas: actualGas }, (error, transactionId) => {
            if (!error) {
              /*
              //TODO
              this.createdPostsAwaitingPromiseResolution[transactionId] = { resolve, reject };
              post.transactionId = transactionId;
              Object.keys(this.agnosticNewPostListeners).forEach((key) => {
                this.agnosticNewPostListeners[key](post);
              });
              
              resolve(post);
              */
            } else {
              console.error("Error while executing createPost contract function:", error);
              reject(error);
            }
          });
        }).catch((error) => {
          console.error("Error while estimating gas:", error);
          reject(error);
        });
      }).catch((error) => {
        console.error("Error saving content to IPFS.", error);
        reject(error);
      });
    });
  }

  getPost(id) {
    if (!this.cache[id]) {
      this.cache[id] = new Post(this.groupContract, { id });
      this.cache[id].load();
    }
    return (this.cache[id]);
  }

  getPosts() {
    return new Promise((resolve, reject) => {
      this.groupContract.getPostIds().then((postIds) => {
        console.log("Group getPosts postIds:", postIds);
        resolve(postIds.map((bigInt) => {
          return (this.getPost(bigInt.toString()));
        }));
      }).catch((error) => {
        reject(error);
      });
    });
  }

  /*
  createPost(post) {
    return (this.postStore.createPost(post));
  }

  getPost(id) {
    return (this.postStore.getPost(id));
  }

  getPosts() {
    return (this.postStore.loadPostNumbers());
  }

  getContractInstance() {
    return (this.contractInstance);
  }
  */

  getGroupAddressOfPost(id) {
    return new Promise((resolve, reject) => {
      let post = this.getPost(id);
      post.loadHeader().then(() => {
        resolve(post.groupAddress);
      }).catch((error) => {
        reject(error);
      });
    });
  }
}

