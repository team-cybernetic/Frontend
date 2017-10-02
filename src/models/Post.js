import moment from 'moment';
import WalletStore from '../stores/WalletStore';
import PostStore from '../stores/PostStore';
import PostContract from '../ethWrappers/PostContract';
import Ipfs from '../utils/Ipfs';

export default class Post {
  constructor({ title, content, contentType, multiHashArray, multiHashString = null, creationTime, creator, balance, id, transactionId, permissions, groupAddress }) {
    this.contentLoadListeners = [];
    this.headerLoadListeners = [];
    this.fullCreationLoadListeners = [];
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
    this.creator = creator || WalletStore.getDefaultAccount();
    this.balance = balance || 0;

    if (id) {
      this.loadHeader();
    } else if (!content) {
      this.loadContent();
    }
  }

  set transactionId(newTransactionId) {
    this._transactionId = newTransactionId;
    if (!this.id && newTransactionId) {
      this.loadId(); //if this is the case, we know we just created the post so content is already populated
    }
  }

  get transactionId() {
    return this._transactionId;
  }

  //Loading methods so we can fetch the stuff we don't have. Asynchronous.

  loadHeader(alsoLoadContent = true) {
    PostContract.getPost(this.id).then(([
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
      this.headerLoadListeners.forEach((listener) => listener());
      if (alsoLoadContent) {
        this.loadContent();
      }
    });
  }

  loadId() {
    PostStore.addTransactionIdListener(this.transactionId, (id) => {
      this.id = id;
      this.loadHeader(false);
      this.fullCreationLoadListeners.forEach((listener) => listener());
    })
  }

  loadContent() {
    Ipfs.getContent(this.multiHashString).then((content) => {
      this.content = content;
      this.contentLoadListeners.forEach((listener) => listener());
    });
  }

  //Event listeners. Tells the posts' UI when to update.

  waitForFullCreation() {
    return new Promise((resolve) => {
      if (this.id) {
        resolve();
      } else {
        this.fullCreationLoadListeners.push(resolve);
      }
    });
  }

  waitForHeaderLoad() {
    return new Promise((resolve) => {
      if (this.multiHashString) {
        resolve();
      } else {
        this.headerLoadListeners.push(resolve);
      }
    });
  }

  waitForContentLoad() {
    return new Promise((resolve) => {
      if (this.content) {
        resolve();
      } else {
        this.contentLoadListeners.push(resolve);
      }
    });
  }
}
