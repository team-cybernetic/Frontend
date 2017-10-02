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
    if (path === undefined || path === '' || path === '/') {
      console.log("navigating to root");
      this.groupContractCurrentInstance = this.groupContractRootInstance;
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
    }
  }

  static resolvePostNumber(nums, curInstance) {
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
      return new Promise((resolve, reject) => {
      var curNum = nums.shift();
      this.instance.getGroupAddress.call(curNum).then((addr) => {
        return new Promise((resolve, reject) => {
            var tempContract = TruffleContract(curInstance);
            tempContract.setProvider(this.web3.currentProvider);
            tempContract.defaults({
              gasLimit: '5000000'
            });
            tempContract.at(addr).then(function(cntrct) {
              if (addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000' && addr !== 0) {
                resolve(this.resolvePostNumber(curNum, cntrct));
              } else {
                reject();
              }
              });
            });
          }).then((addr) => {
            console.log("post", curNum, "has group address:", addr);
          }).catch(() => {
            console.log("post", curNum, " has no group!");
        });
      }).catch(() => {
            console.log("post has no group!");
      });
    }
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
