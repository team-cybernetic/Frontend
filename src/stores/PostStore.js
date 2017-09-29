import Ipfs from '../utils/Ipfs';
import PostContract from '../ethWrappers/PostContract';
import Post from '../models/Post';

export default class PostStore {
  static postsContractInstance = null;
  static web3 = null;
  static agnosticNewPostListeners = {};
  static transactionIdListeners = {};
  static cache = {};

  static initialize(web3, postsContractInstance) {
    this.web3 = web3;
    this.postsContractInstance = postsContractInstance;
    const watchEvent = this.postsContractInstance.NewPost({}, {fromBlock: this.web3.eth.blockNumber, toBlock: 'latest'});
    watchEvent.watch((error, response) => {
      if (!error) {
        const id = response.args.number.c[0];
        Object.keys(this.agnosticNewPostListeners).forEach((object) => {
          this.agnosticNewPostListeners[object](this.getPost(id));
        });
        if (this.transactionIdListeners[response.transactionHash]) {
          this.transactionIdListeners[response.transactionHash](id);
          delete this.transactionIdListeners[response.transactionHash];
        }
      }
    });
  }

  static createPost(title, content, contentType) {
    return new Promise((resolve, reject) => {
      Ipfs.saveContent(content).then((multiHashString) => {
        console.log("ipfs hash: ", multiHashString);
        const multiHashArray = Ipfs.extractMultiHash(multiHashString);
        const post = new Post({ title, content, contentType, multiHashArray, multiHashString });
        PostContract.createPost(post).then((transactionId) => {
          post.transactionId = transactionId;
          resolve(post);
        }).catch((error) => {
          console.error("Error saving post to the blockchain.", error);
          reject("Error saving post to the blockchain.");
        });
      }).catch((error) => {
        console.error("Error saving content to IPFS.", error);
        reject("Error saving content to IPFS.");
      });
    });
  }

  static getPost(id) {
    if (!this.cache[id]) {
      this.cache[id] = new Post({ id });
    }
    return this.cache[id];
  }

  static getPosts() {
    return new Promise((resolve) => {
      PostContract.getPostIds().then((postIds) => {
        resolve(postIds.map((bigInt) => this.getPost(bigInt.c[0])));
      }).catch(console.error);
    });
  }

  static addNewPostListener(object, callback) {
    this.agnosticNewPostListeners[object] = callback;
  }

  static addTransactionIdListener(transactionId, callback) {
    this.transactionIdListeners[transactionId] = callback;
  }

  static removeNewPostListener(object) {
    delete this.agnosticNewPostListeners[object];
  }
}
