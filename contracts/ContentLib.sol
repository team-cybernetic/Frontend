pragma solidity ^0.4.11;

import "./StateLib.sol";

library ContentLib {

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

  struct Content {
    string title;
    string mimeType;
    IpfsMultihash multihash;
    address creator;
    uint256 creationTime;
  }

  function contentCheck(
//    StateLib.State storage state,
    string title,
    string mimeType,
    uint8 ipfsHashFunction,
    uint8 ipfsHashLength,
    bytes ipfsHash,
    uint256 creationTime
  ) public view returns (
    bool checkPassed,
    uint256 _creationTime
  ) {

    //        require(ipfsHashLength != 0); //permit content-less posts TODO: ruleset
    checkPassed = false;
    _creationTime = 0;

    if (bytes(title).length > 2048) //arbitrary, but pretty close to the gas limit to store 64, 32 byte string segments at 5000 gas per segment
      return;

    if (ipfsHashLength != ipfsHash.length)
      return;

    //check if ipfs hash length matches expected size for hash function (function 0x12 should always be 0x20 bytes long) TODO: find out the other (multihash, size) tuples
    if (ipfsHashLength != 0) {
      if (ipfsHashFunction == 0x12) {
        require(ipfsHashLength == 0x20);
      }
    }

    uint256 ctLen = bytes(mimeType).length;

    if (ipfsHashLength > 0) { //if there's no content, don't bother checking if there's a content type given
      if (ctLen == 0)
        return;
    }

    //RFC 6838 limits mime types to 127 bytes for each of the major and minor types, plus the separating slash
    if (ctLen > 255)
      return;

    if (creationTime > block.timestamp || creationTime <= (block.timestamp - 1 hours)) { //TODO: moving average across all posts in the last hour?
      _creationTime = block.timestamp; //timestamp was invalid, just get the best time we can from the block
    } else {
      _creationTime = creationTime;
    }
    checkPassed = true;
  }
}
