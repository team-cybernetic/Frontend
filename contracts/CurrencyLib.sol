pragma solidity ^0.4.11;

import "./UserLib.sol";
import "./PostLib.sol";

library CurrencyLib {
  struct State {
    uint256 total;
  }

  event UserBalanceChanged(
    uint256 indexed parentNumber,
    address indexed userAddress,
    uint256 amount,
    bool increased
  );
  event PostBalanceChanged(
    uint256 indexed parentNumber,
    uint256 indexed postNumber,
    uint256 amount,
    bool increased
  );



  function transferTokensToUser(
    StateLib.State storage state,
//    uint256 parentNum,
    PostLib.Post storage parent,
    address receiverAddress,
    uint256 amount,
    bool increase
  ) public {
    if (amount == 0) {
      return;
    }
    uint256 parentNum = parent.number;
    var sender = UserLib.getUser(state, parentNum, msg.sender);
    var receiver = UserLib.getUser(state, parentNum, receiverAddress);
    //var parent = PostLib.getPost(state, parentNum);
    //doing the getUser calls here lets them do their requires() for validation

    awardTokensToUser(parent, sender, amount, false);
    awardTokensToUser(parent, receiver, amount, increase);
    //TODO: ruleset taxes, not 1:1 deduction?
  }

  function transferTokensToPost(
    StateLib.State storage state,
//    uint256 parentNum,
    PostLib.Post storage parent,
    PostLib.Post storage receiver,
//    uint256 postNum,
    uint256 amount,
    bool increase
  ) public {
    if (amount == 0) {
      return;
    }
//    uint256 parentNum = parent.number;
//    uint256 postNum = receiver.number;
    require(PostLib.isChild(state, parent.number, receiver.number));

    var sender = UserLib.getUser(state, parent.number, msg.sender);
//    var receiver = PostLib.getPost(state, postNum);
    //var parent = PostLib.getPost(state, parentNum);

    awardTokensToUser(parent, sender, amount, false);
    awardTokensToPost(parent, receiver, amount, increase);
    //TODO: ruleset taxes, not 1:1 deduction?
  }

  function add(uint256 x, uint256 y) pure internal returns (uint256 z) {
    if ((z = x + y) < x) {
      return (2**256 - 1);
    }
  }

  function subtract(uint256 x, uint256 y) pure internal returns (uint256 z) {
    if ((z = x - y) > x) {
      return (0);
    }
  }

  function awardTokensToUser(
//    StateLib.State storage state,
    PostLib.Post storage parent,
    UserLib.User storage user,
    uint256 amount,
    bool increase
  ) internal {
    uint256 oldUserBalance = user.balance;
    uint256 oldParentBalance = parent.tokens;
    uint256 userDelta;
    uint256 parentDelta;
    if (increase) {
      parent.tokens = add(parent.tokens, amount);
      parentDelta = subtract(parent.tokens, oldParentBalance);
      user.balance = add(user.balance, amount);
      userDelta = subtract(user.balance, oldUserBalance);
    } else {
      parent.tokens = subtract(parent.tokens, amount);
      parentDelta = subtract(oldParentBalance, parent.tokens);
      user.balance = subtract(user.balance, amount);
      userDelta = subtract(oldUserBalance, user.balance);
    }
    UserBalanceChanged(parent.number, user.contents.creator, userDelta, increase);
    PostBalanceChanged(parent.parentNum, parent.number, parentDelta, increase);
  }

  function awardTokensToPost(
//    StateLib.State storage state,
    PostLib.Post storage parent,
    PostLib.Post storage post,
    uint256 amount,
    bool increase
  ) internal {
    uint256 oldPostBalance = post.balance;
    uint256 oldParentBalance = parent.tokens;
    uint256 postDelta;
    uint256 parentDelta;
    if (increase) {
      parent.tokens = add(parent.tokens, amount);
      parentDelta = subtract(parent.tokens, oldParentBalance);
      post.balance = add(post.balance, amount);
      postDelta = subtract(post.balance, oldPostBalance);
    } else {
      parent.tokens = subtract(parent.tokens, amount);
      parentDelta = subtract(oldParentBalance, parent.tokens);
      post.balance = subtract(post.balance, amount);
      postDelta = subtract(oldPostBalance, post.balance);
    }
    PostBalanceChanged(parent.number, post.number, postDelta, increase);
    PostBalanceChanged(parent.parentNum, parent.number, parentDelta, increase);
  }
}
