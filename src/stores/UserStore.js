import Blockchain from '../blockchain/Blockchain';
import User from '../models/User';

export default class UserStore {

  static initialize() {
    this.cache = [];
  }

  static getUser(address) {
    if (!this.cache[address]) {
      this.cache[address] = new User(address);
      this.cache[address].loadProfile();
    }
    return (this.cache[address]);
  }
}
