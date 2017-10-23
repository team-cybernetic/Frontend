import Ipfs from '../utils/Ipfs';

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
    id,
    transactionId,
    permissions,
    directAddress,
  }) {
    this.nickname = nickname || this.nickname;
    this.profile = profile || this.profile;
    this.profileType = profileType || this.profileType;
    this.multiHashArray = multiHashArray || this.multiHashArray;
    this.multiHashString = (multiHashString === "" ? "" : (multiHashString || this.multiHashString));
    this.id = (id ? id.toString() : this.id);
    this.transactionId = transactionId || this.transactionId;
    this.permissions = permissions || this.permissions;
    this.directAddress = directAddress || this.directAddress || '0x0000000000000000000000000000000000000000';
    this.joinTime = joinTime || this.joinTime;
    this.address = address || this.address;
    this.balance = 0 || this.balance || balance;
    this.confirmed = !!this.id;
    this.headerLoaded = !!this.nickname || (!!this.id && !!this.address);
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

  getNumber() {
    return (this.id);
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

  userStructToObject([
    nickname,
    number,
    profileType,
    ipfsHashFunction,
    ipfsHashLength,
    ipfsHash,
    address,
    joinTime,
    directAddress,
    balance,
    permissions,
  ]) {
    const multiHashArray = [ipfsHashFunction, ipfsHashLength, ipfsHash];
    return ({
      nickname,
      number,
      profileType,
      multiHashArray,
      multiHashString: Ipfs.assembleMultiHash(multiHashArray),
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      address,
      joinTime,
      directAddress,
      balance,
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
          this.waitForConfirmation().then((userExists) => {
            if (!userExists) {
              let error = new Error("User " + this.id + " does not exist!");
              this.markHeaderLoadedFailure(error);
              reject(error);
              return;
            }
            if (!this.headerLoaded) { //waitForConfirmation can load header on an edge case
              this.parentGroup.loadUserByNumber(this.id).then((userStruct) => {
                this.populate(this.userStructToObject(userStruct));
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
              this.parentGroup.loadUserByAddress(this.address).then((userStruct) => {
                this.populate(this.userStructToObject(userStruct));
                this.markConfirmed();
                this.markHeaderLoaded();
                resolve(true);
              }).catch((error) => {
                this.markConfirmedFailure(error);
                reject(error);
              });
            } else {
              console.error("uhh, how did we get here? User not confirmed (no id), no txid, and no address??");
              reject("uhh, how did we get here? User not confirmed (no id), no txid, and no address??");
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
