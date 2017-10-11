import Ipfs from '../utils/Ipfs';
import GroupContract from '../ethWrappers/GroupContract';
import GasEstimator from '../utils/GasEstimator';
import Post from './Post';
import User from './User';
import WalletStore from '../stores/WalletStore'
import moment from 'moment';

export default class Group {
  constructor(web3, contractInstance, contractTC) {
    this.postCache = [];
    this.userCache = [];
    this.web3 = web3;
    this.groupContractTC = contractTC;
    this.contractInstance = contractInstance;
    this.groupContract = new GroupContract(this.web3, this.contractInstance);
    this.gasEstimator = new GasEstimator(this.web3, this.contractInstance);
    this.newPostListeners = [];
    this.newUserListeners = [];
    this.registerNewPostEventListener((error, result) => {
      if (!error) {
        const id = result.args.postNumber.toString();
        const post = this.getPost(id, result.transactionHash);
        this.fireNewPostListeners(post);
      }
    });
    this.registerNewGroupEventListener((error, result) => {
      if (!error) {
        const id = result.args.postNumber.toString();
        const post = this.getPost(id, result.transactionHash);
        const addr = result.args.groupAddress;
        post.populate({
          groupAddress: addr,
        });
      }
    });
    this.registerNewUserEventListener((error, result) => {
      if (!error) {
        console.log("got new user:", result);
        const id = result.args.userNumber.toString();
        const user = this.getUser(id);
        this.fireNewUserListeners(user);
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
                this.fireNewPostListeners(post);
                resolve(post);
              }).catch((error) => {
                reject(error);
              });
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
        if (!this.postCache[id]) {
          if (this.postCache[txid]) {
            this.postCache[id] = this.postCache[txid];
            delete (this.postCache[txid]);
          } else {
            this.postCache[id] = new Post(this, { id, transactionId: txid });
            this.postCache[id].load();
          }
        }
        return (this.postCache[id]);
      } else {
        //id only
        if (!this.postCache[id]) {
          this.postCache[id] = new Post(this, { id });
          this.postCache[id].load();
        }
        return (this.postCache[id]);
      }
    } else {
      if (txid) {
        //txid only
        if (!this.postCache[txid]) {
          this.postCache[txid] = new Post(this, { transactionId: txid });
          this.postCache[txid].load();
        }
        return (this.postCache[txid]);
      } else {
        //nothing
        return (null);
      }
    }
  }

  getUserByNumber(id) {
    if (!this.userCache[id]) {
      this.userCache[id] = new User(this, {id});
      this.userCache[id].load();
      this.userCache[id].loadHeader().then(() => {
        this.userCache[this.userCache[id].getAddress()] = this.userCache[id];
      });
    }
    return (this.userCache[id]);
  }

  getUserByAddress(address) {
    if (!this.userCache[address]) {
      this.userCache[address] = new User(this, {address});
      this.userCache[address].load();
      this.userCache[address].loadHeader().then(() => {
        this.userCache[this.userCache[address].getNumber()] = this.userCache[address];
      });
    }
    return (this.userCache[address]);

  }

  loadPost(id) {
    return (this.groupContract.getPost(id));
  }

  loadUserByNumber(num) {
    return (this.groupContract.getUserByNumber(num));
  }

  loadUserByAddress(address) {
    return (this.groupContract.getUserByAddress(address));
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

  getUsers() {
    return new Promise((resolve, reject) => {
      console.log("Group getting users");
      this.groupContract.getUserIds().then((userIds) => {
        console.log("Group getting user ids");
        resolve(userIds.map((bigInt) => {
          return (this.getUserByNumber(bigInt.toString()));
        }));
      }).catch((error) => {
        reject(error);
      });
    });
  }

  joinGroup() {
    return new Promise((resolve, reject) => {
      const walletAddr = WalletStore.getAccountAddress();
      this.groupContract.userExistsByAddress(walletAddr).then((result) => {
        if (!result) {
          console.log("user not already in group, joining");
          this.gasEstimator.estimate('joinGroup').then((gas) => {
            let actualGas = gas * 3;
            console.log("gas estimator estimates that this createPost call will cost", gas, "gas, actualGas =", actualGas);
            this.contractInstance.joinGroup({ gas: actualGas, from: walletAddr }).then((txid) => {
              console.log("successfully joined group! txid:", txid);
              resolve(true);
            }).catch((error) => {
              console.log("Failed to execute contract join group method:", error);
              reject(error);
            });
          }).catch((error) => {
            console.log("error while estimating join group gas:", error);
            reject(error);
          });
        } else {
          console.log("user was already in group!");
          resolve(false);
        }
      }).catch((error) => {
        console.log("Error while checking if user is in group:", error);
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
          this.gasEstimator.estimateContractCreation(this.groupContractTC).then((gas) => { //TODO
            let actualGas = gas;
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
          }).catch((error) => {
            console.error("Failed to estimate gas for new contract:", error);
            reject(error);
          });
        } else {
          console.log("There's already a group on post", postNum, "!");
          resolve(currentAddress);
        }
      });
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
        console.log("Group.setGroupAddressOfPost is setting post", postNum, "group to", groupAddress);
        console.log("gas estimator estimates that this setGroupAddressOfPost call will cost", gas, "gas, actualGas =", actualGas);
        this.contractInstance.setGroupAddress(postNum, groupAddress.valueOf(), { gas: actualGas }).then((result) => {
          console.log("Group.setGroupAddressOfPost result:", result);
          resolve(result);
        }).catch((error) => {
          console.error("Group.setGroupAddressOfPost Error while setting group address:", error);
          reject(error);
        });
      }).catch((error) => {
        console.error("Group.setGroupAddressOfPost Error while estimating gas:", error);
        reject(error);
      });
    });
  }

  registerNewPostEventListener(callback) {
    return (this.groupContract.registerNewPostEventListener(callback));
  }

  registerNewGroupEventListener(callback) {
    return (this.groupContract.registerNewGroupEventListener(callback));
  }

  registerNewUserEventListener(callback) {
    return (this.groupContract.registerNewUserEventListener(callback));
  }

  registerEventListener(eventName, callback) {
    return (this.groupContract.registerEventListener(eventName, callback));
  }

  unregisterEventListener(handle) {
    return (this.groupContract.unregisterEventListener(handle));
  }

  registerNewPostListener(callback) {
    this.newPostListeners.push(callback);
    return ({
      num: this.newPostListeners.length,
    });
  }

  unregisterNewPostListener(handle) {
    if (handle) {
      let {num} = handle;
      if (this.newPostListeners) {
        delete (this.newPostListeners[num - 1]);
      }
    }
  }

  fireNewPostListeners(post) {
    this.newPostListeners.forEach((listener, idx) => {
      listener(post);
    });
  }

  registerNewUserListener(callback) {
    this.newUserListeners.push(callback);
    return ({
      num: this.newUserListeners.length,
    });
  }

  unregisterNewUserListener(handle) {
    if (handle) {
      let {num} = handle;
      if (this.newUserListeners) {
        delete (this.newUserListeners[num - 1]);
      }
    }
  }

  fireNewUserListeners(user) {
    this.newUserListeners.forEach((listener, idx) => {
      listener(user);
    });
  }
}

