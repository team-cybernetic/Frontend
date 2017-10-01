import GasEstimator from '../utils/GasEstimator';
import TruffleContract from 'truffle-contract';
import PostsContract from '../contracts/Posts.json'
import PostStore from '../stores/PostStore';
import ChildView from '../components/ChildrenView';

export default class PostContract {
  static postsContractInstance = null;
  static web3 = null;
  static createdPostsAwaitingPromiseResolution = {};
  static groupAddressSet = [];

  static initialize(web3, postsContractInstance) {
    this.web3 = web3;
    this.postsContractInstance = postsContractInstance;
    this.web3.eth.filter("pending").watch((error, txid) => {
      this.listenForPendingPostTransactions(error, txid);
    });
  }

  static setParent() {
    var address = this.postsContractInstance.address;
    return new Promise((resolve, reject) => {
      GasEstimator.estimate('setParent').then((gas) => {
        let actualGas = gas * 3;
        console.log("gas estimator estimates that this setParent call will cost", gas, "gas, actualGas =", actualGas);
        this.postsContractInstance.setParent(address,{ gas: actualGas }, (error, output) => {
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
        this.postsContractInstance.contract.createPost(title, contentType, multiHashArray[0], multiHashArray[1], multiHashArray[2], creationTime, { gas: actualGas }, (error, transactionId) => {
          if (error) {
            console.error("Error while executing createPost contract function.", error);
          } else {
            this.createdPostsAwaitingPromiseResolution[transactionId] = { resolve, reject };
          }
        });
      }).catch((error) => {
        console.error("Error while estimating gas.", error);
      });
    });
  }

  /*static joinGroup(groupAddress) {
    const postsContract = TruffleContract(PostsContract);
    postsContract.setProvider(this.web3.currentProvider);
    var newContract = postsContract.at(groupAddress);
    PostStore.postsContractInstance = newContract;
    this.postsContractInstance = newContract;
    ChildView.state = {
      posts: null,
    };
  }*/

  //I have literally no idea why this/getgroupaddress don't work
  //I spent ~8 hours debugging these and they just inexplicably do not work
  static setGroupAddress(postNum, groupAddress) {
    return new Promise((resolve, reject) => {
      GasEstimator.estimate('setGroupAddress', postNum, groupAddress).then((gas) => {
        let actualGas = gas;
        console.log("setgroupaddress is setting to ", groupAddress);
        console.log("gas estimator estimates that this setGroupAddress call will cost", gas, "gas, actualGas =", actualGas);
        groupAddress = this.postsContractInstance.address;
        console.log(postNum, groupAddress);
        var p = this.postsContractInstance.setGroupAddress.call(postNum, groupAddress.valueOf(), { gas: actualGas * 30 });
        p.then((result) => {
          resolve(result);
        });
      }).catch((error) => {
        console.error("Error while estimating gas.", error);
      });
    });
  }
  /*static setGroupAddress(postNum, groupAddress) {
    this.groupAddressSet[postNum] = groupAddress;
    return groupAddress;
  }
  static getGroupAddress(postNum) {
    return this.groupAddressSet[postNum];
  }*/

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
  }

  static convertPost2Group(postNum) {
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
  }

  static estimate(input) {
    return new Promise((resolve, reject) => {
      resolve(this.web3.eth.estimateGas({data:input}));
    });
  }

  static getPost(id) {
    return this.postsContractInstance.getPostByNumber.call(id);
  }

  static getPostIds() {
    return this.postsContractInstance.getPostNumbers.call()
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
