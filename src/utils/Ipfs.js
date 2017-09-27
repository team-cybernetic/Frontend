import 'ipfs';
import uuidv4 from 'uuid/v4';
import bs58 from 'bs58';
import _ from 'lodash';

export default class Ipfs {
  static ipfs;

  static initialize() {
    return new Promise((resolve) => {
      this.ipfs = new window.IPFS({
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
          //debugger;
          resolve(res[0].hash);
        }
      });
    });
  }

  static catFile(multiHash) {
    return new Promise((resolve, reject) => {
      if (!multiHash || multiHash.length < 3) {
        resolve('');
        return;
      }
      this.ipfs.files.cat(multiHash, (err, stream) => {
        if (err) {
          console.log("Error while catting file: ", err);
          reject(err);
        }
        let res = '';
        stream.on('data', (chunk) => {
          res = res + chunk;
        });
        stream.on('end', () => {
          resolve(res);
        });
      });
    });
  }

  static extractMultiHash(multiHash) {
    let ipfsRawHex = bs58.decode(multiHash).toString('hex'); //returns a Buffer
    let ipfsHashFunction = ipfsRawHex.slice(0, 2); //first byte is the function
    let ipfsHashLength = ipfsRawHex.slice(2, 4); //second byte is the length
    let ipfsHash = '0x' + ipfsRawHex.slice(4); //all the rest of the bytes are the actual hash
    return [ipfsHashFunction, ipfsHashLength, ipfsHash];
  }

  static assembleMultiHash(ipfsHashFunction, ipfsHashLength, ipfsHash) {
    if (ipfsHash.length === 0 || ipfsHash === '0x') {
      return ('');
    }
    let multiHex = ipfsHashFunction.toString(16) + ipfsHashLength.toString(16) + ipfsHash.slice(2);
    return (bs58.encode(Buffer.from(multiHex, 'hex')));
  }
}
