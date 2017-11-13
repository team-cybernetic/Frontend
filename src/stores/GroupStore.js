import Group from '../models/Group'
import PathParser from '../utils/PathParser';
import Blockchain from '../blockchain/Blockchain';

const ROOT_GROUP_NUMBER = 1;

export default class GroupStore {
  static rootInstance = null;
  static web3 = null;

  static initialize(web3, rootInstance) {
    this.web3 = web3;
    this.rootInstance = rootInstance;
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
          result.post = result.group.getPost(parsedPath.postNum);
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
      currentGroup.postExists(nextStep).then((exists) => {
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
    console.log("getting group:", num);
    console.log("getting groupstr:", num.toString());
    if (!this.cache[num]) {
      this.cache[num] = new Group(num);
    }
    return (this.cache[num]);
  }
}
