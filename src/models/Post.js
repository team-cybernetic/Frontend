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


import Ipfs from '../utils/Ipfs';
import BigNumber from 'bignumber.js';
import UserStore from '../stores/UserStore';
import CyberneticChat from '../blockchain/CyberneticChat';
import GroupStore from '../stores/GroupStore';

export default class Post {
  constructor(post) {
    this.contentLoadListeners = [];
    this.headerLoadListeners = [];
    this.confirmationListeners = [];
    this.updateListeners = [];
    this.populate(post);
    this.confirming = false;
    this.headerLoading = false;
    this.contentLoading = false;
    this.confirmed = false;
  }

  populate({
    id,
    parentNumber,
    title,
    content,
    contentType,
    multiHashArray,
    multiHashString,
    creationTime,
    creator,
    balance,
    tokens,
    permissions,
    transactionId,
  }) {
    this.title = title || this.title;
    this.content = content || this.content;
    this.contentType = contentType || this.contentType;
    this.multiHashArray = multiHashArray || this.multiHashArray;
    this.multiHashString = (multiHashString === "" ? "" : (multiHashString || this.multiHashString));
    this.id = (id ? id.toString() : this.id);
    this.parentNumber = (parentNumber ? parentNumber.toString() : this.parentNumber);
    this.transactionId = transactionId || this.transactionId;
    this.permissions = permissions || this.permissions;
    this.creationTime = creationTime || this.creationTime;
    this.creator = creator || this.creator;
    this.balance = balance || this.balance || new BigNumber(0);
    this.tokens = tokens || this.tokens || new BigNumber(0);
    this.confirmed = !!this.id;
    this.headerLoaded = !!this.title;
    this.contentLoaded = !!this.content || this.multiHashString === "";
    this.fireUpdateListeners();
  }

  isConfirmed() {
    return (this.confirmed);
  }

  isHeaderLoaded() {
    return (this.headerLoaded);
  }

  isContentLoaded() {
    return (this.contentLoaded);
  }

  isLoaded() {
    return (this.isConfirmed() && this.isHeaderLoaded() && this.isContentLoaded());
  }

  getGroup() {
    return (GroupStore.getGroup(this.id));
  }

  /**
   * Get the balance this post owns in its parent group
   */
  getBalance() {
    return (this.balance || new BigNumber(0));
  }

  /**
   * Get the total number of tokens this post has issued to its subposts and users
   */
  getTokens() {
    return (this.tokens || new BigNumber(0));
  }

  getNumber() {
    return (this.id);
  }

  getParentNumber() {
    return (this.parentNumber);
  }

  getParentGroup() {
    return (GroupStore.getGroup(this.parentNumber));
  }

  getCreatorAddress() {
    return (this.creator);
  }

  getCreator() {
    return (UserStore.getUser(this.creator));
  }

  //Loading methods so we can fetch the stuff we don't have. Asynchronous.
  load() {
    return new Promise((resolve, reject) => {
      this.loadContent().then(() => { //loadContent calls loadHeader which calls waitForConfirmation
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }

  postStructToObject([
    id,
    parentNumber,
    title,
    contentType,
    ipfsHashFunction,
    ipfsHashLength,
    ipfsHash,
    creator,
    creationTime,
    balance,
    tokens,
    permissions
  ]) {
    const multiHashArray = [ipfsHashFunction, ipfsHashLength, ipfsHash];
    return ({
      id,
      parentNumber,
      title,
      contentType,
      multiHashArray,
      multiHashString: Ipfs.assembleMultiHash(multiHashArray),
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      creator,
      creationTime,
      balance,
      tokens,
      permissions,
    });
  }

  markHeaderLoaded() {
    this.headerLoaded = true;
    this.headerLoading = false;
    this.headerLoadListeners.forEach((listener) => { listener.resolve() });
    this.headerLoadListeners = [];
  }

  markHeaderLoadedFailure(error) {
    this.headerLoading = false;
    this.headerLoadListeners.forEach((listener) => { listener.reject(error) });
    this.headerLoadListeners = [];
  }

  loadHeader() {
    return new Promise((resolve, reject) => {
      if (!this.headerLoaded) {
        if (this.headerLoading) {
          this.headerLoadListeners.push({ resolve, reject });
        } else {
          this.headerLoading = true;
          // console.log("waiting for confirmation of post", this.id);
          this.waitForConfirmation().then((postExists) => {
            if (!postExists) {
              let error = new Error("Post " + this.id + " does not exist!");
              this.markHeaderLoadedFailure(error);
              reject(error);
              return;
            }
            // console.log("post", this.id, "confirmed");
            CyberneticChat.getPost(this.id).then((postStruct) => {
              // console.log("post", this.id, "loaded", postStruct);
              this.populate(this.postStructToObject(postStruct));
              console.log("Post", this.id, ":", this);
              //console.log(this);
              this.markHeaderLoaded();
              resolve();
            }).catch((error) => {
              this.markHeaderLoadedFailure(error);
              reject(error);
            });
          }).catch((error) => {
            this.markHeaderLoadedFailure(error);
            reject(error);
          });
        }
      } else {
        resolve();
      }
    });
  }

  reloadHeader() {
    if (this.headerLoaded) {
      this.headerLoaded = false;
    }
    return (this.loadHeader());
  }

  markContentLoaded() {
    this.contentLoaded = true;
    this.contentLoading = false;
    this.contentLoadListeners.forEach((listener) => { listener.resolve() });
    this.contentLoadListeners = [];
  }

  markContentLoadedFailure(error) {
    this.contentLoading = false;
    this.contentLoadListeners.forEach((listener) => { listener.reject(error) });
    this.contentLoadListeners = [];
  }

  loadContent() {
    return new Promise((resolve, reject) => {
      if (!this.contentLoaded) {
        if (this.contentLoading) {
          this.contentLoadListeners.push({ resolve, reject });
        } else {
          this.contentLoading = true;
          this.loadHeader().then(() => {
            Ipfs.getContent(this.multiHashString).then((content) => {
              this.populate({
                content,
              });
              this.markContentLoaded();
              resolve();
            }).catch((error) => {
              this.markContentLoadedFailure(error);
              reject(error);
            });
          }).catch((error) => {
            this.markContentLoadedFailure(error);
            reject(error);
          });
        }
      } else {
        resolve();
      }
    });
  }

  reloadContent() {
    if (this.contentLoaded) {
      this.contentLoaded = false;
    }
    return (this.loadContent());
  }

  markConfirmed(result = true) {
    this.confirmed = result;
    this.confirming = false;
    this.confirmationListeners.forEach((listener) => { listener.resolve(result) });
    this.confirmationListeners = [];
  }

  markConfirmedFailure(error) {
    this.confirming = false;
    this.confirmationListeners.forEach((listener) => { listener.reject(error) });
    this.confirmationListeners = [];
  }

  waitForConfirmation() {
    return new Promise((resolve, reject) => {
      if (!this.confirmed) {
        if (this.confirming) {
          this.confirmationListeners.push({ resolve, reject });
        } else {
          this.confirming = true;
          if (!!this.id) {
            CyberneticChat.postExists(this.id).then((result) => {
              this.markConfirmed(result);
              resolve(result);
            }).catch((error) => {
              this.markConfirmedFailure(error);
              reject(error);
            });
          } else {
            var eventListenerHandle = CyberneticChat.registerPostCreatedEventListener((error, response) => {
              if (!error) {
                if (response.transactionHash === this.transactionId) {
                  this.populate({
                    id: response.args.postNumber.toString(),
                  });
                  this.markConfirmed();
                  CyberneticChat.unregisterEventListener(eventListenerHandle);
                  resolve(true);
                }
              } else {
                this.markConfirmedFailure(error);
                CyberneticChat.unregisterEventListener(eventListenerHandle);
                reject(error);
              }
            });
          }
        }
      } else {
        resolve(true);
      }
    });
  }

  registerUpdateListener(callback) {
    this.updateListeners.push(callback);
    return ({
      num: this.updateListeners.length,
    });
  }

  unregisterUpdateListener(handle) {
    if (handle) {
      let {num} = handle;
      if (this.updateListeners) {
        delete (this.updateListeners[num - 1]);
      }
    }
  }

  fireUpdateListeners() {
    this.updateListeners.forEach((listener) => {
      listener(this);
    });
  }

}
