import Blockchain from './Blockchain';

const EVENTS = [
  'PostCreated',
  'PostLocked',
  'PostUnlocked',
  'PostBalanceChanged',
  'PostTokensChanged',

  'UserProfileChanged',
  'UserJoined',
  'UserLeft',
  'UserKicked',
  'UserBanned',
  'UserMuted',
  'UserBalanceChanged',

  'UserJoinDenied',
  'PostCreationDenied',
];

export default class CyberneticChat {
  static eventListeners = [[]];

  static initialize(web3, contractInstance) {
    this.web3 = web3;
    this.contractInstance = contractInstance;
    this.web3.eth.getBlockNumber((error, currentBlock) => {
      console.log("CyberneticChat instance started up on block", currentBlock);
      this.startupBlock = currentBlock;
      this.nextBlockListener = Blockchain.registerLatestBlockListener((error, blockid) => {
        console.log("nextblock:", blockid);
        this.web3.eth.getBlock(blockid, false, (error, result) => {
          console.log("nextblock actual: ", result);
          if (!error && result.number === (currentBlock + 1)) {
            Blockchain.unregisterLatestBlockListener(this.nextBlockListener);
            EVENTS.forEach((eventName) => {
              this.watchForEvent(eventName, {}, (error, response) => {
                console.log("EVENT: ", eventName, "! response:", response, "args:", response.args);
                this.fireEventListener(eventName, error, response);
              });
            });
          }
        });
      });
    });
    EVENTS.forEach((eventName) => {
      CyberneticChat['register' + eventName + 'Listener'] = (callback) => {
        return (this.registerEventListener(eventName, callback));
      };
    });
  }

  static getContractInstance() {
    return (this.contractInstance);
  }

  static watchEvent(eventName, filter, options, callback) {
    this.contractInstance[eventName](filter, options).watch(callback);
  }

  static watchForEvent(eventName, filter, callback) {
    this.watchEvent(eventName, filter, {fromBlock: 'latest', toBlock: 'latest'}, callback);
  }

  static getPost(id) {
    return (this.contractInstance.getPost.call(id));
  }

  static getChildren(parentNumber) {
    return (this.contractInstance.getChildren.call(parentNumber));
  }

  static getUsers(parentNumber) {
    return (this.contractInstance.getUsers.call(parentNumber));
  }

  static userExists(parentNumber, addr) {
    return (this.contractInstance.userExists.call(parentNumber, addr));
  }

  static postExists(id) {
    return (this.contractInstance.postExists.call(id));
  }

  static getUserProfile(addr) {
    return (this.contractInstance.getUserProfile.call(addr));
  }

  static getUserProperties(parentNumber, addr) {
    return (this.contractInstance.getUserProperties.call(parentNumber, addr));
  }

  static unregisterEventListener(handle) {
    if (handle) {
      let {eventName, num} = handle;
      delete (this.eventListeners[eventName][num - 1]);
    }
  }

  static registerEventListener(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(callback);
    return ({
      eventName,
      num: this.eventListeners[eventName].length,
    });
  }

  static fireEventListener(eventName, error, response) {
    if (this.eventListeners[eventName] && this.eventListeners[eventName].length > 0) {
      this.eventListeners[eventName].forEach((listener) => {
        listener(error, response);
      });
    }
  }
}
