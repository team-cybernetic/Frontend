import GasEstimator from '../utils/GasEstimator';

export default class PostStore {
  static postsContractInstance = null;
  static web3 = null;
  static newPostListeners = {};
  static cache = {};

  static initialize(web3, postsContractInstance) {
    this.web3 = web3;
    this.postsContractInstance = postsContractInstance;
  }

  static createPost(title, content) {
    return new Promise((resolve, reject) => {
      this.getPost(title).then((post) => {
        reject('A post already exists with that title.');
      }).catch(() => {
        GasEstimator.estimate('createPost', [title, content]).then((gas) => {
          const watchEvent = this.postsContractInstance.NewPost({}, {fromBlock: this.web3.eth.blockNumber, toBlock: 'latest'});
          this.postsContractInstance.createPost(title, content, { gas }).then((result) => {
            watchEvent.watch((error, response) => {
              if (!error) {
                if (response.transactionHash === result.tx) {
                  const newTitle = this.web3.toUtf8(response.args.title);
                  watchEvent.stopWatching();
                  this.getPost(newTitle).then(resolve);
                }
              } else {
                console.error(error);
              }
            });
          }).catch(console.error);
        });
      });
    });
  }

  static getPost(title) {
    return new Promise((resolve, reject) => {
      if (this.cache[title]) {
        resolve(this.cache[title]);
      } else {
        this.postsContractInstance.getPost.call(title).then(([content, creator]) => { //get the post content and creator
          const post = {
            title,
            content,
            creator,
          };
          this.cache[title] = post;
          resolve(post);
        }).catch((error) => {
          reject();
        });
      }
    });
  }

  static getPosts() {
    return new Promise((resolve) => {
      this.postsContractInstance.getPostTitles.call().then((postTitles) => {
        postTitles = postTitles.map((title) => this.web3.toUtf8(title));

        let posts = [];
        if (postTitles.length > 0) {
          postTitles.forEach((title, index) => { //for each post title
            this.getPost(title).then((post) => {
              posts.push(post);
              if (index === postTitles.length - 1) {
                resolve(posts);
              }
            });
          });
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
      if (!error) {
        const newTitle = this.web3.toUtf8(response.args.title);
        this.getPost(newTitle).then(callback);
      }
    });
  }

  static removeNewPostListener(object) {
    this.newPostListeners[object] && this.newPostListeners[object].stopWatching();
    delete this.newPostListeners[object];
  }
}
