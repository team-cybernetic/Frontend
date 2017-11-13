import Blockchain from './Blockchain';

const EVENT_POST_CREATED = 'PostCreated';
const EVENT_USER_JOINED = 'UserJoined';
const EVENT_USER_LEFT = 'UserLeft';
const EVENT_USER_BALANCE_CHANGED = 'UserBalanceChanged';
const EVENT_POST_BALANCE_CHANGED = 'PostBalanceChanged';
const EVENT_POST_TOKENS_CHANGED = 'PostTokensChanged';

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
            this.watchForEvent(EVENT_POST_CREATED, {}, (error, response) => {
              console.log("EVENT: Post created! response:", response);
              this.fireEventListener(EVENT_POST_CREATED, error, response);
            });
            this.watchForEvent(EVENT_USER_JOINED, {}, (error, response) => {
              console.log("EVENT: User joined! response:", response);
              this.fireEventListener(EVENT_USER_JOINED, error, response);
            });
            this.watchForEvent(EVENT_USER_LEFT, {}, (error, response) => {
              console.log("EVENT: User left! response:", response);
              this.fireEventListener(EVENT_USER_LEFT, error, response);
            });
            this.watchForEvent(EVENT_USER_BALANCE_CHANGED, {}, (error, response) => {
              console.log("EVENT: User balance changed! response:", response);
              this.fireEventListener(EVENT_USER_BALANCE_CHANGED, error, response);
            });
            this.watchForEvent(EVENT_POST_BALANCE_CHANGED, {}, (error, response) => {
              console.log("EVENT: Post balance changed! response:", response);
              this.fireEventListener(EVENT_POST_BALANCE_CHANGED, error, response);
            });
            this.watchForEvent(EVENT_POST_TOKENS_CHANGED, {}, (error, response) => {
              console.log("EVENT: Post tokens changed! response:", response);
              this.fireEventListener(EVENT_POST_TOKENS_CHANGED, error, response);
            });

          }
        });
      });
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

  static registerPostCreatedEventListener(callback) {
    return (this.registerEventListener(EVENT_POST_CREATED, callback));
  }

  static registerUserJoinedEventListener(callback) {
    return (this.registerEventListener(EVENT_USER_JOINED, callback));
  }

  static registerUserLeftEventListener(callback) {
    return (this.registerEventListener(EVENT_USER_LEFT, callback));
  }

  static registerUserBalanceChangedListener(callback) {
    return (this.registerEventListener(EVENT_USER_BALANCE_CHANGED, callback));
  }

  static registerPostBalanceChangedListener(callback) {
    return (this.registerEventListener(EVENT_POST_BALANCE_CHANGED, callback));
  }

  static registerPostTokensChangedListener(callback) {
    return (this.registerEventListener(EVENT_POST_TOKENS_CHANGED, callback));
  }

  static fireEventListener(eventName, error, response) {
    if (this.eventListeners[eventName] && this.eventListeners[eventName].length > 0) {
      this.eventListeners[eventName].forEach((listener) => {
        listener(error, response);
      });
    }
  }
}
