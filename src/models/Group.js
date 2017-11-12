import Ipfs from '../utils/Ipfs';
import CyberneticChat from '../blockchain/CyberneticChat';
import Blockchain from '../blockchain/Blockchain';
import UserStore from '../stores/UserStore';
import Post from './Post';
import User from './User';
import Wallet from '../models/Wallet'
import moment from 'moment';

export default class Group {
  constructor(number) {
    this.number = number.toString();
    this.postCache = {};
    this.userCache = [];
    this.postCreatedListeners = [];
    this.userJoinedListeners = [];
    this.userLeftListeners = [];
    this.tokensChangedListeners = [];

    this.post = this.getPost(this.number);
    this.post.loadHeader().then(() => {
      this.parentNumber = this.post.getParentNumber(); //is this even needed?
    });

    this.registerPostCreatedEventListener((error, result) => {
      if (!error) {
        const parentNumber = result.args.parentNumber.toString();
        if (parentNumber === this.number) {
          console.log("Group", this.number, "got a new post notification:", result);
          const postNumber = result.args.postNumber.toString();
          const userAddress = result.args.userAddress;
          const post = this.getPost(postNumber, result.transactionHash);
          this.firePostCreationListeners(post);
        }
      }
    });
    this.registerUserJoinedEventListener((error, result) => {
      if (!error) {
        const parentNumber = result.args.parentNumber.toString();
        if (parentNumber === this.number) {
          console.log("Group", this.number, "got a user joined notification:", result);
          const addr = result.args.userAddress;
          const user = UserStore.getUser(addr);
          this.fireUserJoinedListeners(user);
        }
      }
    });
    this.registerUserLeftEventListener((error, result) => {
      if (!error) {
        const parentNumber = result.args.parentNumber.toString();
        if (parentNumber === this.number) {
          console.log("Group", this.number, "got a user left notification:", result);
          const addr = result.args.userAddress;
          const user = UserStore.getUser(addr);
          this.fireUserLeftListeners(user);
        }
      }
    });
    this.registerUserBalanceChangedListener((error, result) => {
      if (!error) {
        const parentNumber = result.args.parentNumber.toString();
        if (parentNumber === this.number) {
          console.log("Group", this.number, "got a user balance change notification:", result);
          const addr = result.args.userAddress;
          const amount = result.args.amount;
          const increased = result.args.increased;

          const user = UserStore.getUser(addr);
          const userProperties = user.getProperties(this.number);
          userProperties.load().then(() => {
            let balance = userProperties.getBalance();
            let newBalance;
            if (increased) {
              newBalance = balance.add(amount);
            } else {
              newBalance = balance.sub(amount);
            }
            userProperties.populate({
              balance: newBalance,
            });
            console.log("Balance of user is now", userProperties.getBalance());
          }).catch((error) => {
            console.error("Group failed to get balance of user", addr, " while handling balance changed event:", error);
          });
        }
      }
    });

    this.registerPostBalanceChangedListener((error, result) => {
      //the post got some money from one of its peers
      if (!error) {
        const parentNumber = result.args.parentNumber.toString();
        const postNumber = result.args.postNumber.toString();
        if (parentNumber === this.number) {
          console.log("Group", this.number, "got a balance change notification:", result);
          const amount = result.args.amount;
          const increased = result.args.increased;

          const post = this.getPost(postNumber);
          if (increased) {
            post.populate({
              balance: post.getBalance().add(amount),
            });
          } else {
            post.populate({
              balance: post.getBalance().sub(amount),
            });
          }
          console.log("Balance of post is now", post.getBalance());
        }
      }
    });

    this.registerPostTokensChangedListener((error, result) => {
      //the number of tokens issued to the children of this post has changed
      if (!error) {
        const postNumber = result.args.postNumber.toString();
        if (postNumber === this.number) {
          console.log("Group", this.number, "got a tokens change notification:", result);
          const amount = result.args.amount;
          const increased = result.args.increased;

          if (increased) {
            this.post.populate({
              tokens: this.post.getTokens().add(amount),
            });
          } else {
            this.post.populate({
              tokens: this.post.getTokens().sub(amount),
            });
          }
          console.log("Tokens of group is now", this.post.getTokens());
          this.fireTokensChangedListeners(this.post.getTokens());
        }
      }
    });
  }

  createPost({title, content, contentType, userPermissionsFlagsMode}) {
    return new Promise((resolve, reject) => {
      Ipfs.saveContent(content).then((multiHashString) => {
        const multiHashArray = Ipfs.extractMultiHash(multiHashString);
        const creationTime = moment().unix();
        Wallet.runTransactionAsync('createPost', 'create this post', this.number, title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime, userPermissionsFlagsMode).then((transactionId) => {
          Blockchain.waitForPendingTransaction(transactionId).then((txid) => {
            const post = this.getPost(undefined, txid);
            const userAddress = Wallet.getAccountAddress();
            post.populate({
              parentNumber: this.number,
              title,
              content,
              contentType,
              multiHashArray,
              multiHashString,
              creator: userAddress,
              creationTime,
              transactionId: txid,
            });
            this.firePostCreationListeners(post);
            resolve(post);
          }).catch((error) => {
            reject(error);
          });
        }).catch((error) => {
          if (error.cancel) {
            console.log("Transaction cancelled by user");
          } else {
            console.error("Error while executing createPost contract function:", error);
          }
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

  getUserProperties(address) {
    return (UserStore.getUser(address).getProperties(this.number));
  }
  
  loadBalance() {
    return new Promise((resolve, reject) => {
      this.post.loadHeader().then(() => {
        resolve(this.post.getBalance());
      }).catch(reject);
    });
  }

  loadTokens() {
    return new Promise((resolve, reject) => {
      this.post.loadHeader().then(() => {
        resolve(this.post.getTokens());
      }).catch(reject);
    });
  }

  getNumber() {
    return (this.number);
  }

  loadParentNumber() {
    return new Promise((resolve, reject) => {
      this.post.loadHeader().then(() => {
        resolve(this.post.getParentNumber());
      }).catch(reject);
    });
  }

  loadPost(id) {
    return (CyberneticChat.getPost(id));
  }

  loadUserProperties(address) {
    return (CyberneticChat.getUserProperties(this.number, address));
  }

  userExists(address) {
    return (CyberneticChat.userExists(this.number, address));
  }

  postExists(num) {
    return (CyberneticChat.postExists(num));
  }

  loadChildren() {
    return new Promise((resolve, reject) => {
      CyberneticChat.getChildren(this.number).then((postIds) => {
        resolve(postIds.map((bigInt) => {
          return (this.getPost(bigInt.toString()));
        }));
      }).catch((error) => {
        reject(error);
      });
    });
  }

  loadUsers() {
    return new Promise((resolve, reject) => {
      console.log("Group", this.number, "getting user ids");
      CyberneticChat.getUsers(this.number).then((userAddresses) => {
        console.log("Group", this.number, "got user addresses:", userAddresses);
        let res = [];
        userAddresses.forEach((addr) => {
          if (Blockchain.isAddressValid(addr)) {
            res.push(UserStore.getUser(addr));
          }
        });
        console.log("Group", this.number, "got users:", res);
        resolve(res);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  joinGroup() {
    return new Promise((resolve, reject) => {
      const walletAddr = Wallet.getAccountAddress();
      this.userExists(walletAddr).then((result) => {
        if (!result) {
          console.log("user not already in group, joining");
          Wallet.runTransactionSync('joinGroup', 'join this group', this.number).then((txid) => {
            console.log("successfully joined group! txid:", txid);
            resolve(true);
          }).catch((error) => {
            if (error.cancel) {
              console.log("Transaction cancelled by user");
            } else {
              console.error("Failed to execute contract join group method:", error);
            }
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
      this.userExists(walletAddr).then((result) => {
        if (result) {
          console.log("user is in group, leaving");
          Wallet.runTransactionSync('leaveGroup', 'leave this group', this.number).then((txid) => {
            console.log("successfully left group! txid:", txid);
            resolve(true);
          }).catch((error) => {
            if (error.cancel) {
              console.log("Transaction cancelled by user");
            } else {
              console.error("Failed to execute contract leave group method:", error);
            }
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

  sendUserCurrency(address, amount, isPos) {
    return new Promise((resolve, reject) => {
      const walletAddr = Wallet.getAccountAddress();
      this.userExists(walletAddr).then((result) => {
        if (result) {
          this.userExists(address).then((result) => {
            if (result) {
              Wallet.runTransactionSync('transferTokensToUser', 'send currency', this.number, address, amount, isPos).then((txid) => {
                console.log("successfully sent", amount, "currency to", address, "txid:", txid);
                resolve(true);
              }).catch((error) => {
                if (error.cancel) {
                  console.log("Transaction cancelled by user");
                } else {
                  console.error("Error while executing transferTokensToUser contract function:", error);
                }
                reject(error);
              });
            } else {
              console.log("user", address, "was not in group!");
              resolve(false);
            }
          }).catch((error) => {
            console.error("Error while checking if user", address, "is in group:", error);
            reject(error);
          });
        } else {
          console.log("self user", walletAddr, "was not in group!");
          resolve(false);
        }
      }).catch((error) => {
        console.error("Error while checking if self user is in group:", error);
        reject(error);
      });
    });
  }

  sendPostCurrency(postNumber, amount, isPos) {
    return new Promise((resolve, reject) => {
      const walletAddr = Wallet.getAccountAddress();
      this.userExists(walletAddr).then((result) => {
        if (result) {
          this.postExists(postNumber).then((result) => {
            if (result) {
              Wallet.runTransactionSync('transferTokensToPost', 'send currency to post #' + postNumber, this.number, postNumber, amount, isPos).then((txid) => {
                console.log("successfully sent", amount, "currency to post #", postNumber, ", txid:", txid);
                resolve(true);
              }).catch((error) => {
                if (error.cancel) {
                  console.log("Transaction cancelled by user");
                } else {
                  console.error("Error while executing transferTokensToUser contract function:", error);
                }
                reject(error);
              });
            } else {
              console.log("post", postNumber, "does not exist!");
              resolve(false);
            }
          }).catch((error) => {
            console.error("Error while checking if post", postNumber, "exists:", error);
            reject(error);
          });
        } else {
          console.log("self user", walletAddr, "was not in group!");
          resolve(false);
        }
      }).catch((error) => {
        console.error("Error while checking if self user is in group:", error);
        reject(error);
      });
    });
  }

  registerPostCreatedEventListener(callback) {
    return (CyberneticChat.registerPostCreatedEventListener(callback));
  }

  registerUserJoinedEventListener(callback) {
    return (CyberneticChat.registerUserJoinedEventListener(callback));
  }

  registerUserLeftEventListener(callback) {
    return (CyberneticChat.registerUserLeftEventListener(callback));
  }

  registerUserBalanceChangedListener(callback) {
    return (CyberneticChat.registerUserBalanceChangedListener(callback));
  }

  registerPostBalanceChangedListener(callback) {
    return (CyberneticChat.registerPostBalanceChangedListener(callback));
  }

  registerPostTokensChangedListener(callback) {
    return (CyberneticChat.registerPostTokensChangedListener(callback));
  }

  registerEventListener(eventName, callback) {
    return (CyberneticChat.registerEventListener(eventName, callback));
  }


  unregisterEventListener(handle) {
    return (CyberneticChat.unregisterEventListener(handle));
  }

  registerPostCreationListener(callback) {
    this.postCreatedListeners.push(callback);
    return ({
      num: this.postCreatedListeners.length,
    });
  }

  unregisterPostCreationListener(handle) {
    if (handle) {
      let {num} = handle;
      if (this.postCreatedListeners) {
        delete (this.postCreatedListeners[num - 1]);
      }
    }
  }

  firePostCreationListeners(post) {
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

  registerTokensChangedListener(callback) {
    this.tokensChangedListeners.push(callback);
    return ({
      num: this.tokensChangedListeners.length,
    });
  }

  unregisterTokensChangedListener(handle) {
    if (handle) {
      let {num} = handle;
      if (this.tokensChangedListeners) {
        delete (this.tokensChangedListeners[num - 1]);
      }
    }
  }

  fireTokensChangedListeners(tokens) {
    this.tokensChangedListeners.forEach((listener, idx) => {
      listener(tokens);
    });
  }
}

