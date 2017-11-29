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


import React, { Component } from 'react';

export default class UpDownVoter extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  renderUpvote() {
    return (

      <a 
        style={styles.voteArrow}
        onMouseDown={() => this.voteMouseDown(1)}
        onMouseUp={() => this.voteMouseUp()}
        onMouseOut={() => this.voteMouseOut()}
      >
        ▲
      </a>
    );
  }

  renderBalance() {
      return (
        <span style={styles.balance}>
          {this.props.getBalance().toString()}
        </span>
    );
  }

  renderCount() {
    if (this.state.countActive) {
      return (this.state.count >= 0 ? '+' : '') + this.state.count;
    }
  }

  renderDownvote() {
    return (
      <a
        style={styles.voteArrow}
        onMouseDown={() => this.voteMouseDown(-1)}
        onMouseUp={() => this.voteMouseUp()}
        onMouseOut={() => this.voteMouseOut()}
      >
        ▼
      </a>
    );
  }
  
  changeTip(event) {
    this.setState({
      inputTip: event.target.value,
    });
  }

  vote(amount) {
    const isPos = amount >= 0;
    amount = Math.abs(amount);
    if (!window.confirm("This transaction will cost you " + amount + " tokens, continue?")) {
        return;
    }
    this.props.send(amount, isPos);
  }

  changeCount(amount) {
    if (this.state.countActive) {
      this.setState({
        count: this.state.count + amount,
      });
      setTimeout(() => {
        this.changeCount(amount);
      }, 500);
    }
  }

  voteMouseDown(amount) {
    //mouse down, reset count and begin counting up
    /*
    this.setState({
      count: 0,
      countActive: true,
    });
    */
    this.state.count = 0;
    this.state.countActive = true;
    this.changeCount(amount);
  }

  voteMouseUp() {
    //mouse up over the element, send the tip
    /*
    this.setState({
      countActive: false,
    });
    */
    this.state.countActive = false;
    this.vote(this.state.count);
    this.setState({
      count: 0,
    });
  }

  voteMouseOut() {
    //mouse out, stop counting, reset counter (cancelled)
    this.setState({
      count: 0,
      countActive: false,
    });
  }

  render() {
    return (
      <div style={styles.votingContainer}>
        <div style={styles.votingContainer2}>
          <div style={styles.voting}>
            {this.renderUpvote()}
            {this.renderBalance()}
            {this.renderDownvote()}
          </div>
          <div style={styles.votingCountContainer}>
            <span style={styles.votingCount}>
              {this.renderCount()}
            </span>
          </div>
        </div>
      </div>
    );
  }
}

const styles = {
  voteArrow: {
    //        backgroundColor: this.props.selected ? '#fdffea' : 'white',
    border: 'none',
    textAlign: 'center',
    cursor: 'pointer',
  },
  votingContainer: {
    display: 'flex',
    marginLeft: '4px',
  },
  votingContainer2: {
    display: 'flex',
  },
  voting: {
//    lineHeight: '20px',
//    float: 'right',
    display: 'flex',
    flexDirection: 'column',
  },
  votingCountContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  votingCount: {
    fontSize: 'small',
  },
  balance: {
    fontSize: 'small',
    textAlign: 'center',
  },

};
