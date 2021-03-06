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


import Group from '../models/Group'
import PathParser from '../utils/PathParser';
import CyberneticChat from '../blockchain/CyberneticChat';
import PostStore from './PostStore';

const ROOT_GROUP_NUMBER = 1;

export default class GroupStore {
  static initialize() {
    this.cache = [];
    this.treeRoot = this.getGroup(ROOT_GROUP_NUMBER);
  }

  /**
   * Takes a parsedPath from PathParser.parse(path_string)
   * Returns a Promise
   * If the path is a group (ends with a /) and the group can be fully resolved, resolves
   */

  static resolvePath(parsedPath, startingGroup = null) {
    return new Promise((resolve, reject) => {
      let currentGroup = this.treeRoot;
      console.log("GroupStore descending into the forest...");
      let pathToWalk = [ROOT_GROUP_NUMBER];
      pathToWalk = pathToWalk.concat(parsedPath.groupNums);
      console.log("GroupStore needs to walk the path:", pathToWalk);
      let pathWalked = [];
      this.walkTree(pathToWalk, pathWalked, currentGroup).then((result) => {
        console.log("Successfully walked tree:", result);
        console.log("path walked", pathWalked);
        if (!parsedPath.isGroup) {
          result.post = PostStore.getPost(parsedPath.postNum);
        }
        resolve(result);
      }).catch((error) => {
        console.error("Failed to walk tree:", error);
        if (error.partial) {
          console.log("need to rebuild partialPath from:");
          console.log("pathWalked:", pathWalked);
          console.log("Failed on:", error.num);
          console.log("pathToWalk:", pathToWalk);
          console.log("parsedPath:", parsedPath);
          let partial = parsedPath.separator;
          pathWalked.shift(); //drop the root group
          for (var i = 0; i < pathWalked.length; i++) {
            partial = partial + parsedPath.titleArray[i];
          }
          console.log("rebuild partial:", partial);
          error.partialPath = PathParser.parse(partial);
          console.log("partialPath:", error.partialPath);
        }
        reject(error);
      });
    });
  }

  static walkTree(pathToWalk, pathWalked, currentGroup) {
    return new Promise((resolve, reject) => {
      console.log("Walking the group tree; pathToWalk:", pathToWalk, "; pathWalked:", pathWalked);
      if (pathToWalk.length === 0) {
        console.log("singleton resolved:", currentGroup);
        resolve({group: currentGroup});
        return;
      }
      var nextStep = pathToWalk.shift();
      console.log("nextStep:", nextStep);
      CyberneticChat.postExists(nextStep).then((exists) => {
        if (exists) {
          pathWalked.push(nextStep);
          let nextGroup = this.getGroup(nextStep);
          this.walkTree(pathToWalk, pathWalked, nextGroup).then(resolve).catch(reject);
        } else {
          console.error("post", nextStep, "does not exist in group:", currentGroup);
          reject({
            group: currentGroup,
            num: nextStep,
            partial: true,
          });
        }
      }).catch((error) => {
        console.error("Failed to check if post", nextStep, " exists:", error);
        reject({
          group: currentGroup,
          num: nextStep,
          partial: true,
          error,
        });
      });
    });
  }

  static getGroup(num) {
    if (!this.cache[num]) {
      this.cache[num] = new Group(num);
    }
    return (this.cache[num]);
  }
}
