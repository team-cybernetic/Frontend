import Ipfs from '../utils/Ipfs';
import BigNumber from 'bignumber.js';

export default class User {
  constructor(parentGroup, user) {
    this.parentGroup = parentGroup;
    this.profileLoadListeners = [];
    this.headerLoadListeners = [];
    this.confirmationListeners = [];
    this.updateListeners = [];
    this.populate(user);
    this.confirming = false;
    this.headerLoading = false;
    this.profileLoading = false;
  }

  populate({
    nickname,
    profile,
    profileType,
    multiHashArray,
    multiHashString,
    joinTime,
    address,
    balance,
    parentNumber,
    transactionId,
    permissions,
    banned,
    updateTime,
  }) {
    this.nickname = nickname || this.nickname;
    this.profile = profile || this.profile;
    this.profileType = profileType || this.profileType;
    this.multiHashArray = multiHashArray || this.multiHashArray;
    this.multiHashString = (multiHashString === "" ? "" : (multiHashString || this.multiHashString));
    this.parentNumber = (parentNumber ? parentNumber.toString() : this.parentNumber);
    this.transactionId = transactionId || this.transactionId;
    this.permissions = permissions || this.permissions;
    this.joinTime = joinTime || this.joinTime;
    this.updateTime = updateTime || this.updateTime;
    this.banned = banned || this.banned;
    this.address = address || this.address;
    this.balance = balance || this.balance || new BigNumber(0);
    this.confirmed = !!this.parentNumber;
    this.headerLoaded = !!this.nickname || (this.confirmed && !!this.address);
    this.profileLoaded = !!this.profile || this.multiHashString === "";
    this.fireUpdateListeners();
  }

  isConfirmed() {
    return (this.confirmed);
  }

  isHeaderLoaded() {
    return (this.headerLoaded);
  }

  isProfileLoaded() {
    return (this.profileLoaded);
  }

  isLoaded() {
    return (this.isConfirmed() && this.isHeaderLoaded() && this.isProfileLoaded());
  }

  getAddress() {
    return (this.address);
  }

  getParentNumber() {
    return (this.parentNumber);
  }

  getBalance() {
    return (this.balance || new BigNumber(0));
  }

  //Loading methods so we can fetch the stuff we don't have. Asynchronous.
  load() {
    return new Promise((resolve, reject) => {
      this.loadProfile().then(() => { //loadProfile calls loadHeader which calls waitForConfirmation
        resolve();
      }).catch((error) => {
        reject(error);
      });
    });
  }

  static userStructToObject([
    parentNumber,
    nickname,
    profileType,
    ipfsHashFunction,
    ipfsHashLength,
    ipfsHash,
    address,
    joinTime,
    balance,
    permissions,
    banned,
  ]) {
    const multiHashArray = [ipfsHashFunction, ipfsHashLength, ipfsHash];
    return ({
      parentNumber,
      nickname,
      profileType,
      multiHashArray,
      multiHashString: Ipfs.assembleMultiHash(multiHashArray),
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      address,
      joinTime,
      balance,
      permissions,
      banned,
    });
  }

  static userProfileStructToObject([
    nickname,
    profileType,
    ipfsHashFunction,
    ipfsHashLength,
    ipfsHash,
    updateTime,
  ]) {
    const multiHashArray = [ipfsHashFunction, ipfsHashLength, ipfsHash];
    return ({
      nickname,
      profileType,
      multiHashArray,
      multiHashString: Ipfs.assembleMultiHash(multiHashArray),
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      updateTime,
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
          this.waitForConfirmation().then((userExists) => {
            if (!userExists) {
              let error = new Error("User " + this.id + " does not exist!");
              this.markHeaderLoadedFailure(error);
              reject(error);
              return;
            }
            if (!this.headerLoaded) { //waitForConfirmation can load header on an edge case
              this.parentGroup.loadUserProperties(this.address).then((userStruct) => {
                console.log("User loaded struct:", userStruct);
                this.populate(User.userStructToObject(userStruct));
                this.markHeaderLoaded();
                resolve();
              }).catch((error) => {
                this.markHeaderLoadedFailure(error);
                reject(error);
              });
            } else {
              resolve();
            }
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

  markProfileLoaded() {
    this.profileLoaded = true;
    this.profileLoading = false;
    this.profileLoadListeners.forEach((listener) => { listener.resolve() });
    this.profileLoadListeners = [];
  }

  markProfileLoadedFailure(error) {
    this.profileLoading = false;
    this.profileLoadListeners.forEach((listener) => { listener.reject(error) });
    this.profileLoadListeners = [];
  }

  loadProfile() {
    return new Promise((resolve, reject) => {
      if (!this.profileLoaded) {
        if (this.profileLoading) {
          this.profileLoadListeners.push({ resolve, reject });
        } else {
          this.profileLoading = true;
          this.loadHeader().then(() => {
            Ipfs.getContent(this.multiHashString).then((profile) => {
              this.populate({
                profile,
              });
              this.markProfileLoaded();
              resolve();
            }).catch((error) => {
              this.markProfileLoadedFailure(error);
              reject(error);
            });
          }).catch((error) => {
            this.markProfileLoadedFailure(error);
            reject(error);
          });
        }
      } else {
        resolve();
      }
    });
  }

  reloadProfile() {
    if (this.profileLoaded) {
      this.profileLoaded = false;
    }
    return (this.loadProfile());
  }

  markConfirmed() {
    this.confirmed = true;
    this.confirming = false;
    this.confirmationListeners.forEach((listener) => { listener.resolve() });
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
          if (this.transactionId) {
            var eventListenerHandle = this.parentGroup.registerUserJoinedEventListener((error, response) => { //TODO: parentGroup.waitForNewUserEvent(txid).then((response) =>
              if (!error) {
                if (response.transactionHash === this.transactionId) {
                  this.populate({
                    id: response.args.userNumber.toString(),
                    address: response.args.userAddress.toString(),
                  });
                  this.markConfirmed();
                  this.parentGroup.unregisterEventListener(eventListenerHandle);
                  resolve(true);
                }
              } else {
                this.markConfirmedFailure(error);
                this.parentGroup.unregisterEventListener(eventListenerHandle);
                reject(error);
              }
            });
          } else {
            if (this.address) {
              console.log("waitForConfirmation: confirming user by address:", this.address);
              this.parentGroup.loadUserProperties(this.address).then((userStruct) => {
                console.log("waitForConfirmation: loaded user:", userStruct);
                const userFields = User.userStructToObject(userStruct);
                console.log("waitForConfirmation: loaded struct:", userFields);
                this.populate(userFields);
                console.log("waitForConfirmation: marking user as loaded");
                this.markConfirmed();
                console.log("waitForConfirmation: marking header as loaded");
                this.markHeaderLoaded();
                console.log("waitForConfirmation: resolving true");
                resolve(true);
              }).catch((error) => {
                this.markConfirmedFailure(error);
                reject(error);
              });
            } else {
              console.error("User not confirmed (no id), no txid, and no address??");
              reject(new Error("User not confirmed (no id), no txid, and no address??"));
            }
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
