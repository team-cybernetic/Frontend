const PATH = /^(\/(.*\/)?)(.*)$/;
const PARENT = /^(.*\/).+\/?$/;
const POST = /^([0-9]+)(-(.*))?$/;
const POST_TITLE_STRIPPER = /(([0-9]+)(-([^/]*))?(\/?))/g;
const USER = /^\/user\/(.*)$/;
const SEPARATOR = '/';
const Type = {
  POST: 1,
  USER: 2,
};

export default class PathParser {
  static parse(path) {
    if (path === undefined || path === '' || typeof(path) !== 'string') {
      path = SEPARATOR;
    }

    let type;

    let userMatch = USER.exec(path);
    if (userMatch) {
      type = Type.USER;
      const userAddress = userMatch[1];
      return new Path({
        path,
        userAddress,
        type,
        cleanPath: path,
      });
    } else {
      type = Type.POST;
      let groupMatch = PATH.exec(path);
      console.log(groupMatch);
      let groupPath = groupMatch[1];
      let post = groupMatch[3];

      let parentMatch = PARENT.exec(path);
      let par;
      if (parentMatch) {
        par = parentMatch[1];
      }

      let postNum;
      let postTitle;
      if (post) {
        let postMatch = POST.exec(post);
        postNum = postMatch[1];
        postTitle = postMatch[3];
      }
      let isGroup = !postNum;

      var pathCopy = path.slice(0);
      pathCopy.slice(1);
      var postSplitMatch;
      var pathNums = [];
      var groupNums = [];

      let pathArray = [];
      let groupArray = [];

      let titleArray = [];

      do {
        postSplitMatch = POST_TITLE_STRIPPER.exec(pathCopy);
        if (!postSplitMatch) {
          break;
        }
        let wholeTitle = postSplitMatch[1];
        titleArray.push(wholeTitle);

        let num = postSplitMatch[2];
        pathNums.push(num);
        groupNums.push(num);

        let x = {
          num,
          title: postSplitMatch[4],
          isGroup: postSplitMatch[5] === SEPARATOR,
        };
        pathArray.push(x);
        groupArray.push(x);
      } while (postSplitMatch);

      if (!isGroup) {
        groupNums.pop();
        groupArray.pop();
      }

      let cleanPath = SEPARATOR + pathNums.join(SEPARATOR) + (isGroup && pathNums.length > 0 ? SEPARATOR : '');
      let cleanGroupPath = SEPARATOR + groupNums.join(SEPARATOR) + (groupNums.length > 0 ? SEPARATOR : '');
      console.log("titleArray:", titleArray);
      let titleOnlyPath = SEPARATOR + titleArray.map((title) => title.replace(/\d+-/, '')).join('');

      return new Path({
        path,
        cleanPath,
        'parent': par,
        groupPath,
        cleanGroupPath,
        isGroup,
        groupArray,
        groupNums,
        pathArray,
        pathNums,
        titleArray,
        post,
        postNum,
        postTitle,
        type,
        titleOnlyPath,
      });
    }
  }
}

class Path {
  constructor(attrs) {
    this.separator = SEPARATOR;
    for (let attr in attrs) {
      this[attr] = attrs[attr];
    }
  }

  equals(otherPathState) {
    if (!otherPathState || typeof(otherPathState) !== 'object') {
      return false;
    }
    if (this === otherPathState || this.path === otherPathState.path || this.cleanPath === otherPathState.cleanPath) {
      return true;
    }
    if (this.type === Type.USER && otherPathState.type === Type.USER && this.userAddress === otherPathState.userAddress) {
      return true;
    }
    if (this.isGroup === otherPathState.isGroup && this.postNum === otherPathState.postNum && this.pathArray.length === otherPathState.pathArray.length) {
      let same = true;
      for (var i = 0; i < this.pathArray.length; i++) {
        if (this.pathArray[i].num !== otherPathState.pathArray[i].num || this.pathArray[i].isGroup !== otherPathState.pathArray[i].isGroup) {
          same = false;
          break;
        }
      }
      return same;
    }
    return false;
  }

  sameGroup(otherPathState) {
    if (!otherPathState || typeof(otherPathState) !== 'object' || this.type === Type.POST) {
      return false;
    }
    if (this === otherPathState) {
      return true;
    }
    return this.cleanGroupPath === otherPathState.cleanGroupPath;
  }
}

export { Type };
