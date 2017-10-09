import Ipfs from '../utils/Ipfs';

export default class Post {
  constructor(parentGroup, post) {
    this.parentGroup = parentGroup;
    this.contentLoadListeners = [];
    this.headerLoadListeners = [];
    this.confirmationListeners = [];
    this.populate(post);
    this.confirming = false;
    this.headerLoading = false;
    this.contentLoading = false;
  }

  populate({
    title,
    content,
    contentType,
    multiHashArray,
    multiHashString,
    creationTime,
    creator,
    balance,
    id,
    transactionId,
    permissions,
    groupAddress 
  }) {
    this.title = title || this.title;
    this.content = content || this.content;
    this.contentType = contentType || this.contentType;
    this.multiHashArray = multiHashArray || this.multiHashArray;
    this.multiHashString = (multiHashString === "" ? "" : (multiHashString || this.multiHashString));
    this.id = (id ? id.toString() : this.id);
    this.transactionId = transactionId || this.transactionId;
    this.permissions = permissions || this.permissions;
    this.groupAddress = groupAddress || this.groupAddress || '0x0000000000000000000000000000000000000000';
    this.creationTime = creationTime || this.creationTime;
    this.creator = creator || this.creator;
    this.balance = 0 || this.balance || balance;
    this.confirmed = !!this.id;
    this.headerLoaded = !!this.title;
    this.contentLoaded = !!this.content || this.multiHashString === "";
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
          this.waitForConfirmation().then(() => {
            this.parentGroup.loadPost(this.id).then(([
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
              const multiHashArray = [ipfsHashFunction, ipfsHashLength, ipfsHash];
              this.populate({
                title,
                id,
                contentType,
                multiHashArray,
                multiHashString: Ipfs.assembleMultiHash(multiHashArray),
                ipfsHashFunction,
                ipfsHashLength,
                ipfsHash,
                creator,
                creationTime,
                groupAddress,
                balance,
                permissions,
              });
              this.headerLoaded = true;
              this.headerLoading = false;
              this.headerLoadListeners.forEach((listener) => { listener.resolve() });
              this.headerLoadListeners = [];
              resolve();
            }).catch((error) => {
              this.headerLoading = false;
              this.headerLoadListeners.forEach((listener) => { listener.reject(error) });
              this.headerLoadListeners = [];
              reject(error);
            });
          }).catch((error) => {
            this.headerLoading = false;
            this.headerLoadListeners.forEach((listener) => { listener.reject(error) });
            this.headerLoadListeners = [];
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
              this.contentLoading = false;
              this.contentLoadListeners.forEach((listener) => { listener.resolve() });
              this.contentLoadListeners = [];
              resolve();
            }).catch((error) => {
              this.contentLoading = false;
              this.contentLoadListeners.forEach((listener) => { listener.reject(error) });
              this.contentLoadListeners = [];
              reject(error);
            });
          }).catch((error) => {
            this.contentLoading = false;
            this.contentLoadListeners.forEach((listener) => { listener.reject(error) });
            this.contentLoadListeners = [];
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


  waitForConfirmation() {
    return new Promise((resolve, reject) => {
      if (!this.confirmed) {
        if (this.confirming) {
          this.confirmationListeners.push({ resolve, reject });
        } else {
          this.confirming = true;
          var eventListenerHandle = this.parentGroup.registerNewPostEventListener((error, response) => {
            if (!error) {
              if (response.transactionHash === this.transactionId) {
                this.id = response.args.number.toString();
                this.confirmed = true;
                this.parentGroup.unregisterEventListener(eventListenerHandle);
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
