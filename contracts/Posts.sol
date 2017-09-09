pragma solidity ^0.4.11;

contract Posts {
    struct Post {
        bytes32 title;
        string content;
        bool active;
        address creator;
    }

    mapping (bytes32 => Post) posts;
    bytes32[] postTitles;
    mapping (bytes32 => uint256) titlesMap;

    event NewPost(address indexed sender, bytes32 indexed title);

    function postExists(bytes32 title) public returns (bool) {
        return (posts[title].active);
    }

    function createPost(bytes32 title, string content) public {
        require(!postExists(title)); //if we're trying to create a post which is already active, throw an error

        posts[title] = Post({
            title: title,
            content: content,
            active: true,
            creator: msg.sender
        });

        titlesMap[title] = postTitles.push(title) - 1; //capture the index for easy deleting

        NewPost(msg.sender, title);
    }

   
    function getPost(bytes32 title) public returns (string content, address creator) {
        require(postExists(title)); //if post does not exist, error

        Post memory p = posts[title];
        return (p.content, p.creator);
    }

    function getPostTitles() public returns (bytes32[]) {
        return (postTitles);
    }

    function deletePost(bytes32 title) public {
        require(postExists(title)); 

        delete posts[title];

        delete postTitles[titlesMap[title]];

        delete titlesMap[title];
    }
}
