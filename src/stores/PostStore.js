import GasEstimator from '../utils/GasEstimator';
import moment from 'moment';
import Ipfs from '../utils/Ipfs';

export default class PostStore {
  static postsContractInstance = null;
  static web3 = null;
  static newPostListeners = {};
  static cache = {};

  static initialize(web3, postsContractInstance) {
    this.web3 = web3;
    this.postsContractInstance = postsContractInstance;
  }

  static createPost(title, content, contentType) {
    return new Promise((resolve, reject) => {
      this.postsContractInstance.postExists.call(title).then((exists) => {
        if (exists) {
          reject('A post already exists with that title.');
        } else {
          Ipfs.addFile(content).then((hash) => {
            console.log("ipfs hash: ", hash);
            let ipfsHash = '';
            let ipfsHashFunction = 0;
            let ipfsHashLength = 0;
            if (content) {
              [ipfsHashFunction, ipfsHashLength, ipfsHash] = Ipfs.extractMultiHash(hash);
            }
            console.log("ipfsHash =", ipfsHash, "\nipfsHashFunction =", ipfsHashFunction, "\nipfsHashLength =", ipfsHashLength, "\nactual ipfsHash length =", ipfsHash.length);
            /*
            let ipfsHash = content ? this.web3.fromUtf8(content) : ""; //TODO: store content in ipfs, base58 decode hash, split into fields
            let ipfsHashFunction = 18; //0x12 -- TODO: get from ipfs hash
            let ipfsHashLength = content.length; //TODO: get from ipfs hash
            */
            let mimeType = contentType;
            console.log("ipfsHash =", ipfsHash);
            GasEstimator.estimate('createPost', title, mimeType, ipfsHashFunction, ipfsHashLength, ipfsHash, moment().unix()).then((gas) => {
              let actualGas = gas * 3;
              console.log("gas estimator estimates that this createPost call will cost", gas, "gas, actualGas =", actualGas);
              const watchEvent = this.postsContractInstance.NewPost({}, {fromBlock: this.web3.eth.blockNumber, toBlock: 'latest'});
              this.postsContractInstance.createPost(title, mimeType, ipfsHashFunction, ipfsHashLength, ipfsHash, moment().unix(), { gas: actualGas }).then((result) => {
                console.log("post titled \"" + title + "\" created with txid:", result.tx);
                watchEvent.watch((error, response) => {
                  if (!error) {
                    if (response.transactionHash === result.tx) {
                      watchEvent.stopWatching();
                      this.getPostByNumber(response.args.number).then(resolve);
                    }
                  } else {
                    console.error(error);
                  }
                });
              }).catch((error) => {
                console.error("error while creating post:", error);
              });
            }).catch((error) => {
              console.error("error while estimating gas:", error);
              reject("Failed while estimating gas");
            });

          }).catch((error) => {
            console.log("Error while posting content to ipfs:", error);
          });
        };
      }).catch((error) => {
          console.error("error while checking post exists:", error);
      });
    });
  }

  static getPostByNumber(number) {
    return new Promise((resolve, reject) => {
      if (this.cache[number]) {
        resolve(this.cache[number]);
      } else {
        this.postsContractInstance.getPostByNumber.call(number).then((
            [
              title,
              number,
              contentType,
              ipfsHashFunction,
              ipfsHashLength,
              ipfsHash,
              creator,
              creationTime,
              groupAddress,
              balance,
              permissions
            ]
        ) => {
          let multiHash = Ipfs.assembleMultiHash(ipfsHashFunction, ipfsHashLength, ipfsHash);
          Ipfs.catFile(ipfsHashLength > 0 ? multiHash : '').then((content) => {
            const post = {
              title,
              number,
              contentType,
              content,
              multiHash,
              creator,
              creationTime,
              groupAddress,
              balance,
              permissions,
              mature: true,
            };
            this.cache[number] = post;
            resolve(post);
          });
        }).catch((error) => {
          reject();
        });
      }
    });
  }

  static getPosts() {
    return new Promise((resolve) => {
      this.postsContractInstance.getPostNumbers.call().then((postNumbers) => {

        //postTitles = postTitles.map((title) => this.web3.toUtf8(title));

        let posts = [];
        if (postNumbers.length > 0) {
          let postCount = 0;
          console.log("need to fetch", postNumbers.length, "existing posts:", postNumbers);
          postNumbers.forEach((number, index) => {
            posts[index] = {
              number: number,
              mature: false,
              unconfirmed: false,
              getPost: this.getPostByNumber(number),
            };
            /*
            this.getPostByNumber(number).then((post) => {
              console.log("resolved post #" + number, ":", post);
              Object.assign(posts[index], post);
              posts[index].immature = false;
              console.log("posts[" + index + "] =", posts[index]);
              /*
              postCount++;
              console.log("post[" + postCount + "]:", posts[index]);
              if (postCount === postNumbers.length) {
                resolve(posts);
              }
              * /
                /*
              posts.push(post); //the getpost() promises are async, which causes a race condition sometimes resulting in the posts being resolved out of order and then pushed onto the array
              if (index === postTitles.length - 1) {
                resolve(posts);
              }
                * /
            }).catch((err) => {
                console.error(err);
                posts[index] = null;
                postCount++;
            });
            */
          });
          resolve(posts);
        } else {
          resolve(posts);
        }
      }).catch(console.error);
    });
  }

  static addNewPostListener(object, callback) {
    const watchEvent = this.postsContractInstance.NewPost({}, {fromBlock: this.web3.eth.blockNumber, toBlock: 'latest'});
    this.newPostListeners[object] = watchEvent;
    watchEvent.watch((error, response) => {
      console.log('fired');
      if (!error) {
        console.log("watcher received event:", response);
        this.getPostByNumber(response.args.number).then(callback);
      }
    });
  }

  static removeNewPostListener(object) {
    this.newPostListeners[object] && this.newPostListeners[object].stopWatching();
    delete this.newPostListeners[object];
  }
}
