pragma solidity ^0.4.11;

contract Posts {
  /*
     IPFS stores its hashes as a multihash -- the first two bytes represent
     the hash function used (default SHA256) and the length of the hash,
     which is typically 0x12 = SHA256 and 0x20 = 32 bytes (256 bits)
     The hash is typically base58 encoded (like how bitcoin addresses are encoded),
     but the hash part actually is only 32 bytes long when un-base58 encoded
   */
  struct IpfsMultihash {
    uint8 hashFunction; //first byte of multihash
    uint8 hashLength; //second byte of multihash
    bytes hash; //hashLength remaining bytes of multihash
  }

  uint256 postCount = 0;

  struct Contents {
    string title;
    string contentType;
    IpfsMultihash contentAddress;
    address creator;
    uint256 creationTime;
  }

  Contents contents;

  struct Post {
    string title; //length limit enforced by ruleset, must be unique, immutable
    uint256 number; //must be > 0 if post exists, unique, immutable
    string contentType; //MIME-type of content
    IpfsMultihash contentAddress; //required only if enforced by ruleset
    address creator; //immutable
    uint256 creationTime; //UNIX timestamp, accept user input bounded by block.timestamp, immutable
    address groupAddress; //null when group has not been created for this post
    uint256 balance; //amount of money owned by this post in this group
    int256 permissions; //permission level of post
  }

  mapping (address => uint256[]) postNumbersByCreator;
  mapping (uint256 => Post) postsByNumber;
  uint256[] postNumbers;
  address parentGroup;

  event NewPost(address indexed creator, uint256 indexed number, string title);
  event NewGroup(uint256 indexed postNumber, address groupAddress);

  uint256 userCount = 0;

  struct User {
    string nickname; //length/uniqueness enforced by ruleset
    uint256 number; //must be > 0 if user exists, unique, immutable
    string profileType; //MIME-type of profile
    IpfsMultihash profileAddress; //required only if enforced by ruleset
    address addr; //public key, unique, immutable
    uint256 joinTime; //UNIX timestamp when user first joined group, use block.timestamp, immutable
    address directAddress; //null when user has not created/linked a private group (for direct messaging)
    uint256 balance; //amount of money owned by this user in this group
    int256 permissions; //permission level of user, permit negatives for banned/muted/etc type users, also use largest type to permit flags instead of linear values
  }

  mapping (address => User) usersByAddress; //maps ethereum addres (public key) to user objects
  mapping (uint256 => User) usersByNumber;

  function Posts(string title, string contentType, uint8 ipfsHashFunction, uint8 ipfsHashLength, bytes ipfsHash, uint256 creationTime) payable {
    require(ipfsHashLength == ipfsHash.length);

    contents.title = title;
    contents.contentType = contentType;
    contents.contentAddress.hashFunction = ipfsHashFunction;
    contents.contentAddress.hashLength = ipfsHashLength;
    contents.contentAddress.hash = ipfsHash;
    contents.creator = msg.sender;

    if (creationTime > block.timestamp || creationTime <= (block.timestamp - 1 hours)) { //TODO ruleset? moving average across all posts in the last hour?
      creationTime = block.timestamp; //timestamp was invalid, just get the best time we can from the block
    }

    contents.creationTime = creationTime;
  }

  function getPostByNumber(uint256 _number) constant returns (
    string title,
    uint256 number,
    string contentType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    address creator,
    uint256 creationTime,
    address groupAddress,
    uint256 balance,
    int256 permissions
  ) {
    Post memory p = postsByNumber[_number];
    return (
      p.title,
      p.number,
      p.contentType,
      p.contentAddress.hashFunction,
      p.contentAddress.hashLength,
      p.contentAddress.hash,
      p.creator,
      p.creationTime,
      p.groupAddress,
      p.balance,
      p.permissions
    );
  }

  function setGroupAddress(uint256 postNum, address addr) {
    require(postNum <= postCount); //bad input

    Post memory p = postsByNumber[postNum];
    require(p.number != 0); //post deleted

    //TODO: ruleset check permissions to add associate a group to this post

    //TODO: check if addr is a valid contract?

    p.groupAddress = addr;
    postsByNumber[postNum] = p;
  }

  function getGroupAddress(uint256 postNum) returns (address) {
    require(postNum <= postCount); //bad input

    Post memory p = postsByNumber[postNum];
    require(p.number != 0); //post deleted

    return p.groupAddress;
  }

  function getParent() constant returns (address) {
    return parentGroup;
  }

  function setParent(address parent) {
    parentGroup = parent;
  }

  function getPostNumbersByCreator(address _creator) constant returns (uint256[]) {
    return (postNumbersByCreator[_creator]);
  }

  function getPostNumbers() constant returns (uint256[]) {
    return (postNumbers);
  }

  function createPost(string title, string contentType, uint8 ipfsHashFunction, uint8 ipfsHashLength, bytes ipfsHash, uint256 creationTime) returns (uint256) {
    //TODO: check title length via ruleset
    //TODO: UTF-8 length != bytes().length
    require(bytes(title).length <= 255);

    //        require(ipfsHashLength != 0); //permit content-less posts TODO: ruleset

    require(ipfsHashLength == ipfsHash.length);

    //TODO: check if ipfs hash length matches expected size for hash function (function 0x12 should always be 0x20 bytes long)

    uint256 ctLen = bytes(contentType).length;

    if (ipfsHashLength > 0) { //if there's no content, don't bother checking if there's a content type given
      require(ctLen > 0);
    }
    require(ctLen <= 255); //RFC 6838 limits mime types to 127 bytes for each of the major and minor types, plus the separating slash

    if (creationTime > block.timestamp || creationTime <= (block.timestamp - 1 hours)) { //TODO ruleset? moving average across all posts in the last hour?
      creationTime = block.timestamp; //timestamp was invalid, just get the best time we can from the block
    }

    address creator = msg.sender;

    //User memory usr = usersByAddress[creator];
    //TODO: ruleset: award or fees

    postCount++;

    Post memory newPost = Post({
      title: title,
      number: postCount,
      contentType: contentType,
      contentAddress: IpfsMultihash({
        hashFunction: ipfsHashFunction,
        hashLength: ipfsHashLength,
        hash: ipfsHash
      }),
      creator: creator,
      creationTime: creationTime,
      groupAddress: 0,
      balance: 0, //TODO: default from ruleset
      permissions: 0 //TODO: default from ruleset
    });

    postNumbersByCreator[creator].push(postCount);
    postsByNumber[postCount] = newPost;
    postNumbers.push(postCount);

    NewPost(creator, postCount, title);

    return (postCount);
  }

  /*
  function userExistsByAddress(address addr) {
  }
   */

  function getTitle() returns (string) {
    return (contents.title);
  }

  function getContentType() returns (string) {
    return (contents.contentType);
  }

  function getContentAddress() returns (uint8, uint8, bytes) {
    return (
      contents.contentAddress.hashFunction,
      contents.contentAddress.hashLength,
      contents.contentAddress.hash
    );
  }

  function getCreator() returns (address) {
    return (contents.creator);
  }

  function getCreationTime() returns (uint256) {
    return (contents.creationTime);
  }


}

