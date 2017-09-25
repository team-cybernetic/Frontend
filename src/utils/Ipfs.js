import IPFS from 'ipfs';
import uuidv4 from 'uuid/v4';
import bs58 from 'bs58';
import _ from 'lodash';

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
          //debugger;
          resolve(res[0].hash);
        }
      });
    });
  }

  static catFile(multiHash) {
    return new Promise((resolve, reject) => {
      console.log(multiHash);
      if (!multiHash) {
        resolve('');
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
    let ipfsRaw = bs58.decode(multiHash); //returns a Buffer
    let ipfsRawHex = '';
    ipfsRaw.forEach((value, idx) => {
      console.log(value, "=", value.toString(16));
      let strVal = value.toString(16); //but we need it in hex
      ipfsRawHex = ipfsRawHex + _.padStart(strVal, 2, '0'); //make sure they're always 2 character hex, 9 -> 09
    });
    let ipfsHashFunction = ipfsRaw.slice(0, 1); //first byte is the function
    let ipfsHashLength = ipfsRaw.slice(1, 2); //second byte is the length
    let ipfsHash = '0x' + ipfsRawHex.slice(4); //all the rest of the bytes are the actual hash
    return [ipfsHashFunction, ipfsHashLength, ipfsHash];
  }

  static assembleMultiHash(ipfsHashFunction, ipfsHashLength, ipfsHash) {
    let multiHex = ipfsHashFunction.toString(16) + ipfsHashLength.toString(16) + ipfsHash.slice(2);
    return (bs58.encode(Buffer.from(multiHex, 'hex')));
  }
}
