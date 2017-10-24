pragma solidity ^0.4.11;

import "./ContentLib.sol";
import "./UserLib.sol";

library PostLib {

  using PostLib for State;

  event PostCreated(uint256 indexed postNumber);
  event SubgroupCreated(uint256 indexed postNumber, address groupAddress);

  using UserLib for UserLib.State;

  struct Post {
    ContentLib.Content contents;
    uint256 number; //must be > 0 if post exists, unique, immutable
    address groupAddress; //null when group has not been created for this post
    int256 balance; //amount of money owned by this post in this group
    int256 permissions; //permission level of post
  }

  struct State {
    uint256 count;
    mapping (uint256 => Post) byNumber;
    uint256[] numbers;
  }

  function getPostNumbers(State storage self) internal returns (uint256[]) {
    return (self.numbers);
  }

  function postExistsByNumber(State storage self, uint256 num) internal returns (bool) {
    require(num <= self.count);
    return (self.byNumber[num].number != 0);
  }

  function getPostByNumberRaw(State storage self, uint256 num) internal returns (Post) {
    return (self.byNumber[num]);
  }

  function getPostByNumber(State storage self, uint256 num) internal returns (Post) {
    require(postExistsByNumber(self, num));
    return (getPostByNumberRaw(self, num));
  }

  function setGroupAddressOfPost(
    State storage self,
    uint256 num,
    address groupAddress
  ) {
    require(self.postExistsByNumber(num));

    //TODO: ruleset check permissions to add associate a group to this post

    //TODO: check if addr is a valid contract?

    self.byNumber[num].groupAddress = groupAddress;

    SubgroupCreated(num, groupAddress);
  }

  function createPost(
    State storage self,
    UserLib.State storage userlib,
    string title,
    string mimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    uint256 creationTime
  ) internal returns (uint256) {
    //TODO: check title length via ruleset
    //TODO: UTF-8 length != bytes().length
    require(bytes(title).length <= 255);

    //        require(ipfsHashLength != 0); //permit content-less posts TODO: ruleset

    require(ipfsHashLength == ipfsHash.length);

    //TODO: check if ipfs hash length matches expected size for hash function (function 0x12 should always be 0x20 bytes long)

    uint256 ctLen = bytes(mimeType).length;

    if (ipfsHashLength > 0) { //if there's no content, don't bother checking if there's a content type given
      require(ctLen > 0);
    }
    require(ctLen <= 255); //RFC 6838 limits mime types to 127 bytes for each of the major and minor types, plus the separating slash

    if (creationTime > block.timestamp || creationTime <= (block.timestamp - 1 hours)) { //TODO ruleset? moving average across all posts in the last hour?
      creationTime = block.timestamp; //timestamp was invalid, just get the best time we can from the block
    }

    address creator = msg.sender;

    if (!userlib.userExistsByAddress(creator)) {
      userlib.join();
      //joinGroup(); //TODO: do this via ruleset
    }

    /*
    User storage u = usersByAddress[creator];

    awardTokensToUser(u, 1); //TODO: ruleset
    */

    //TODO: ruleset: award or fees

    self.count++;

    self.byNumber[self.count] = Post({
      contents: ContentLib.Content({
        title: title,
        mimeType: mimeType,
        multihash: ContentLib.IpfsMultihash({
          hashFunction: ipfsHashFunction,
          hashLength: ipfsHashLength,
          hash: ipfsHash
        }),
        creator: creator,
        creationTime: creationTime
      }),
      number: self.count,
      groupAddress: 0,
      balance: 0, //TODO: default from ruleset
      permissions: 0 //TODO: default from ruleset
    });

    self.numbers.push(self.count);

    PostCreated(self.count);

    return (self.count);
  }
}
