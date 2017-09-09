import GasEstimator from '../utils/GasEstimator';

export default class PostStore {
  static postsContractInstance = null;
  static web3 = null;

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
          this.postsContractInstance.createPost(title, content, { gas }).then((result) => {
            const watchEvent = this.postsContractInstance.NewPost({}, {fromBlock: '0', toBlock: 'latest'})
            watchEvent.watch((error, response) => {
              if (!error) {
                if (response.transactionHash === result.tx) {
                  console.log("newpost response =", response);
                  const newTitle = response.args.title;
                  console.log(response.args.sender, "has created a new post, title:", newTitle);
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
      this.postsContractInstance.getPost.call(title).then((content, creator) => { //get the post content and creator
        resolve({
          title,
          content,
          creator
        });
      }).catch(() => {
        reject();
      });
    });
  }

  static getPosts() {
    return new Promise((resolve) => {
      this.postsContractInstance.getPostTitles.call().then((postTitles) => {
        console.log("post titles:", postTitles);

        let posts = [];
        postTitles.forEach((title, index) => { //for each post title
          this.getPost(title).then((post) => {
            posts.push(post);
            if (index === postTitles.length - 1) {
              resolve(posts);
            }
          });
        });
      });
    });
  }
}
