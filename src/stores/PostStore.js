export default class PostStore {
    var postsContractInstance

    static createPost(title, content) {
        //TODO: where does postsContract come from?
        postsContract.deployed().then((instance) => {
            postsContractInstance = instance

            return (postsContractInstance.createPost(title, content))
        }).then((result) => {
            var watchEvent = postsContractInstance.NewPost({}, {fromBlock: '0', toBlock: 'latest'})
            watchEvent.watch(function(error, response) {
                console.log("newpost error =", error);
                console.log("newpost response =", response);
                if (!error) {
                    if (response.transactionHash == result.tx) {
                        var newTitle = response.args.title;
                        console.log(response.args.sender, "has created a new post, title:", newTitle);

                        return postsContractInstance.getPost(newTitle).call().then((content, creator) => { //get the post content and creator
                            console.log("got a post :", { "title": title, "content": content, "creator": creator });

                            watchEvent.stopWatching(); //all done with this handler

                            return (
                                //TODO
                                <h1>post created successfully</h1><br />
                                <h2>title: {title}</h2><br />
                                <h3>content: {content}</h3><br />
                                <h4>creator: {creator}</h4>
                            ) //returns to getPost promise
                        }) //returns to ?? probably need to fufill some promise here instead of returning out of the watch() (i'm not sure if you can return values from watch)
                    }
                } else {
                    //TODO: getting the event triggered an error? not sure what actually might cause this
                }
            })
        })
    }
}
