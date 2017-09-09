export default class PostStore {
  static postsContractInstance = null;
  static web3 = null;

  static initialize(web3, postsContractInstance) {
    this.web3 = web3;
    this.postsContractInstance = postsContractInstance;
  }

  static createPost(title, content) {
    return new Promise((resolve) => {
      this.postsContractInstance.createPost(title, content).then((result) => {
        const watchEvent = this.postsContractInstance.NewPost({}, {fromBlock: '0', toBlock: 'latest'})
        watchEvent.watch(function(error, response) {
          console.log("newpost error =", error);
          console.log("newpost response =", response);
          if (!error) {
            if (response.transactionHash === result.tx) {
              const newTitle = response.args.title;
              console.log(response.args.sender, "has created a new post, title:", newTitle);

              return this.postsContractInstance.getPost(newTitle).call().then((content, creator) => { //get the post content and creator
                console.log("got a post :", { "title": title, "content": content, "creator": creator });

                watchEvent.stopWatching(); //all done with this handler

                resolve({
                  title,
                  content,
                  creator
                });
              });
            }
          } else {
            //TODO: getting the event triggered an error? not sure what actually might cause this
          }
        });
      });
    });
  }

  static getPosts() {
    return new Promise((resolve) => {
      this.postsContractInstance.getPostTitles.call().then((postTitles) => {
        console.log("post titles:", postTitles);

        let posts = [];
        postTitles.each((title, index) => { //for each post title
          this.postsContractInstance.getPost(title).call().then((content, creator) => { //get the post content and creator
            console.log("got a post :", { "title": title, "content": content, "creator": creator });
            posts.push({
              title,
              content,
              creator
            });
            if (index === postTitles.length - 1) {
              resolve(posts);
            }
          });
        });
      });
    });
  }
}
