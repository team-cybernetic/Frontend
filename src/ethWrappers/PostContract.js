import GasEstimator from '../utils/GasEstimator';

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
        nums.forEach((num) => {
          this.navigateTo(num);
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

  static setParent() {
    var address = this.groupContractCurrentInstance.address;
    return new Promise((resolve, reject) => {
      GasEstimator.estimate('setParent').then((gas) => {
        let actualGas = gas * 3;
        console.log("gas estimator estimates that this setParent call will cost", gas, "gas, actualGas =", actualGas);
        this.groupContractCurrentInstance.setParent(address,{ gas: actualGas }, (error, output) => {
          if (error) {
            console.error("Error while executing setGroupAddress contract function.", error);
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

  static joinGroup(groupAddress) {
    /*
    const postsContract = TruffleContract(PostsContract);
    postsContract.setProvider(this.web3.currentProvider);
    var newContract = postsContract.at(groupAddress);
    PostStore.postsContractInstance = newContract;
    this.postsContractInstance = newContract;
    ChildView.state = {
      posts: null,
    };
    */
  }

  //I have literally no idea why this/getgroupaddress don't work
  //I spent ~8 hours debugging these and they just inexplicably do not work
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

    /*
  static setGroupAddress(postNum, groupAddress) {
    this.groupAddressSet[postNum] = groupAddress;
    return groupAddress;
  }
    */

    /*
  static getGroupAddress(postNum) {
    return this.groupAddressSet[postNum];
  }
    */
/*
  static getGroupAddress(postNum) {
    console.log('trying group stuff');
    return new Promise((resolve, reject) => {
      GasEstimator.estimate('getGroupAddress', postNum).then((gas) => {
        let actualGas = gas;
        console.log("gas estimator estimates that this getGroupAddress call will cost", gas, "gas, actualGas =", actualGas);
        console.log(postNum,actualGas);
        var p = this.postsContractInstance.getGroupAddress.call(postNum, { gas: actualGas });
        p.then((result) => {
          console.log(result.toString());
          resolve(result);
        });
      }).catch((error) => {
        console.error("Error while estimating gas.", error);
      });
    });
  }*/

  static convertPost2Group(postNum) {
    console.log("converting post", postNum, "to group");
    /*
    return new Promise((resolve, reject) => {
      console.log("converting post", postNum, "to group");
      const postsContract = TruffleContract(PostsContract);
      postsContract.setProvider(this.web3.currentProvider);
      console.log("postsContract: ", postsContract);
      this.estimate(this.postsContractInstance.new).then((gas) => {
          let actualGas = gas * 50;
          postsContract.new({gas: actualGas}).then((res1) => {
            console.log('post number ', postNum, ' created as a group with address ', res1.address);
            this.setGroupAddress(postNum,res1.address)
            resolve(res1.address);
          }).catch((err) => {
            console.log("ERROR: ", err);
          });
      }).catch((error) => {
          console.error("Error while estimating gas.", error);
      });
    });
    */
  }

  static estimate(input) {
    return new Promise((resolve, reject) => {
      resolve(this.web3.eth.estimateGas({data:input}));
    });
  }

  /*
  updateOnClick(id) {
  var addr = PostContract.getGroupAddress(id);
  if (addr != undefined) {
    PostContract.joinGroup(addr);
    return;
  } else {
    var prom = PostContract.convertPost2Group(id);
    prom.then((addr) => {
      return;
    });
  }
  */

  static getPost(id) {
    return this.groupContractCurrentInstance.getPostByNumber.call(id);
  }

  static getPostIds() {
    return this.groupContractCurrentInstance.getPostNumbers.call();
    /*
    if (path === undefined || path === '' || path === '/') {
      return this.postsContractInstance.getPostNumbers.call();
    } else {
      console.log("PostContract wants to get posts for subgroup:", path);

      if (path.startsWith('/')) {
        path = path.slice(1);
      }
      const POST_TITLE_STRIPPER = /([0-9]+)(-([^\/]+))?\/?/g;
      var matches;
      while ((matches = POST_TITLE_STRIPPER.exec(path))) {
        let num = matches[1];
        let title = matches[3];
        let desc = 'post #' + num + (title ? ' of group titled "' + title + '"' : '');
        console.log("getPostIds needs to get group address for " + desc);
        this.postsContractInstance.getGroupAddress.call(num).then((addr) => {
          console.log("got group address for " + desc + ":", addr);
        });
      }
    }
    */
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
