import Ipfs from '../utils/Ipfs';

export default class Post {
  constructor(parentGroup, post) {
    this.parentGroup = parentGroup;
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
    //this.confirmed = !!this.id;
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
  ]) {
    const multiHashArray = [ipfsHashFunction, ipfsHashLength, ipfsHash];
    return ({
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
          console.log("waiting for confirmation of post", this.id);
          this.waitForConfirmation().then((postExists) => {
            if (!postExists) {
              let error = new Error("Post " + this.id + " does not exist!");
              this.markHeaderLoadedFailure(error);
              reject(error);
              return;
            }
            console.log("post", this.id, "confirmed");
            this.parentGroup.loadPost(this.id).then((postStruct) => {
              console.log("post", this.id, "loaded", postStruct);
              this.populate(this.postStructToObject(postStruct));
              console.log(this);
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
            this.parentGroup.postExistsByNumber(this.id).then((result) => {
              this.markConfirmed(result);
              resolve(result);
            }).catch((error) => {
              this.markConfirmedFailure(error);
              reject(error);
            });
          } else {
            var eventListenerHandle = this.parentGroup.registerPostCreatedEventListener((error, response) => {
              if (!error) {
                if (response.transactionHash === this.transactionId) {
                  this.populate({
                    id: response.args.postNumber.toString(),
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
