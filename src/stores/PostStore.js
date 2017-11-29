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
