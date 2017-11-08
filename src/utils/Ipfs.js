import uuidv4 from 'uuid/v4';
import bs58 from 'bs58';

export default class Ipfs {
  static ipfs;

  static initialize() {
    return new Promise((resolve) => {
      this.ipfs = new window.Ipfs({
        repo: this.repoPath(),
        init: true,
        start: true,
        config: {
          Bootstrap: [
            "/dns4/ams-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd",
            "/dns4/sfo-3.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM",
            "/dns4/sgp-1.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu",
            "/dns4/nyc-2.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64",
            "/dns4/wss0.bootstrap.libp2p.io/tcp/443/wss/ipfs/QmZMxNdpMkewiVZLMRxaNxUeZpDUb34pWjZ1kZvsd16Zic",
            "/dns4/wss1.bootstrap.libp2p.io/tcp/443/wss/ipfs/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6"
          ]
        }
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

  static saveContent(content) {
    return new Promise((resolve, reject) => {
      if (content === '' || content === undefined || content === null) {
        resolve('');
      } else {
        this.ipfs.files.add([new this.ipfs.types.Buffer(content)], {}, (error, res) => {
          if (error) {
            reject(error);
          } else {
            resolve(res[0].hash);
          }
        });
      }
    });
  }

  static getContent(multiHash) {
    return new Promise((resolve, reject) => {
      if (!multiHash || multiHash.length < 3) {
        resolve('');
        return;
      }
      this.ipfs.files.cat(multiHash, (err, stream) => {
        if (err) {
          console.log("Error while getting content.", err);
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
    if (multiHash === '') {
        return [0, 0, '0x'];
    }
    let ipfsRaw = bs58.decode(multiHash); //returns a Buffer
    let ipfsHashFunction = ipfsRaw[0];
    let ipfsHashLength = ipfsRaw[1];
    let ipfsHash = '0x' + ipfsRaw.slice(2).toString('hex');
    return [ipfsHashFunction, ipfsHashLength, ipfsHash];
  }

  static assembleMultiHash([ipfsHashFunction, ipfsHashLength, ipfsHash]) {
    if (!ipfsHash || ipfsHash.length === 0 || ipfsHash === '0x') {
      return ('');
    }
    let multiHex = ipfsHashFunction.toString(16) + ipfsHashLength.toString(16) + ipfsHash.slice(2);
    return (bs58.encode(Buffer.from(multiHex, 'hex')));
  }
}
