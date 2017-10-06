import GasEstimator from '../utils/GasEstimator';

import TruffleContract from 'truffle-contract';

export default class PostContract {
  static groupContract = null;
  static groupContractRootInstance = null;
  static groupContractCurrentInstance = null;
  static web3 = null;
  static createdPostsAwaitingPromiseResolution = {};
  static currentPath = [];
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

  static navigateTo(path) {
    return new Promise((resolve, reject) => {
      if (path === undefined || path === '' || path === '/') {
        console.log("navigating to root");
        this.currentPath = [];
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
        var numsCopy = [];
        do {
          matches = this.POST_TITLE_STRIPPER.exec(path);
          if (!matches) {
            break;
          }
          nums.push(matches[1]);
          numsCopy.push({num: matches[1], title: matches[2]});
        } while (matches);
        console.log("nums:", nums);
        
        if (absolute) {
          var down = true;
          if (nums.length >= this.currentPath.length) {
            for (let i = 0; i < this.currentPath.length; i++) {
              if (this.currentPath[i] !== nums[i]) {
                down = false;
                break;
              }
            }
          } else {
            down = false;
          }
          console.log("down:", down);
          if (!down) {
            this.groupContractCurrentInstance = this.groupContractRootInstance;
            this.currentPath = [];
          }
        }
        console.log("currentPath:", this.currentPath);

        this.resolvePostNumber(nums, this.groupContractCurrentInstance).then(({contract, num}) => {
          for (var i = 0; i < numsCopy.length - nums.length; i++) {
            console.log("successfully navigated to group", numsCopy[i]);
            this.currentPath.push(numsCopy[i].num);
          }
          console.log("currentPath new:", this.currentPath);
          console.log('successfully resolved nums', nums, '; numsCopy:', numsCopy, 'num ', num, ':', contract);
          this.groupContractCurrentInstance = contract;
          resolve({contract, num});
        }).catch((error) => {
          console.error('error while resolving nums ', nums, ':', error);
          reject(error);
        });
      }
    });
  }

  static resolvePostNumber(nums, instance) {
    return new Promise((resolve, reject) => {
      var curNum = nums.shift();
      if (curNum === undefined) {
        return;
      }
      instance.getGroupAddress.call(curNum).then((addr) => {
        console.log("got address for", curNum, ":", addr);
        if (addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000' && addr !== 0) {
          this.groupContract.at(addr).then((contract) => {
            console.log("got contract for", curNum, ":", contract);
            if (nums.length > 0) {
              this.resolvePostNumber(nums, contract).then(resolve).catch(reject);
            } else {
              console.log("singleton resolved:", contract);
              resolve({contract: contract});
            }
          }).catch((error) => {
            console.error("error while getting contract at address", addr, ":", error);
            reject(error);
          });
        } else {
          console.log("post", curNum, "has no group address!");
          resolve({contract: instance, num: curNum});
        }
      }).catch((error) => {
        console.log("Failed to get group for post", curNum, ":", error);
        reject(error);
      });
    }).catch((error) => {
      console.log("top level error:", error);
    });
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
    return new Promise((resolve, reject) => {
      this.groupContractCurrentInstance.getGroupAddress.call(postNum).then((addr) => {
        console.log("converting post", postNum, "to group");
        this.estimate(this.groupContractCurrentInstance.new).then((gas) => {
          let actualGas = gas * 50;
          console.log('attempting create group...');
          this.groupContract.new({gas:actualGas}).then((res1) => {
            console.log('post number ', postNum, ' created as a group with address ', res1.address);
            this.setGroupAddress(postNum,res1.address)
            resolve(res1.address);
          }).catch((err) => {
            console.log("ERROR: ", err);
            reject();
          });
        }).catch((error) => {
          console.error("Error while estimating gas.", error);
          reject();
        });
      }).catch((error) => {
        console.error("Error with promise.", error);
        reject();
      });
    }).catch((error) => {
      console.error("Error with promise.", error);
      return null;
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

  static getCurrentPathArray() {
    return (this.currentPath);
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
