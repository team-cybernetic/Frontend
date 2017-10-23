import Ipfs from '../utils/Ipfs';
import GroupContract from '../ethWrappers/GroupContract';
import Post from './Post';
import User from './User';
import Wallet from '../models/Wallet'
import moment from 'moment';

export default class Group {
  constructor(web3, contractInstance, contractTC) {
    this.postCache = [];
    this.userCache = [];
    this.web3 = web3;
    this.groupContractTC = contractTC;
    this.contractInstance = contractInstance;
    this.groupContract = new GroupContract(this.web3, this.contractInstance);
    this.postCreatedListeners = [];
    this.userJoinedListeners = [];
    this.userLeftListeners = [];
    this.registerPostCreatedEventListener((error, result) => {
      if (!error) {
        const id = result.args.postNumber.toString();
        const post = this.getPost(id, result.transactionHash);
        this.firePostCreatedListeners(post);
      }
    });
    this.registerSubgroupCreatedEventListener((error, result) => {
      if (!error) {
        const id = result.args.postNumber.toString();
        const post = this.getPost(id, result.transactionHash);
        const addr = result.args.groupAddress;
        post.populate({
          groupAddress: addr,
        });
      }
    });
    this.registerUserJoinedEventListener((error, result) => {
      if (!error) {
        console.log("got new user:", result);
        const id = result.args.userNumber.toString();
        const user = this.getUserByNumber(id);
        this.fireUserJoinedListeners(user);
      }
    });
    this.registerUserLeftEventListener((error, result) => {
      if (!error) {
        console.log("user left event:", result);
        const id = result.args.userNumber.toString();
        const user = this.getUserByNumber(id);
        this.fireUserLeftListeners(user);
      }
    });
  }

  createPost({title, content, contentType}) {
    return new Promise((resolve, reject) => {
      Ipfs.saveContent(content).then((multiHashString) => {
        const multiHashArray = Ipfs.extractMultiHash(multiHashString);
        const creationTime = moment().unix();
        Wallet.runTransaction(this.contractInstance, 'createPost', 'create this post', title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime).then(({ gas, gasPrice }) => {
          this.contractInstance.contract.createPost(title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime, { gas, gasPrice }, (error, transactionId) => {
            if (!error) {
              this.groupContract.waitForPendingTransaction(transactionId).then((txid) => {
                const post = this.getPost(undefined, txid);
                post.populate({
                  title,
                  content,
                  contentType,
                  multiHashArray,
                  multiHashString,
                  creator: Wallet.getAccountAddress(),
                  creationTime,
                  transactionId: txid,
                });
                this.firePostCreatedListeners(post);
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
            this.postCache[id].waitForConfirmation().catch((error) => {
              delete (this.postCache[id]);
            });
          }
        }
        return (this.postCache[id]);
      } else {
        //id only
        if (!this.postCache[id]) {
          this.postCache[id] = new Post(this, { id });
          this.postCache[id].load().catch((error) => {
            delete (this.postCache[id]);
          });
        }
        return (this.postCache[id]);
      }
    } else {
      if (txid) {
        //txid only
        if (!this.postCache[txid]) {
          this.postCache[txid] = new Post(this, { transactionId: txid });
          this.postCache[txid].load().catch((error) => {
            delete (this.postCache[txid]);
          });
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

  userExistsByNumber(num) {
    return (this.groupContract.userExistsByNumber(num));
  }

  userExistsByAddress(address) {
    return (this.groupContract.userExistsByAddress(address));
  }

  postExistsByNumber(num) {
    return (this.groupContract.postExistsByNumber(num));
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
      console.log("Group getting user ids");
      this.groupContract.getUserIds().then((userIds) => {
        console.log("Group got user ids:", userIds);
        let res = [];
        userIds.forEach((bigInt) => {
          let id = bigInt.toString();
          if (id !== '0') {
            res.push(this.getUserByNumber(id));
          }
        });
        console.log("Group got users:", res);
        resolve(res);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  joinGroup() {
    return new Promise((resolve, reject) => {
      const walletAddr = Wallet.getAccountAddress();
      this.userExistsByAddress(walletAddr).then((result) => {
        if (!result) {
          console.log("user not already in group, joining");
          Wallet.runTransaction(this.contractInstance, 'joinGroup', 'join this group').then(({ gas, gasPrice }) => {
            console.log("gas estimator estimates that this joinGroup call will cost", gas);
            this.contractInstance.joinGroup({ gas, from: walletAddr }).then((txid) => {
              console.log("successfully joined group! txid:", txid);
              resolve(true);
            }).catch((error) => {
              console.error("Failed to execute contract join group method:", error);
              reject(error);
            });
          }).catch((error) => {
            console.error("error while estimating join group gas:", error);
            reject(error);
          });
        } else {
          console.log("user was already in group!");
          resolve(false);
        }
      }).catch((error) => {
        console.error("Error while checking if user is in group:", error);
        reject(error);
      });
    });
  }

  leaveGroup() {
    return new Promise((resolve, reject) => {
      const walletAddr = Wallet.getAccountAddress();
      this.userExistsByAddress(walletAddr).then((result) => {
        if (result) {
          console.log("user is in group, leaving");
          Wallet.runTransaction(this.contractInstance, 'leaveGroup', 'leave this group').then(({ gas, gasPrice }) => {
            console.log("gas estimator estimates that this leaveGroup call will cost", gas);
            this.contractInstance.leaveGroup({ gas, from: walletAddr }).then((txid) => {
              console.log("successfully left group! txid:", txid);
              resolve(true);
            }).catch((error) => {
              console.error("Failed to execute contract leave group method:", error);
              reject(error);
            });
          }).catch((error) => {
            console.error("error while estimating leave group gas:", error);
            reject(error);
          });
        } else {
          console.log("user was not in group!");
          resolve(false);
        }
      }).catch((error) => {
        console.error("Error while checking if user is in group:", error);
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
          Wallet.deployContract(this.groupContractTC).then((newInstance) => {
            console.log('post number ', postNum, ' created as a group with address ', newInstance.address);
            this.setGroupAddressOfPost(postNum, newInstance.address)
            resolve(newInstance.address);
          }).catch((error) => {
            console.error("Failed to create new contract:", error);
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
      Wallet.runTransaction(this.contractInstance, 'setGroupAddress', null, postNum, groupAddress).then(({ gas, gasPrice }) => {
        console.log("Group.setGroupAddressOfPost is setting post", postNum, "group to", groupAddress);
        console.log("gas estimator estimates that this setGroupAddressOfPost call will cost", gas);
        this.contractInstance.setGroupAddress(postNum, groupAddress.valueOf(), { gas }).then((result) => {
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

  registerPostCreatedEventListener(callback) {
    return (this.groupContract.registerPostCreatedEventListener(callback));
  }

  registerSubgroupCreatedEventListener(callback) {
    return (this.groupContract.registerSubgroupCreatedEventListener(callback));
  }

  registerUserJoinedEventListener(callback) {
    return (this.groupContract.registerUserJoinedEventListener(callback));
  }

  registerUserLeftEventListener(callback) {
    return (this.groupContract.registerUserLeftEventListener(callback));
  }

  registerEventListener(eventName, callback) {
    return (this.groupContract.registerEventListener(eventName, callback));
  }

  unregisterEventListener(handle) {
    return (this.groupContract.unregisterEventListener(handle));
  }

  registerPostCreatedListener(callback) {
    this.postCreatedListeners.push(callback);
    return ({
      num: this.postCreatedListeners.length,
    });
  }

  unregisterPostCreatedListener(handle) {
    if (handle) {
      let {num} = handle;
      if (this.postCreatedListeners) {
        delete (this.postCreatedListeners[num - 1]);
      }
    }
  }

  firePostCreatedListeners(post) {
    this.postCreatedListeners.forEach((listener, idx) => {
      listener(post);
    });
  }

  registerUserJoinedListener(callback) {
    this.userJoinedListeners.push(callback);
    return ({
      num: this.userJoinedListeners.length,
    });
  }

  unregisterUserJoinedListener(handle) {
    if (handle) {
      let {num} = handle;
      if (this.userJoinedListeners) {
        delete (this.userJoinedListeners[num - 1]);
      }
    }
  }

  fireUserJoinedListeners(user) {
    this.userJoinedListeners.forEach((listener, idx) => {
      listener(user);
    });
  }

  registerUserLeftListener(callback) {
    this.userLeftListeners.push(callback);
    return ({
      num: this.userLeftListeners.length,
    });
  }

  unregisterUserLeftListener(handle) {
    if (handle) {
      let {num} = handle;
      if (this.userLeftListeners) {
        delete (this.userLeftListeners[num - 1]);
      }
    }
  }

  fireUserLeftListeners(user) {
    this.userLeftListeners.forEach((listener, idx) => {
      listener(user);
    });
  }
}

