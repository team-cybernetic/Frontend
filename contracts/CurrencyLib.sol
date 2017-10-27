pragma solidity ^0.4.11;

import "./UserLib.sol";
import "./PostLib.sol";

library CurrencyLib {
  struct State {
    mapping (address => uint256) userBalance;
    mapping (uint256 => uint256) postBalance;
    uint256 total;
  }

  using UserLib for UserLib.State;
  using PostLib for PostLib.State;

  event UserBalanceChanged(uint256 indexed userNumber, address indexed userAddress, uint256 amount, bool increased);
  event PostBalanceChanged(uint256 indexed postNumber, uint256 amount, bool increased);

  function transferTokensToUser(
    State storage self,
    UserLib.State storage userlib,
    address receiverAddress,
    uint256 amount,
    bool increase
  ) {
    if (amount == 0) {
      return;
    }
    awardTokensToUser(self, userlib.getUserByAddress(msg.sender), amount, false);
    awardTokensToUser(self, userlib.getUserByAddress(receiverAddress), amount, increase);
    //TODO: ruleset taxes, not 1:1 deduction?
  }

  function transferTokensToPost(
    State storage self,
    UserLib.State storage userlib,
    PostLib.State storage postlib,
    uint256 postNum,
    uint256 amount,
    bool increase
  ) {
    if (amount == 0) {
      return;
    }
    awardTokensToUser(self, userlib.getUserByAddress(msg.sender), amount, false);
    awardTokensToPost(self, postlib.getPostByNumber(postNum), amount, increase);
    //TODO: ruleset taxes, not 1:1 deduction?
  }

  function add(uint256 x, uint256 y) internal returns (uint256 z) {
    if ((z = x + y) < x) {
      return (2**256 - 1);
    }
  }

  function subtract(uint256 x, uint256 y) internal returns (uint256 z) {
    if ((z = x - y) > x) {
      return (0);
    }
  }

  function awardTokensToUser(
    State storage self,
    UserLib.User storage user,
    uint256 amount,
    bool increase
  ) {
    address userAddress = user.contents.creator;
    uint256 oldBalance = self.userBalance[userAddress];
    if (increase) {
      self.total = add(self.total, amount);
      self.userBalance[userAddress] = add(self.userBalance[userAddress], amount);
      UserBalanceChanged(user.number, userAddress, subtract(self.userBalance[userAddress], oldBalance), increase);
    } else {
      self.total = subtract(self.total, amount);
      self.userBalance[userAddress] = subtract(self.userBalance[userAddress], amount);
      UserBalanceChanged(user.number, userAddress, subtract(oldBalance, self.userBalance[userAddress]), increase);
    }
  }

  function awardTokensToPost(
    State storage self,
    PostLib.Post storage post,
    uint256 amount,
    bool increase
  ) {
    uint256 postNum = post.number;
    uint256 oldBalance = self.postBalance[postNum];
    if (increase) {
      self.total = add(self.total, amount);
      self.postBalance[postNum] = add(self.postBalance[postNum], amount);
      PostBalanceChanged(postNum, subtract(self.postBalance[postNum], oldBalance), increase);
    } else {
      self.total = subtract(self.total, amount);
      self.postBalance[postNum] = subtract(self.postBalance[postNum], amount);
      PostBalanceChanged(postNum, subtract(oldBalance, self.postBalance[postNum]), increase);
    }
  }

  function getUserBalance(State storage self, UserLib.User storage user) returns (uint256) {
    address userAddress = user.contents.creator;
    return (self.userBalance[userAddress]);
  }

  function getPostBalance(State storage self, PostLib.Post storage post) returns (uint256) {
    return (self.postBalance[post.number]);
  }

  function getTotalBalance(State storage self) returns (uint256) {
    return (self.total);
  }
}
