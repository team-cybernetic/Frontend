import moment from 'moment';
import Ipfs from '../utils/Ipfs';

export default class Post {
  constructor(parentGroupContract, { title, content, contentType, multiHashArray, multiHashString = null, creationTime, creator, balance, id, transactionId, permissions, groupAddress }) {
    this.parentGroupContract = parentGroupContract;
    this.contentLoadListeners = [];
    this.headerLoadListeners = [];
    this.title = title;
    this.content = content;
    this.contentType = contentType;
    this.multiHashArray = multiHashArray;
    this.multiHashString = multiHashString;
    this.id = id;
    this.transactionId = transactionId;
    this.permissions = permissions;
    this.groupAddress = groupAddress;
    this.creationTime = creationTime || moment().unix();
    this.creator = creator;
    this.balance = balance || 0;
    this.confirming = false;
    this.confirmed = !!id;
    this.headerLoading = false;
    this.headerLoaded = false;
    this.contentLoading = false;
    this.contentLoaded = false;
  }

  //Loading methods so we can fetch the stuff we don't have. Asynchronous.
  load() {
    return new Promise((resolve, reject) => {
      this.loadHeader().then(() => {
        this.loadContent().then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      }).catch((error) => {
        reject(error);
      });
    });
  }

  loadHeader() {
    return new Promise((resolve, reject) => {
      if (!this.headerLoaded) {
        if (this.headerLoading) {
          this.headerLoadListeners.push({ resolve, reject });
        } else {
          this.headerLoading = true;
          this.parentGroupContract.getPost(this.id).then(([
            title,
            id,
            contentType,
            ipfsHashFunction,
            ipfsHashLength,
            ipfsHash,
            creator,
            creationTime,
            groupAddress,
            balance,
            permissions
          ]) => {
            this.title = title;
            this.contentType = contentType;
            this.multiHashArray = [ipfsHashFunction, ipfsHashLength, ipfsHash];
            this.multiHashString = Ipfs.assembleMultiHash(this.multiHashArray);
            this.permissions = permissions;
            this.groupAddress = groupAddress;
            this.creationTime = creationTime || moment().unix();
            this.creator = creator;
            this.balance = balance || 0;
            this.headerLoaded = true;
            this.headerLoadListeners.forEach((listener) => { listener.resolve() });
            resolve();
          }).catch((error) => {
            this.headerLoadListeners.forEach((listener) => listener.reject(error));
            reject(error);
          });
        }
      } else {
        resolve();
      }
    });
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
              this.content = content;
              this.contentLoaded = true;
              this.contentLoadListeners.forEach((listener) => { listener.resolve() });
              resolve();
            }).catch((error) => {
              this.contentLoading = false;
              this.contentLoadListeners.forEach((listener) => { listener.reject(error) });
              reject(error);
            });
          }).catch((error) => {
            reject(error);
          });
        }
      } else {
        resolve();
      }
    });
  }

  waitForConfirmation() {
    return new Promise((resolve, reject) => {
      if (!this.confirmed) {
        if (this.confirming) {
          this.confirmationListeners.push({ resolve, reject });
        } else {
          this.confirming = true;
          var eventListenerHandle = this.parentGroupContract.registerNewPostEventListener((error, response) => {
            if (!error) {
              if (response.transactionHash === this.transactionId) {
                this.id = response.args.number.c[0]; //TODO: bigint to string?
                this.confirmed = true;
                this.parentGroupContract.unregisterEventListener(eventListenerHandle);
                this.confirmationListeners.forEach((listener) => { listener.resolve() });
                resolve();
              }
            } else {
              this.confirming = false;
              this.confirmationListeners.forEach((listener) => { listener.reject(error) });
              reject(error);
            }
          });
        }
      } else {
        resolve();
      }
    });
  }
}
