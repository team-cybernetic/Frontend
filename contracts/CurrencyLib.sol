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
  event PostTokensChanged(
    uint256 indexed postNumber,
    uint256 amount,
    bool increased
  );


  function equalizeTokens(
    uint256 amount,
    uint256 senderBalance,
    uint256 receiverBalance,
    bool increase
  ) private pure returns (
    uint256
  ) {
    if (increase) {
      return (senderBalance > amount ? amount : senderBalance);
    } else {
      if (senderBalance >= amount) { //have enough to complete
        if (receiverBalance >= amount) { //can take full blow
          //Scenario: ideal
          return (amount);
        } else { //can't take the full blow
          //Scenario: smashed
          return (receiverBalance);
        }
      } else { //don't have enough to complete
        if (receiverBalance >= senderBalance) { //can take all sender has got
          //Scenario: poor boy
          return (senderBalance);
        } else { //can't even take what sender has got
          //Scenario: poor smasher
          return (receiverBalance);
        }
      }
    }
  }

  function transferTokensToUser(
    StateLib.State storage state,
//    uint256 parentNum,
    GroupLib.Group storage group,
    address receiverAddress,
    uint256 amount,
    bool increase
  ) public {
    if (amount == 0) {
      return;
    }
    var sender = GroupLib.getUserProperties(state, group, msg.sender);
    var receiver = GroupLib.getUserProperties(state, group, receiverAddress);
    //var parent = PostLib.getPost(state, parentNum);
    //doing the getUserProperties calls here lets them do their requires() for validation

    amount = equalizeTokens(
      amount,
      sender.balance,
      receiver.balance,
      increase
    );

    awardTokensToUser(group, sender, amount, false);
    awardTokensToUser(group, receiver, amount, increase);
    //TODO: ruleset taxes, not 1:1 deduction?
  }

  function transferTokensToPost(
    StateLib.State storage state,
//    uint256 parentNum,
//    PostLib.Post storage parent,
    GroupLib.Group storage group,
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
    require(GroupLib.isSubpost(state, group, receiver.number));

    var sender = GroupLib.getUserProperties(state, group, msg.sender);
    //var sender = UserLib.getUser(state, parent.number, msg.sender);
    //var receiver = PostLib.getPost(state, postNum);
    //var parent = PostLib.getPost(state, parentNum);
    amount = equalizeTokens(
      amount,
      sender.balance,
      receiver.balance,
      increase
    );

    awardTokensToUser(group, sender, amount, false);
    awardTokensToPost(group, receiver, amount, increase);
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
    GroupLib.Group storage group,
//    PostLib.Post storage parent,
    UserLib.User storage user,
    uint256 amount,
    bool increase
  ) internal {
    uint256 oldUserBalance = user.balance;
    uint256 oldParentBalance = group.tokens;
    uint256 userDelta;
    uint256 groupDelta;
    if (increase) {
      group.tokens = add(group.tokens, amount);
      groupDelta = subtract(group.tokens, oldParentBalance);
      user.balance = add(user.balance, groupDelta); //group tokens >= user balance, so if group tokens maxes out at 2^256, then the user can't get any more tokens
      userDelta = subtract(user.balance, oldUserBalance);
    } else {
      user.balance = subtract(user.balance, amount);
      userDelta = subtract(oldUserBalance, user.balance);
      group.tokens = subtract(group.tokens, userDelta); //if the user runs out of tokens part of the way through the transfer, only subtract the amount the user did have from the group tokens
      groupDelta = subtract(oldParentBalance, group.tokens);
    }
    UserBalanceChanged(group.number, user.addr, userDelta, increase);
    PostTokensChanged(group.number, groupDelta, increase);
  }

  function awardTokensToPost(
//    StateLib.State storage state,
    GroupLib.Group storage group,
//    PostLib.Post storage parent,
    PostLib.Post storage post,
    uint256 amount,
    bool increase
  ) internal {
    uint256 oldPostBalance = post.balance;
    uint256 oldParentBalance = group.tokens;
    uint256 postDelta;
    uint256 groupDelta;
    if (increase) {
      group.tokens = add(group.tokens, amount);
      groupDelta = subtract(group.tokens, oldParentBalance);
      post.balance = add(post.balance, groupDelta);
      postDelta = subtract(post.balance, oldPostBalance);
    } else {
      post.balance = subtract(post.balance, amount);
      postDelta = subtract(oldPostBalance, post.balance);
      group.tokens = subtract(group.tokens, postDelta);
      groupDelta = subtract(oldParentBalance, group.tokens);
    }
    PostBalanceChanged(group.number, post.number, postDelta, increase);
    PostTokensChanged(group.number, groupDelta, increase);
  }
}
