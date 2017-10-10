import Group from '../models/Group'

export default class GroupStore {

  /**
   * This class maintains the system's view of the group tree.
   * It must contain a reference to the root group, and the group TruffleContract 
   * It will be able to perform arbitrary lookups for subnodes in the tree
   * A subnode can be either a group or a post.
   * Lookups are performed on strings (a path), which define the path to the subnode.
   * A path that starts with a / is an absolute path, which navigates from the root node down
   * A path that ends with a / specifies that if the lookup is successful, it should return a group.
   * If the path does not end with a /, it means that the lookup should return a post.
   * The GroupStore must caches all intermediate nodes for future lookups.
   * The GroupStore must watch for NewGroup events on all of the cached nodes to react to dynamic changes in tree structure
   * The GroupStore must provide an event listener for changes on cached nodes, so components which use the content of such nodes can react to changes in tree structure
   **/

  static contractTC = null;
  //  static contractRootInstance = null;
  static treeRoot = null;
  static web3 = null;

  static initialize(web3, contractRootInstance, contractTC) {
    this.web3 = web3;
    this.groupContractTC = contractTC;
    this.treeRoot = new Group(this.web3, contractRootInstance, contractTC);
    this.cache = [];
  }

  /**
   * Takes a parsedPath from PathParser.parse(path_string)
   * Returns a Promise
   * If the path is a group (ends with a /) and the group can be fully resolved, resolves 
   */

  static resolvePath(parsedPath, startingGroup = null) {
    return new Promise((resolve, reject) => {
      //need to do resolve({group, post, parsedPath}) or reject({error, group, partialPath})
      /*
       * steps needed to navigate to given path:
       *  validate path
       *  starting at the root group:
       *    get each subgroup
       *    if success
       *      continue
       *    if error
       *      reject
       */

      
      var currentGroup = this.treeRoot;
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
      }
      console.log("GroupStore descending into the forest...");
      let groupNums = parsedPath.groupNums.slice(0); //clone the array
      console.log("GroupStore needs to walk the path:", groupNums);
      let pathWalked = [];
      this.walkTree(groupNums, pathWalked, currentGroup).then((result) => {
        console.log("Successfully walked tree:", result);
        console.log("path walked", pathWalked);
        if (!parsedPath.isGroup) {
          result.post = result.group.getPost(parsedPath.postNum);
        }
        resolve(result);
      }).catch((error) => {
        console.log("Failed to walk tree:", error);
        reject(error);
      });
    });
  }

  static isAddressNull(addr) {
    return (!addr || addr === '0x' || addr === '0x0000000000000000000000000000000000000000' || addr === '0000000000000000000000000000000000000000');
  }

  static isAddressValid(addr) {
    return (this.web3.isAddress(addr) && !this.isAddressNull(addr));
  }

  static walkTree(pathToWalk, pathWalked, currentGroup) {
    return new Promise((resolve, reject) => {
      console.log("Walking the group tree; pathToWalk:", pathToWalk, "; pathWalked:", pathWalked);
      if (pathToWalk.length === 0) {
        resolve({group: currentGroup});
        return;
      }
      var nextStep = pathToWalk.shift();
      console.log("nextStep:", nextStep);
      currentGroup.getGroupAddressOfPost(nextStep).then((addr) => {
        console.log("got address for", nextStep, ":", addr);
        if (this.isAddressValid(addr)) {
          console.log("it's a valid address!");
          GroupStore.getGroup(addr).then((nextGroup) => {
            pathWalked.push(nextStep);
            if (pathToWalk.length > 0) {
              this.walkTree(pathToWalk, pathWalked, nextGroup).then(resolve).catch(reject);
            } else {
              console.log("singleton resolved:", nextGroup);
              resolve({group: nextGroup});
            }
          }).catch((error) => {
            reject(error);
          });
        } else {
          console.log("post", nextStep, "has no group address!");
          resolve({group: currentGroup, num: nextStep});
        }
      }).catch((error) => {
        console.log("Failed to get group for post", nextStep, ":", error);
        reject(error);
      });
    }).catch((error) => {
      console.log("top level error:", error);
    });
  }

  static getGroup(addr) {
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
  }
}
