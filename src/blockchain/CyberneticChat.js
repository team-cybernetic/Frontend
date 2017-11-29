/*
This file is part of Cybernetic Chat.

Cybernetic Chat is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Cybernetic Chat is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Cybernetic Chat.  If not, see <http://www.gnu.org/licenses/>.
*/


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

  'Debug',
];

export default class CyberneticChat {
  static eventListeners = [[]];

  static initialize(web3, contractInstance) {
    this.web3 = web3;
    this.contractInstance = contractInstance;
    this.web3.eth.getBlockNumber((error, currentBlock) => {
      this.startupBlock = currentBlock;
      this.nextBlockListener = Blockchain.registerLatestBlockListener((error, blockid) => {
        this.web3.eth.getBlock(blockid, false, (error, result) => {
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
    EVENTS.forEach((eventName) => { //populate all events
      CyberneticChat['register' + eventName + 'EventListener'] = (callback) => {
        return (this.registerEventListener(eventName, callback));
      };
    });
    this.registerDebugEventListener((error, response) => {
      const args = response.args;
      console.log("CyberneticChat debug event:");
      Object.keys(args).forEach((key) => {
        console.log("\n" + key + ":", args[key].toString());
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

  static getSubposts(parentNumber) {
    return (this.contractInstance.getSubposts.call(parentNumber));
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
