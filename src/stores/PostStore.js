import Ipfs from '../utils/Ipfs';
import PostContract from '../ethWrappers/PostContract';
import Post from '../models/Post';
import moment from 'moment';
import GasEstimator from '../utils/GasEstimator';

//not used anymore, kept around for a little bit so we can make sure to copy everything out we need
export default class PostStore {
  groupContract = null;
  transactionIdListeners = {};
  agnosticNewPostListeners = {};
  currentPostListenerSequence = 0;
  cache = {};

  

  constructor(groupContract) {
    this.groupContract = groupContract;
    this.groupContract.watchForEvent('NewPost', {}, (error, response) => {
      if (!error) {
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
      }
    });
  }

  createPost(title, content, contentType) {
    return new Promise((resolve, reject) => {
      Ipfs.saveContent(content).then((multiHashString) => {
        const multiHashArray = Ipfs.extractMultiHash(multiHashString);
        const creationTime = moment.unix();
        const post = new Post({ title, content, contentType, multiHashArray, multiHashString, creationTime});
        GasEstimator.estimate('createPost', title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime).then((gas) => {
          let actualGas = gas * 3;
          console.log("gas estimator estimates that this createPost call will cost", gas, "gas, actualGas =", actualGas);
          const contractInstance = this.groupContract.getContractInstance();
          contractInstance.contract.createPost(title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime, { gas: actualGas }, (error, transactionId) => {
            if (!error) {
              this.createdPostsAwaitingPromiseResolution[transactionId] = { resolve, reject };
              post.transactionId = transactionId;
              Object.keys(this.agnosticNewPostListeners).forEach((key) => {
                this.agnosticNewPostListeners[key](post);
              });
              resolve(post);
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

  //async
  getPost(id) {
    if (!this.cache[id]) {
      this.cache[id] = new Post(this.groupContract, { id });
      this.cache[id].load();
    }
    return (this.cache[id]);
  }

  //sync
  /*
  loadPost(id) {
    return new Promise((resolve, reject) => {
      if (!this.cache[id]) {
        //needs to check if not already loading to prevent two calls to loadPost() from returning the partial post on the second call
        this.cache[id] = new Post({ id });
        this.cache[id].load().then(() => {
          resolve(this.cache[id]);
        });
      } else {
        resolve(this.cache[id]);
      }
    });
  }
  */

  loadPostNumbers() {
    return new Promise((resolve, reject) => {
      PostContract.getPostIds().then((postIds) => {
        resolve(postIds.map((bigInt) => this.getPost(bigInt.c[0])));
      }).catch(reject);
    });
  }

  addNewPostListener(callback) {
    this.agnosticNewPostListeners[++this.currentPostListenerSequence] = callback;
    return (this.currentPostListenerSequence);
  }

  addTransactionIdListener(transactionId, callback) {
    this.transactionIdListeners[transactionId] = callback;
  }

  removeNewPostListener(key) {
    delete this.agnosticNewPostListeners[key];
  }
}
