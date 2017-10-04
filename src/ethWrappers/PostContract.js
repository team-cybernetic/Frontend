import GasEstimator from '../utils/GasEstimator';

import TruffleContract from 'truffle-contract';

export default class PostContract {
  static groupContract = null;
  static groupContractRootInstance = null;
  static groupContractCurrentInstance = null;
  static web3 = null;
  static createdPostsAwaitingPromiseResolution = {};
  static groupAddressSet = [];
  static POST_TITLE_STRIPPER = /([0-9]+)(-([^/]+))?\/?/g;

  static initialize(web3, groupContractRootInstance, groupContract) {
    this.web3 = web3;
    this.groupContract = groupContract;
    this.groupContractRootInstance = groupContractRootInstance;
    this.groupContractCurrentInstance = groupContractRootInstance;
    this.web3.eth.filter("pending").watch((error, txid) => {
      this.listenForPendingPostTransactions(error, txid);
    });
  }

  static navigateTo(path) { //TODO: all of this
    return new Promise((resolve, reject) => {
      if (path === undefined || path === '' || path === '/') {
        console.log("navigating to root");
        this.groupContractCurrentInstance = this.groupContractRootInstance;
        resolve(this.groupContractCurrentInstance);
      } else {
        var absolute = false;
        if (path.startsWith('/')) {
          console.log("navigating to absolute path:", path);
          path = path.slice(1);
          absolute = true;
        } else {
          console.log("navigating to relative path:", path);
        }
        var matches;
        var nums = [];
        do {
          matches = this.POST_TITLE_STRIPPER.exec(path);
          if (!matches) {
            break;
          }
          nums.push(matches[1]);
          /*
          let num = matches[1];
          let title = matches[3];
          let desc = 'post #' + num + (title ? ', titled "' + title + '"' : '');
          console.log("PostContract.navigateTo needs to get group address for " + desc);
          this.postsContractInstance.getGroupAddress.call(num).then((addr) => {
            console.log("got group address for " + desc + ":", addr);
          });
          */
        } while (matches);
        console.log("nums:", nums);
        if (absolute) {
          this.navigateTo('/');
        }
        this.resolvePostNumber(nums, absolute ? this.groupContractRootInstance : this.groupContractCurrentInstance).then((result) => {
          console.log('successfully resolved nums ', nums, ':', result);
          this.groupContractCurrentInstance = result;
          resolve(result);
        }).catch((error) => {
          console.error('error while resolving nums ', nums, ':', error);
          reject(error);
        });

        /*
        if (nums.length > 1) {
          this.resolvePostNumber(nums,absolute?this.groupContractRootInstance:this.groupContractCurrentInstance).then((result) => {
              console.log('success ', result);
            }).catch((error) => {
              console.error(error);
            });
          nums.forEach((num) => {
            return this.navigateTo(num);
          });
        } else {
          if (nums.length === 1) {
            let num = nums[0];
            this.groupContractCurrentInstance.getGroupAddress.call(num).then((addr) => {
              console.log("groupAddress for post", num, ":", addr);
              return new Promise((resolve, reject) => {
                if (addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000' && addr !== 0) {
                  resolve(addr);
                } else {
                  reject();
                }
              });
            }).then((addr) => {
              console.log("post", num, "has group address:", addr);
            }).catch(() => {
              console.log("post", num, " has no group!");
            });
          } else {
            console.error("nums length === 0??");
          }
        }
        */
      }
    });
  }

  static resolvePostNumber(nums, instance) {
      /*
    if (nums.length == 1) {
      let num = nums[0];
          this.curInstance.getGroupAddress.call(num).then((addr) => {
            console.log("groupAddress for post", num, ":", addr);
            return new Promise((resolve, reject) => {
              if (addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000' && addr !== 0) {
                resolve(addr);
              } else {
                reject();
              }
            });
          }).then((addr) => {
            console.log("post", num, "has group address:", addr);
          }).catch(() => {
            console.log("post", num, " has no group!");
          });
    } else {
    */

    return new Promise((resolve, reject) => {
      console.log("nums:", nums);
      var curNum = nums.shift();
      console.log("popped num", curNum);
      if (curNum === undefined) {
        reject("curNum is undefined!");
        return;
      }
      instance.getGroupAddress.call(curNum).then((addr) => {
        console.log("got address for ", curNum, ":", addr);
        return new Promise((resolve, reject) => {
          console.log("promise for ", curNum);
          if (addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000' && addr !== 0) {
            this.groupContract.at(addr).then((cntrct) => {
              console.log("got contract for ", curNum, ":", cntrct);
              if (nums.length > 0) {
                resolve(this.resolvePostNumber(nums, cntrct));
              } else {
                resolve(cntrct);
              }
            }).catch((error) => {
              console.error("error while getting contract at address", addr, ":", error);
              reject(error);
            });
          } else {
            console.log("post ", curNum, "has no group address!");
          }
        });
      }).catch((error) => {
        console.log("post", curNum, " has no group:", error);
      }).then((cntr) => {
        console.log("cntr:", cntr);
        resolve(cntr);
      });
    }).catch((error) => {
      console.log("top level error:", error);
    });
    //}
  }



  static setParent() {
    var address = this.groupContractCurrentInstance.address;
    return new Promise((resolve, reject) => {
      GasEstimator.estimate('setParent').then((gas) => {
        let actualGas = gas * 3;
        console.log("gas estimator estimates that this setParent call will cost", gas, "gas, actualGas =", actualGas);
        this.groupContractCurrentInstance.setParent(address,{ gas: actualGas }, (error, output) => {
          if (error) {
            console.error("Error while executing setParent contract function.", error);
          } else {
            resolve(output)
          }
        });
      }).catch((error) => {
        console.error("Error while estimating gas.", error);
      });
    });
  }

  static createPost({ title, content, contentType, multiHashArray, creationTime }) {
    return new Promise((resolve, reject) => {
      GasEstimator.estimate('createPost', title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime).then((gas) => {
        console.log("double benchmark")
        let actualGas = gas * 3;
        console.log("gas estimator estimates that this createPost call will cost", gas, "gas, actualGas =", actualGas);
        console.log(multiHashArray);
        this.groupContractCurrentInstance.contract.createPost(title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime, { gas: actualGas }, (error, transactionId) => {
          if (error) {
            console.error("Error while executing createPost contract function:", error);
            reject(error);
          } else {
            this.createdPostsAwaitingPromiseResolution[transactionId] = { resolve, reject };
          }
        });
      }).catch((error) => {
        console.error("Error while estimating gas:", error);
        reject(error);
      });
    });
  }

  static setGroupAddress(postNum, groupAddress) {
    return new Promise((resolve, reject) => {
      GasEstimator.estimate('setGroupAddress', postNum, groupAddress).then((gas) => {
        let actualGas = gas * 3;
        console.log("setgroupaddress is setting post", postNum, "group to", groupAddress);
        console.log("gas estimator estimates that this setGroupAddress call will cost", gas, "gas, actualGas =", actualGas);
        this.groupContractCurrentInstance.setGroupAddress(postNum, groupAddress.valueOf(), { gas: actualGas }).then((result) => {
          console.log("PostContract.setGroupAddress result:", result);
          resolve(result);
        }).catch((error) => {
          console.error("PostContract.setGroupAddress Error while setting group address:", error);
          reject(error);
        });
      }).catch((error) => {
        console.error("PostContract.setGroupAddress Error while estimating gas:", error);
        reject(error);
      });
    });
  }
  static convertPostToGroup(postNum) {
    console.log("creating post...", postNum);
    this.groupContractCurrentInstance.getGroupAddress.call(postNum).then((addr) => {
    console.log("converting post", postNum, "to group");
    return new Promise((resolve, reject) => {
      this.estimate(this.groupContractCurrentInstance.new).then((gas) => {
          let actualGas = gas * 50;
          console.log('attempting create group...');
          this.groupContract.new({gas:actualGas}).then((res1) => {
            console.log('post number ', postNum, ' created as a group with address ', res1.address);
            this.setGroupAddress(postNum,res1.address)
            resolve(res1.address);
          }).catch((err) => {
            console.log("ERROR: ", err);
          });
      }).catch((error) => {
          console.error("Error while estimating gas.", error);
      });
    }).catch((error) => {
          console.error("Error with promise.", error);
      });
  }).catch((error) => {
          console.error("Error with promise.", error);
      });
  }

  static estimate(input) {
    return new Promise((resolve, reject) => {
      resolve(this.web3.eth.estimateGas({data:input}));
    });
  }

  static getPost(id) {
    return this.groupContractCurrentInstance.getPostByNumber.call(id);
  }

  static getPostIds() {
    return this.groupContractCurrentInstance.getPostNumbers.call();
  }

  static listenForPendingPostTransactions(error, transactionId) {
    if (this.createdPostsAwaitingPromiseResolution[transactionId]) {
      if (error) {
        this.createdPostsAwaitingPromiseResolution[transactionId].reject(error);
      } else {
        this.createdPostsAwaitingPromiseResolution[transactionId].resolve(transactionId);
      }
      delete this.createdPostsAwaitingPromiseResolution[transactionId];
    }
  }
}
