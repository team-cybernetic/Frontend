pragma solidity ^0.4.11;

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
}
