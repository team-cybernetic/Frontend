import IPFS from 'ipfs';
import uuidv4 from 'uuid/v4';

export default class Ipfs {
  static ipfs;

  static initialize() {
    return new Promise((resolve) => {
      this.ipfs = new IPFS({
        repo: this.repoPath(),
      });
      this.ipfs.on('ready', resolve);
    });
  }

  static repoPath() {
    const storedPath = localStorage.getItem('IPFS_REPO_PATH');
    if (storedPath) {
      return storedPath;
    } else {
      const newPath = uuidv4();
      localStorage.setItem('IPFS_REPO_PATH', newPath);
      return newPath;
    }
  }

  static addFile(content) {
    return new Promise((resolve, reject) => {
      this.ipfs.files.add([new this.ipfs.types.Buffer(content)], {}, (error, res) => {
        if (error) {
          reject(error);
        } else {
          debugger;
          resolve(res.hash);
        }
      });
    });
  }
}
