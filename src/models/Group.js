import Ipfs from '../utils/Ipfs';
import GroupContract from '../ethWrappers/GroupContract';
import GasEstimator from '../utils/GasEstimator';
import Post from './Post';
import WalletStore from '../stores/WalletStore'
import moment from 'moment';

export default class Group {
  constructor(web3, contractInstance, contractTC) {
    this.cache = {};
    this.web3 = web3;
    this.groupContractTC = contractTC;
    this.contractInstance = contractInstance;
    this.groupContract = new GroupContract(this.web3, this.contractInstance);
    this.gasEstimator = new GasEstimator(this.web3, this.contractInstance, this.groupContractTC);
    this.newPostListeners = [];
    this.registerNewPostEventListener((error, result) => {
      if (!error) {
        console.log("Group NewPost event listener got a new post:", result);
        const id = result.args.number.toString();
        const post = this.getPost(id, result.transactionHash);
        this.fireNewPostListeners(post);
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
        const creationTime = moment().unix();
        this.gasEstimator.estimate('createPost', title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime).then((gas) => {
          let actualGas = gas * 3;
          console.log("gas estimator estimates that this createPost call will cost", gas, "gas, actualGas =", actualGas);
          this.contractInstance.contract.createPost(title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime, { gas: actualGas }, (error, transactionId) => {
            if (!error) {
              this.groupContract.waitForPendingTransaction(transactionId).then((txid) => {
                console.log("waited and got a pending transaction:", txid);
                const post = this.getPost(undefined, txid);
                post.populate({
                  title,
                  content,
                  contentType,
                  multiHashArray,
                  multiHashString,
                  creator: WalletStore.getAccountAddress(),
                  creationTime,
                  transactionId: txid,
                });
                console.log("firing new post listeners with new post:", post);
                this.fireNewPostListeners(post);
                resolve(post);
              }).catch((error) => {
                reject(error);
              });





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

  getPost(id, txid) {
    if (id) {
      if (typeof(id) !== 'string') {
        id = id.toString();
      }
      if (txid) {
        //id and txid
        if (!this.cache[id]) {
          if (this.cache[txid]) {
            this.cache[id] = this.cache[txid];
            delete (this.cache[txid]);
          } else {
            this.cache[id] = new Post(this, { id, transactionId: txid });
            this.cache[id].load();
          }
        }
        return (this.cache[id]);
      } else {
        //id only
        if (!this.cache[id]) {
          this.cache[id] = new Post(this, { id });
          this.cache[id].load();
        }
        return (this.cache[id]);
      }
    } else {
      if (txid) {
        //txid only
        if (!this.cache[txid]) {
          this.cache[txid] = new Post(this, { transactionId: txid });
          this.cache[txid].load();
        }
        return (this.cache[txid]);
      } else {
        //nothing
        return (null);
      }
    }

    /*
    if (!this.cache[id]) {
      this.cache[id] = new Post(this, { id });
      this.cache[id].load();
    }
    return (this.cache[id]);
    */

  }

  loadPost(id) {
    return (this.groupContract.getPost(id));
  }

  getPosts() {
    return new Promise((resolve, reject) => {
      this.groupContract.getPostIds().then((postIds) => {
        resolve(postIds.map((bigInt) => {
          return (this.getPost(bigInt.toString()));
        }));
      }).catch((error) => {
        reject(error);
      });
    });
  }

  isAddressValid(addr) { //TODO: not copy this everywhere...
    return (this.web3.isAddress(addr) && addr !== '0x0000000000000000000000000000000000000000' && addr !== '0000000000000000000000000000000000000000');
  }

  convertPostToGroup(postNum) {
    return new Promise((resolve, reject) => {

      this.getGroupAddressOfPost(postNum).then((currentAddress) => {
        if (!this.isAddressValid(currentAddress)) {
//          this.gasEstimator.estimateContractCreation().then((gas) => { //TODO
            let gas = 1000000
            let actualGas = gas * 3;
            console.log("gas estimator estimates that this contract creation will cost", gas, "gas, actualGas =", actualGas);
            //TODO: move contract related code to GroupContract
            this.groupContractTC.new({gas: actualGas}).then((newInstance) => {
              console.log('post number ', postNum, ' created as a group with address ', newInstance.address);
              this.setGroupAddressOfPost(postNum, newInstance.address)
              resolve(newInstance.address);
            }).catch((error) => {
              console.error("Failed to create new contract:", error);
              reject(error);
            });
          /*
          }).catch((error) => {
            console.error("Failed to estimate gas for new contract:", error);
            reject(error);
          });
          */
        } else {
          console.log("There's already a group on post", postNum, "!");
        }
      });
    }).catch((error) => {
      console.error("Error with promise.", error);
      return null;
    });
  }

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

  setGroupAddressOfPost(postNum, groupAddress) {
    return new Promise((resolve, reject) => {
      this.gasEstimator.estimate('setGroupAddress', postNum, groupAddress).then((gas) => {
        let actualGas = gas * 3;
        console.log("setgroupaddress is setting post", postNum, "group to", groupAddress);
        console.log("gas estimator estimates that this setGroupAddressOfPost call will cost", gas, "gas, actualGas =", actualGas);
        this.contractInstance.setGroupAddress(postNum, groupAddress.valueOf(), { gas: actualGas }).then((result) => {
          console.log("PostContract.setGroupAddressOfPost result:", result);
          resolve(result);
        }).catch((error) => {
          console.error("PostContract.setGroupAddressOfPost Error while setting group address:", error);
          reject(error);
        });
      }).catch((error) => {
        console.error("PostContract.setGroupAddressOfPost Error while estimating gas:", error);
        reject(error);
      });
    });
  }

  registerNewPostEventListener(callback) {
    return (this.groupContract.registerNewPostEventListener(callback));
  }

  registerEventListener(eventName, callback) {
    return (this.groupContract.registerEventListener(eventName, callback));
  }

  unregisterEventListener(handle) {
    return (this.groupContract.unregisterEventListener(handle));
  }

  registerNewPostListener(callback) {
    console.log("registering new post listener:", callback);
    this.newPostListeners.push(callback);
    console.log("now there's", this.newPostListeners.length, "of them");
    return ({
      num: this.newPostListeners.length,
    });
  }

  fireNewPostListeners(post) {
    this.newPostListeners.forEach((listener, idx) => {
      console.log("firing new post listener", idx);
      listener(post);
    });
  }
}

