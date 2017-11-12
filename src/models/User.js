import Ipfs from '../utils/Ipfs';
import BigNumber from 'bignumber.js';
import GroupStore from '../stores/GroupStore';
import CyberneticChat from '../blockchain/CyberneticChat';
import Wallet from '../models/Wallet';

class UserProperties {
  constructor(parentNumber, address) {
    this.address = address;
    this.parentNumber = parentNumber.toString();
    this.parentGroup = GroupStore.getGroup(this.parentNumber);
    this.loadListeners = [];
    this.updateListeners = [];
    this.loaded = false;
    this.loading = false;
  }

  populate({
    joinTime,
    balance,
    permissions,
    joined,
    banned,
    banReason,
  }) {
    this.joinTime = joinTime || this.joinTime;
    this.balance = (
      balance !== undefined ?
        balance
      :
        (
          this.balance !== undefined ?
            this.balance
          :
            new BigNumber(0)
        )
    );
    this.permissions = (permissions !== undefined ? permissions : this.permissions);
    this.joined = (joined !== undefined ? joined : this.joined);
    this.banned = (banned !== undefined ? banned : this.banned);
    this.banReason = (banReason !== undefined ? banReason : this.banReason);
    this.loaded = !!this.joinTime;
    this.fireUpdateListeners();
  }

  static userPropertiesStructToObject([
    parentNumber,
    joinTime,
    balance,
    permissions,
    joined,
    banned,
    banReason,
  ]) {
    return ({
      parentNumber,
      joinTime,
      balance,
      permissions,
      joined,
      banned,
      banReason,
    });
  }

  markLoaded() {
    this.loaded = true;
    this.loading = false;
    this.loadListeners.forEach((listener) => { listener.resolve() });
    this.loadListeners = [];
  }

  markLoadFailure(error) {
    this.loaded = false;
    this.loading = false;
    this.loadListeners.forEach((listener) => { listener.reject(error) });
    this.loadListeners = [];
  }

  isLoaded() {
    return (this.loaded);
  }

  load() {
    return new Promise((resolve, reject) => {
      if (!this.loaded) {
        if (this.loading) {
          this.loadListeners.push({ resolve, reject });
        } else {
          this.loading = true;
          console.log("UserProperties loading:", this.address);
          this.parentGroup.loadUserProperties(this.address).then((userPropertiesStruct) => {
            console.log("User loaded properties struct:", userPropertiesStruct);
            this.populate(UserProperties.userPropertiesStructToObject(userPropertiesStruct));
            this.markLoaded();
            resolve();
          }).catch((error) => {
            this.markLoadFailure(error);
            reject(error);
          });
        }
      } else {
        resolve();
      }
    });
  }

  reload() {
    if (this.loaded) {
      this.loaded = false;
    }
    return (this.load());
  }

  loadJoinTime() {
    return new Promise((resolve, reject) => {
      this.load().then(() => {
        resolve(this.joinTime);
      }).catch(reject);
    });
  }

  getJoinTime() {
    return (this.joinTime);
  }

  loadBalance() {
    return new Promise((resolve, reject) => {
      this.load().then(() => {
        resolve(this.balance);
      }).catch(reject);
    });
  }

  getBalance() {
    return (this.balance);
  }

  loadPermissions() {
    return new Promise((resolve, reject) => {
      this.load().then(() => {
        resolve(this.permissions);
      }).catch(reject);
    });
  }

  getPermissions() {
    return (this.permissions);
  }

  loadJoined() {
    return new Promise((resolve, reject) => {
      this.load().then(() => {
        resolve(this.joined);
      }).catch(reject);
    });
  }

  getJoined() {
    return (this.joined);
  }

  loadBanned() {
    return new Promise((resolve, reject) => {
      this.load().then(() => {
        resolve(this.banned);
      }).catch(reject);
    });
  }

  getBanned() {
    return (this.banned);
  }

  loadBanReason() {
    return new Promise((resolve, reject) => {
      this.load().then(() => {
        resolve(this.banReason);
      }).catch(reject);
    });
  }

  getBanReason() {
    return (this.banReason);
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

export default class User {
  constructor(address) {
    console.log("constructing user with address:", address);
    this.address = address;
    this.profileLoadListeners = [];
    this.headerLoadListeners = [];
    this.updateListeners = [];
    //TODO: profileUpdateListeners
    //TODO: propertiesUpdateListeners
    this.confirming = false;
    this.headerLoading = false;
    this.profileLoading = false;
    this.properties = [];
  }

  populateProfile({
    nickname,
    profile,
    profileMimeType,
    multiHashArray,
    multiHashString,
    profileLastUpdateTime,
  }) {
    this.nickname = (nickname !== undefined ? nickname : this.nickname);
    this.profile = (profile !== undefined ? profile : this.profile);
    this.profileMimeType = (profileMimeType !== undefined ? profileMimeType : this.profileMimeType);
    this.multiHashArray = (multiHashArray !== undefined ? multiHashArray : this.multiHashArray);
    this.multiHashString = (multiHashString !== undefined ? multiHashString : this.multiHashString);
    this.profileLastUpdateTime = (profileLastUpdateTime !== undefined ? profileLastUpdateTime : this.profileLastUpdateTime);
    this.profileExists = (!!this.profileLastUpdateTime ? true : (this.profileLastUpdateTime === undefined ? undefined : false));
    this.headerLoaded = this.headerLoaded || (this.multiHashString !== undefined);
    this.profileLoaded = this.profileLoaded || (this.profile !== undefined);
    this.fireProfileUpdateListeners();
  }

  getProperties(parentNumber) {
    if (!this.properties[parentNumber]) {
      this.properties[parentNumber] = new UserProperties(parentNumber, this.address);
      this.properties[parentNumber].load();
    }
    return (this.properties[parentNumber]);
  }

  isPropertiesLoaded(parentNumber) {
    return (this.properties[parentNumber] && this.properties[parentNumber].loaded);
  }

  isProfileLoaded() {
    return (this.profileLoaded);
  }

  getAddress() {
    return (this.address);
  }

  getNickname() {
    return (this.nickname);
  }

  getProfileMimeType() {
    return (this.profileMimeType);
  }

  getMultiHashString() {
    return (this.multiHashString);
  }

  getMultiHashArray() {
    return (this.multiHashArray);
  }

  getProfileLastUpdateTime() {
    return (this.profileLastUpdateTime);
  }

  updateProfile(nickname, profile, profileMimeType) {
    return new Promise((resolve, reject) => {
      if (profile) {
        Ipfs.saveContent(profile).then((multiHashString) => {
          const multiHashArray = Ipfs.extractMultiHash(multiHashString);
          const [ipfsHashFunction, ipfsHashLength, ipfsHash] = multiHashArray;
          Wallet.runTransactionSync('setUserProfile', 'update your profile', nickname, profileMimeType, ipfsHashFunction, ipfsHashLength, ipfsHash).then(() => {
            this.populateProfile({ nickname, profile, profileMimeType, multiHashString, multiHashArray });
            resolve();
          }).catch((error) => {
            reject(error);
          });
        }).catch((error) => {
          reject(error);
        });
      } else {
        Wallet.runTransactionSync('setUserProfile', 'update your profile', nickname, 0, 0, 0, 0).then(() => {
          this.populateProfile({ nickname, profile: null, profileMimeType: null, multiHashString: null, multiHashArray: null });
          resolve();
        }).catch((error) => {
          reject(error);
        });
      }
    });
  }

  static userProfileStructToObject([
    nickname,
    profileMimeType,
    ipfsHashFunction,
    ipfsHashLength,
    ipfsHash,
    profileLastUpdateTime,
  ]) {
    const multiHashArray = [ipfsHashFunction, ipfsHashLength, ipfsHash];
    return ({
      nickname,
      profileMimeType,
      multiHashArray,
      multiHashString: Ipfs.assembleMultiHash(multiHashArray),
      ipfsHashFunction,
      ipfsHashLength,
      ipfsHash,
      profileLastUpdateTime,
    });
  }

  markProfileHeaderLoaded() {
    this.headerLoaded = true;
    this.headerLoading = false;
    this.headerLoadListeners.forEach((listener) => { listener.resolve() });
    this.headerLoadListeners = [];
  }

  markProfileHeaderLoadedFailure(error) {
    this.headerLoading = false;
    this.headerLoadListeners.forEach((listener) => { listener.reject(error) });
    this.headerLoadListeners = [];
  }

  loadProfileHeader() {
    return new Promise((resolve, reject) => {
      if (!this.headerLoaded) {
        if (this.headerLoading) {
          this.headerLoadListeners.push({ resolve, reject });
        } else {
          this.headerLoading = true;
          console.log("User getUserProfile(", this.address, ")");
          CyberneticChat.getUserProfile(this.address).then((userProfileStruct) => {
            console.log("User loaded profile struct:", userProfileStruct);
            this.populateProfile(User.userProfileStructToObject(userProfileStruct));
            this.markProfileHeaderLoaded();
            resolve();
          }).catch((error) => {
            this.markProfileHeaderLoadedFailure(error);
            reject(error);
          });
        }
      } else {
        resolve();
      }
    });
  }

  reloadProfileHeader() {
    if (this.headerLoaded) {
      this.headerLoaded = false;
    }
    return (this.loadProfileHeader());
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
          this.loadProfileHeader().then(() => {
            Ipfs.getContent(this.multiHashString).then((profile) => {
              this.populateProfile({
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

  registerProfileUpdateListener(callback) {
    this.updateListeners.push(callback);
    return ({
      num: this.updateListeners.length,
    });
  }

  unregisterProfileUpdateListener(handle) {
    if (handle) {
      let {num} = handle;
      if (this.updateListeners) {
        delete (this.updateListeners[num - 1]);
      }
    }
  }

  fireProfileUpdateListeners() {
    this.updateListeners.forEach((listener) => {
      listener(this);
    });
  }

}
