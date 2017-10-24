pragma solidity ^0.4.11;

import "./ContentLib.sol";

library UserLib {

  using UserLib for State;

  event UserJoined(uint256 indexed userNumber, address indexed userAddress);
  event UserLeft(uint256 indexed userNumber, address indexed userAddress);
  event UserBalanceChanged(uint256 indexed userNumber, int256 amount);

  struct User {
    ContentLib.Content contents;
    uint256 number; //must be > 0 if user exists, unique, immutable
    address directAddress; //null when user has not created/linked a private group (for direct messaging)
    int256 balance; //amount of money owned by this user in this group
    int256 permissions; //permission level of user, permit negatives for banned/muted/etc type users, also use largest type to permit flags instead of linear values
  }

  struct State {
    uint256 count;
    mapping (address => User) byAddress; //maps ethereum address (public key) to user objects
    mapping (uint256 => User) byNumber;
    uint256[] numbers;
    address[] addresses;
  }

  function getUserNumbers(State storage self) internal returns (uint256[]) {
    return (self.numbers);
  }

  function userExistsByNumber(State storage self, uint256 num) internal returns (bool) {
    require(num <= self.count);
    return (self.byNumber[num].number != 0);
  }

  function getUserByNumberRaw(State storage self, uint256 num) internal returns (User) {
    return (self.byNumber[num]);
  }

  function getUserByNumber(State storage self, uint256 num) internal returns (User) {
    require(userExistsByNumber(self, num));
    return (getUserByNumberRaw(self, num));
  }


  function getUserAddresses(State storage self) internal returns (address[]) {
    return (self.addresses);
  }

  function userExistsByAddress(State storage self, address addr) internal returns (bool) {
    require(addr != 0x0);
    return (self.byAddress[addr].number != 0);
  }

  function getUserByAddressRaw(State storage self, address userAddress) internal returns (User) {
    return (self.byAddress[userAddress]);
  }

  function getUserByAddress(State storage self, address userAddress) internal returns (User) {
    require(self.userExistsByAddress(userAddress));
    return (getUserByAddressRaw(self, userAddress));
  }

  function join(State storage self) internal {
    require(!userExistsByAddress(self, msg.sender));

    self.count++;
    self.byNumber[self.count] = User({
      contents: ContentLib.Content({
        title: "",
        mimeType: "",
        multihash: ContentLib.IpfsMultihash({
          hashFunction: 0,
          hashLength: 0,
          hash: ""
        }),
        creator: msg.sender,
        creationTime: block.timestamp
      }),
      number: self.count,
      directAddress: 0,
      balance: 0, //TODO: ruleset
      permissions: 0 //TODO: ruleset
    });

    self.byAddress[msg.sender] = self.byNumber[self.count];
    self.addresses.push(msg.sender);

    self.numbers.push(self.count);

    UserJoined(self.count, msg.sender);
  }

  function leave(State storage self) internal { 
    require(self.userExistsByAddress(msg.sender));

    //TODO: send the user their ether

    uint256 old_num = self.byAddress[msg.sender].number;

    self.byAddress[msg.sender].number = 0;

    self.byNumber[old_num] = self.byAddress[msg.sender];
    delete self.addresses[old_num - 1];
    delete self.numbers[old_num - 1];

    UserLeft(old_num, msg.sender);
  }

}
