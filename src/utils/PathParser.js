
export default class PathParser {

  static PATH = /^(\/(.*\/)?)(.*)$/;
  static PARENT = /^(.*\/).+\/?$/;
  static POST = /^([0-9]+)(-(.*))?$/;
  static POST_TITLE_STRIPPER = /(([0-9]+)(-([^/]*))?(\/?))/g;

  static SEPARATOR = '/';

  static parse(path) {
    let absolute = true;
    if (path === undefined || path === '' || typeof(path) !== 'string') {
      path = this.SEPARATOR;
    } else if (!path.startsWith(this.SEPARATOR)) {
      absolute = false;
    }
    //console.log("PathParser parsing:", path);

    let groupMatch = this.PATH.exec(path);
    let groupPath = groupMatch[1];
    let post = groupMatch[3];

    let parentMatch = this.PARENT.exec(path);
    let par;
    if (parentMatch) {
      par = parentMatch[1];
    }

    let postNum;
    let postTitle;
    if (post) {
      let postMatch = this.POST.exec(post);
      postNum = postMatch[1];
      postTitle = postMatch[3];
    }
    let isGroup = !postNum;

    var pathCopy = path.slice(0);
    if (absolute) {
      pathCopy.slice(1);
    }
    var postSplitMatch;
    var pathNums = [];
    var groupNums = [];

    let pathArray = [];
    let groupArray = [];

    let titleArray = [];

    do {
      postSplitMatch = this.POST_TITLE_STRIPPER.exec(pathCopy);
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
        isGroup: postSplitMatch[5] === this.SEPARATOR,
      };
      pathArray.push(x);
      groupArray.push(x);
    } while (postSplitMatch);

    if (!isGroup) {
      groupNums.pop();
      groupArray.pop();
    }

    let cleanPath = (absolute ? this.SEPARATOR : '') + pathNums.join(this.SEPARATOR) + (isGroup && pathNums.length > 0 ? this.SEPARATOR : '');
    let cleanGroupPath = (absolute ? this.SEPARATOR : '') + groupNums.join(this.SEPARATOR) + (groupNums.length > 0 ? this.SEPARATOR : '');

    var pathState = {
      separator: this.SEPARATOR,
      path,
      cleanPath,
      'parent': par,
      groupPath,
      cleanGroupPath,
      absolute,
      isGroup,
      groupArray,
      groupNums,
      pathArray,
      pathNums,
      titleArray,
      post,
      postNum,
      postTitle,
      equals: (otherPathState) => {
        if (!otherPathState) {
          return (false);
        }
        if (typeof(otherPathState) !== 'object') {
          return (false);
        }
        if (pathState === otherPathState) {
          return (true);
        }
        if (path === otherPathState.path) {
          return (true);
        }
        if (cleanPath === otherPathState.cleanPath) {
          return (true);
        }
        if (absolute === otherPathState.absolute && isGroup === otherPathState.isGroup && postNum === otherPathState.postNum && pathArray.length === otherPathState.pathArray.length) {
          let same = true;
          for (var i = 0; i < pathArray.length; i++) {
            if (pathArray[i].num !== otherPathState.pathArray[i].num || pathArray[i].isGroup !== otherPathState.pathArray[i].isGroup) {
              same = false;
              break;
            }
          }
          return (same);
        }
        return (false);
      },
      sameGroup: (otherPathState) => {
        if (!otherPathState) {
          return (false);
        }
        if (typeof(otherPathState) !== 'object') {
          return (false);
        }
        if (pathState === otherPathState) {
          return (true);
        }
        return (cleanGroupPath === otherPathState.cleanGroupPath);
      },
    };

    //console.log("pathParser pathState:", pathState);
    return (pathState);
  }
}
