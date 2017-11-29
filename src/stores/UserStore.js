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
