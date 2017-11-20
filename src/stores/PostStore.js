import Post from '../models/Post';

export default class PostStore {

  static initialize() {
    this.cache = [];
  }

  static getPost(id, txid) {
    if (id) {
      if (typeof(id) !== 'string') {
        id = id.toString();
      }
      if (txid) {
        //id and txid
        if (!this.cache[id]) {
          if (this.cache[txid]) {
            this.cache[id] = this.cache[txid];
            delete (this.cache[txid]);
          } else {
            this.cache[id] = new Post({ id, transactionId: txid });
            this.cache[id].load();
            this.cache[id].waitForConfirmation().catch((error) => {
              delete (this.cache[id]);
            });
          }
        }
        return (this.cache[id]);
      } else {
        //id only
        if (!this.cache[id]) {
          this.cache[id] = new Post({ id });
          this.cache[id].load().catch((error) => {
            delete (this.cache[id]);
          });
        }
        return (this.cache[id]);
      }
    } else {
      if (txid) {
        //txid only
        if (!this.cache[txid]) {
          this.cache[txid] = new Post({ transactionId: txid });
          this.cache[txid].load().catch((error) => {
            delete (this.cache[txid]);
          });
        }
        return (this.cache[txid]);
      } else {
        //nothing
        throw (new Error("PostStore: no id and no txid given to getPost!"));
      }
    }
  }
}
