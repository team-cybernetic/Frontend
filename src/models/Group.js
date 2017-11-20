import Ipfs from '../utils/Ipfs';
import CyberneticChat from '../blockchain/CyberneticChat';
import Blockchain from '../blockchain/Blockchain';
import UserStore from '../stores/UserStore';
import PostStore from '../stores/PostStore';
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

    this.post = PostStore.getPost(this.number);
    this.post.loadHeader().then(() => {
      this.parentNumber = this.post.getParentNumber(); //is this even needed?
    });

    this.registerPostCreatedEventListener((error, result) => {
      if (!error) {
        const parentNumber = result.args.parentNumber.toString();
        if (parentNumber === this.number) {
          console.log("Group", this.number, "got a new post notification:", result.args);
          const postNumber = result.args.postNumber.toString();
          const userAddress = result.args.userAddress;
          const post = PostStore.getPost(postNumber, result.transactionHash);
          this.firePostCreatedListeners(post);
        }
      }
    });
    this.registerUserJoinedEventListener((error, result) => {
      if (!error) {
        const parentNumber = result.args.parentNumber.toString();
        if (parentNumber === this.number) {
          console.log("Group", this.number, "got a user joined notification:", result.args);
          const addr = result.args.userAddress;
          const user = UserStore.getUser(addr);
          user.getProperties(this.number).reload();
          this.fireUserJoinedListeners(user);
        }
      }
    });
    this.registerUserLeftEventListener((error, result) => {
      if (!error) {
        const parentNumber = result.args.parentNumber.toString();
        console.log("Group", this.number, "UserLeft event:", result.args);
        if (parentNumber === this.number) {
          console.log("Group", this.number, "got a user left notification:", result.args);
          const addr = result.args.userAddress;
          const user = UserStore.getUser(addr);
          user.getProperties(this.number).reload();
          this.fireUserLeftListeners(user);
        }
      }
    });
    this.registerUserBalanceChangedEventListener((error, result) => {
      if (!error) {
        const parentNumber = result.args.parentNumber.toString();
        if (parentNumber === this.number) {
          console.log("Group", this.number, "got a user balance change notification:", result.args);
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
            console.log("Balance of user is now", userProperties.getBalance().toString());
          }).catch((error) => {
            console.error("Group failed to get balance of user", addr, " while handling balance changed event:", error);
          });
        }
      }
    });

    this.registerPostBalanceChangedEventListener((error, result) => {
      //the post got some money from one of its peers
      if (!error) {
        const parentNumber = result.args.parentNumber.toString();
        const postNumber = result.args.postNumber.toString();
        if (parentNumber === this.number) {
          console.log("Group", this.number, "got a balance change notification:", result.args);
          const amount = result.args.amount;
          const increased = result.args.increased;

          const post = PostStore.getPost(postNumber);
          if (increased) {
            post.populate({
              balance: post.getBalance().add(amount),
            });
          } else {
            post.populate({
              balance: post.getBalance().sub(amount),
            });
          }
          console.log("Balance of post is now", post.getBalance().toString());
        }
      }
    });

    this.registerPostTokensChangedEventListener((error, result) => {
      //the number of tokens issued to the children of this post has changed
      if (!error) {
        const postNumber = result.args.postNumber.toString();
        if (postNumber === this.number) {
          console.log("Group", this.number, "got a tokens change notification:", result.args);
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
          console.log("Tokens of group is now", this.post.getTokens().toString());
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
          console.log("debug0");
        Wallet.runTransactionAsync('createPost', 'create this post', this.number, title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime, userPermissionsFlagsMode).then((transactionId) => {
          console.log("debug1");
          Blockchain.waitForPendingTransaction(transactionId).then((txid) => {
          console.log("debug2");
            const post = PostStore.getPost(undefined, txid);
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
          console.log("debug3");
            this.firePostCreatedListeners(post);
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

  loadUserProperties(address) {
    return (CyberneticChat.getUserProperties(this.number, address));
  }

  userExists(address) {
    return (CyberneticChat.userExists(this.number, address));
  }

  getPost() {
    return (this.post);
  }

  loadSubposts() {
    return new Promise((resolve, reject) => {
      CyberneticChat.getSubposts(this.number).then((postIds) => {
        let result = [];
        postIds.forEach((id) => {
          if (!id.equals(0)) {
            result.push(PostStore.getPost(id));
          }
        });
        resolve(result);
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
      this.post.loadHeader().then(() => {
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
      }).catch((error) => {
        console.error("Error while sending currency to user", address, ": group failed to load self post:", this.post, ":", error);
        reject(error);
      });
    });
  }

  sendPostCurrency(postNumber, amount, isPos) {
    return new Promise((resolve, reject) => {
      this.post.loadHeader().then(() => {
        const walletAddr = Wallet.getAccountAddress();
        this.userExists(walletAddr).then((result) => {
          if (result) {
            CyberneticChat.postExists(postNumber).then((result) => {
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
      }).catch((error) => {
        console.error("Error while sending currency to post", postNumber, ": group failed to load self post:", this.post, ":", error);
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

  registerUserBalanceChangedEventListener(callback) {
    return (CyberneticChat.registerUserBalanceChangedEventListener(callback));
  }

  registerPostBalanceChangedEventListener(callback) {
    return (CyberneticChat.registerPostBalanceChangedEventListener(callback));
  }

  registerPostTokensChangedEventListener(callback) {
    return (CyberneticChat.registerPostTokensChangedEventListener(callback));
  }


  registerEventListener(eventName, callback) {
    return (CyberneticChat.registerEventListener(eventName, callback));
  }

  unregisterEventListener(handle) {
    return (CyberneticChat.unregisterEventListener(handle));
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

