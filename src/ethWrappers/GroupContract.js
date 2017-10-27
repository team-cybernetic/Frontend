const EVENT_POST_CREATED = 'PostCreated';
const EVENT_GROUP_CREATED = 'SubgroupCreated';
const EVENT_USER_JOINED = 'UserJoined';
const EVENT_USER_LEFT = 'UserLeft';
const EVENT_USER_BALANCE_CHANGED = 'UserBalanceChanged';

export default class GroupContract {
  constructor(web3, contractInstance) {
    this.web3 = web3;
    this.contractInstance = contractInstance;
    this.eventListeners = [[]];
    this.watchForEvent(EVENT_POST_CREATED, {}, (error, response) => {
      this.fireEventListener(EVENT_POST_CREATED, error, response);
    });
    this.watchForEvent(EVENT_GROUP_CREATED, {}, (error, response) => {
      this.fireEventListener(EVENT_GROUP_CREATED, error, response);
    });
    this.watchForEvent(EVENT_USER_JOINED, {}, (error, response) => {
      this.fireEventListener(EVENT_USER_JOINED, error, response);
    });
    this.watchForEvent(EVENT_USER_LEFT, {}, (error, response) => {
      this.fireEventListener(EVENT_USER_LEFT, error, response);
    });
    this.watchForEvent(EVENT_USER_BALANCE_CHANGED, {}, (error, response) => {
      this.fireEventListener(EVENT_USER_BALANCE_CHANGED, error, response);
    });
  }

  getContractInstance() {
    return (this.contractInstance);
  }

  watchEvent(eventName, filter, options, callback) {
    this.contractInstance[eventName](filter, options).watch(callback);
  }

  watchForEvent(eventName, filter, callback) {
    this.watchEvent(eventName, filter, {fromBlock: this.web3.eth.blockNumber, toBlock: 'latest'}, callback);
  }

  getPost(id) {
    return (this.contractInstance.getPostByNumber.call(id));
  }

  getPostIds() {
    return (this.contractInstance.getPostNumbers.call());
  }

  getUserIds() {
    return (this.contractInstance.getUserNumbers.call());
  }

  userExistsByAddress(addr) {
    return (this.contractInstance.userExistsByAddress.call(addr));
  }

  userExistsByNumber(num) {
    return (this.contractInstance.userExistsByNumber.call(num));
  }

  postExistsByNumber(num) {
    return (this.contractInstance.postExistsByNumber.call(num));
  }

  getUserByNumber(num) {
    return (this.contractInstance.getUserByNumber.call(num));
  }

  getUserByAddress(address) {
    return (this.contractInstance.getUserByAddress.call(address));
  }

  unregisterEventListener(handle) {
    if (handle) {
      let {eventName, num} = handle;
      delete (this.eventListeners[eventName][num - 1]);
    }
  }

  registerEventListener(eventName, callback) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(callback);
    return ({
      eventName,
      num: this.eventListeners[eventName].length,
    });
  }

  registerPostCreatedEventListener(callback) {
    return (this.registerEventListener(EVENT_POST_CREATED, callback));
  }

  registerSubgroupCreatedEventListener(callback) {
    return (this.registerEventListener(EVENT_GROUP_CREATED, callback));
  }

  registerUserJoinedEventListener(callback) {
    return (this.registerEventListener(EVENT_USER_JOINED, callback));
  }

  registerUserLeftEventListener(callback) {
    return (this.registerEventListener(EVENT_USER_LEFT, callback));
  }

  registerUserBalanceChangedListener(callback) {
    return (this.registerEventListener(EVENT_USER_BALANCE_CHANGED, callback));
  }

  fireEventListener(eventName, error, response) {
    if (this.eventListeners[eventName] && this.eventListeners[eventName].length > 0) {
      this.eventListeners[eventName].forEach((listener) => {
        listener(error, response);
      });
    }
  }
}
