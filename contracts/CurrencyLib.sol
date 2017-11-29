/*
This file is part of Cybernetic Chat.

Cybernetic Chat is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Cybernetic Chat is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Cybernetic Chat.  If not, see <http://www.gnu.org/licenses/>.
*/


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

  event Debug(
    uint256 indexed major,
    uint256 indexed minor,
    uint256 indexed micro,
    string message,
    uint256 dat1,
    uint256 dat2
  );

  function equalizeTokens(
    uint256 amount,
    uint256 senderBalance,
    uint256 receiverBalance,
    bool increase
  ) internal pure returns (
    uint256
  ) {
    if (increase) {
      return (senderBalance >= amount ? amount : senderBalance);
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

  function transferTokensUserToUser(
    GroupLib.Group storage group,
    UserLib.User storage sender,
    UserLib.User storage receiver,
    uint256 amount,
    bool increase
  ) internal {
    if (sender.parentNum != receiver.parentNum || sender.parentNum != group.number) {
      Debug(2, 0, group.number, "transferTokensUserToUser invalid", sender.parentNum, receiver.parentNum);
      return;
    }

    amount = equalizeTokens(
      amount,
      sender.balance,
      receiver.balance,
      increase
    );

    if (amount == 0)
      return;

    awardTokensToUser(group, sender, amount, false);
    awardTokensToUser(group, receiver, amount, increase);
    //TODO: ruleset taxes, not 1:1 deduction?
  }

  function transferTokensUserToPost(
    GroupLib.Group storage group,
    UserLib.User storage sender,
    PostLib.Post storage receiver,
    uint256 amount,
    bool increase
  ) internal {
    if (receiver.parentNum != group.number || sender.parentNum != group.number) {
      Debug(2, 1, group.number, "transferTokensUserToPost invalid", sender.parentNum, receiver.parentNum);
      return;
    }

    amount = equalizeTokens(
      amount,
      sender.balance,
      receiver.balance,
      increase
    );

    if (amount == 0)
      return;

    awardTokensToUser(group, sender, amount, false);
    awardTokensToPost(group, receiver, amount, increase);
    //TODO: ruleset taxes, not 1:1 deduction?
  }

  function transferTokensUserToGroup(
    GroupLib.Group storage group,
    UserLib.User storage sender,
    uint256 amount,
    bool increase
  ) internal {
    if (sender.parentNum != group.number) {
      Debug(2, 2, 0, "transferTokensUserToGroup invalid", sender.parentNum, group.number);
      return;
    }

    /*
    amount = equalizeTokens(
      amount,
      sender.balance,
      group.tokens,
      increase
    );
    */
    amount = sender.balance >= amount ? amount : sender.balance;

    if (amount == 0)
      return;

    uint256 senderDelta;
    (sender.balance, senderDelta) = subtract(sender.balance, amount);
    UserBalanceChanged(group.number, sender.addr, senderDelta, false);
    if (!increase) {
      uint256 groupDelta;
      (group.tokens, groupDelta) = subtract(group.tokens, senderDelta);
      PostTokensChanged(group.number, groupDelta, increase);
    }
  }

  function add(uint256 x, uint256 y) pure internal returns (uint256 z, uint256 d) {
    if ((z = x + y) < x) {
      z = 2**256 - 1;
    }
    d = z - x;
  }

  function subtract(uint256 x, uint256 y) pure internal returns (uint256 z, uint256 d) {
    if ((z = x - y) > x) {
      z = 0;
      d = x;
    } else {
      d = y;
    }
  }

  function awardTokens(
    uint256 targetBalance,
    uint256 parentBalance,
    uint256 amount,
    bool increase
  ) internal returns (
    uint256 newTargetBalance,
    uint256 newParentBalance,
    uint256 targetDelta,
    uint256 parentDelta
  ) {
    if (increase) {
      (newParentBalance, parentDelta) = add(parentBalance, amount);

      //group tokens >= user balance, so if group tokens maxes out at 2^256,
      // then the user can't get any more tokens
      (newTargetBalance, targetDelta) = add(targetBalance, parentDelta);
    } else {
      (newTargetBalance, targetDelta) = subtract(targetBalance, amount);

      //if the user runs out of tokens part of the way through the transfer,
      // only subtract the amount the user did have from the group tokens
      (newParentBalance, parentDelta) = subtract(parentBalance, targetDelta);
    }
  }

  function awardTokensToUser(
    GroupLib.Group storage group,
    UserLib.User storage user,
    uint256 amount,
    bool increase
  ) internal {
    uint256 userDelta;
    uint256 groupDelta;
    (
      user.balance,
      group.tokens,
      userDelta,
      groupDelta
    ) = awardTokens(
      user.balance,
      group.tokens,
      amount,
      increase
    );

    UserBalanceChanged(group.number, user.addr, userDelta, increase);
    PostTokensChanged(group.number, groupDelta, increase);
  }

  function awardTokensToPost(
    GroupLib.Group storage group,
    PostLib.Post storage post,
    uint256 amount,
    bool increase
  ) internal {
    uint256 postDelta;
    uint256 groupDelta;
    (
      post.balance,
      group.tokens,
      postDelta,
      groupDelta
    ) = awardTokens(
      post.balance,
      group.tokens,
      amount,
      increase
    );

    PostBalanceChanged(group.number, post.number, postDelta, increase);
    PostTokensChanged(group.number, groupDelta, increase);
  }
}
