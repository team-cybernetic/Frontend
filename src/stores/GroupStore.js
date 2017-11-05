import Group from '../models/Group'
import PathParser from '../utils/PathParser';
import Blockchain from '../blockchain/Blockchain';

export default class GroupStore {
  static rootInstance = null;
  static web3 = null;

  static initialize(web3, rootInstance) {
    this.web3 = web3;
    this.rootInstance = rootInstance;
    this.treeRoot = new Group(1, 1);
    this.cache = [];
  }

  /**
   * Takes a parsedPath from PathParser.parse(path_string)
   * Returns a Promise
   * If the path is a group (ends with a /) and the group can be fully resolved, resolves 
   */

  static resolvePath(parsedPath, startingGroup = null) {
    return new Promise((resolve, reject) => {
      let currentGroup = this.treeRoot;
      let pathToWalk = [];
      if (!parsedPath.absolute) {
        if (!startingGroup) { //passing undefined is also bad, and 0/false doesn't make sense
          reject({
            error: new Error("Cannot browse to a relative path without a starting group!"), 
            group: null,
            partialPath: null,
          }); 
          return;
        } else {
          currentGroup = startingGroup;
        }
      } else {
        console.log("GroupStore walking an absolute path");
        pathToWalk.push(1);
      }
      console.log("GroupStore descending into the forest...");
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
          let partial = "";
          if (parsedPath.absolute) {
            partial = parsedPath.separator;
            pathWalked.shift(); //drop the root group
          }
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
          currentGroup.getNumber().then((parentNum) => {
            pathWalked.push(nextStep);
            let nextGroup = this.getGroup(parentNum, nextStep);
            this.walkTree(pathToWalk, pathWalked, nextGroup).then(resolve).catch(reject);
          }).catch((error) => {
            console.error("Error while getting number of group", nextStep, ":", error);
            reject({
              group: currentGroup,
              num: nextStep,
              partial: true,
              error,
            });
          });
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
      /*
      currentGroup.getGroupAddressOfPost(nextStep).then((addr) => {
        console.log("got address for", nextStep, ":", addr);
        if (Blockchain.isAddressValid(addr)) {
          console.log("it's a valid address!");
          this.getGroup(addr).then((nextGroup) => {
            pathWalked.push(nextStep);
            if (pathToWalk.length > 0) {
              this.walkTree(pathToWalk, pathWalked, nextGroup).then(resolve).catch(reject);
            } else {
              console.log("singleton resolved:", nextGroup);
              resolve({
                group: nextGroup,
              });
            }
          }).catch((error) => {
            reject(error);
          });
        } else {
          console.error("post", nextStep, "has no group address!");
          resolve({
            group: currentGroup,
            num: nextStep,
          });
        }
      }).catch((error) => {
        console.error("Failed to get group for post", nextStep, ":", error);
        reject({
          group: currentGroup,
          num: nextStep,
          partial: true,
          error,
        });
      });
      */
    });
  }

  static getGroup(parentNum, num) {
    if (!this.cache[num]) {
      this.cache[num] = new Group(parentNum, num);
    }
    return (this.cache[num]);
    /*
    return new Promise((resolve, reject) => {
      if (!this.cache[addr]) {
        console.log("group not cached");
        this.groupContractTC.at(addr).then((contractInstance) => {
          this.cache[addr] = new Group(this.web3, contractInstance, this.groupContractTC);
          resolve(this.cache[addr]);
        }).catch((error) => {
          console.error("error while getting contractInstance at address", addr, ":", error);
          reject(error);
        });
      } else {
        console.log("group cached!");
        resolve(this.cache[addr]);
      }
    });
    */
  }
}
