import React, { Component } from 'react';
import Wallet from '../models/Wallet';
import cx from 'classnames';

export default class UserView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSelf: undefined,
      inputTip: '1',
    };
  }

  componentWillMount() {
    const userProperties = this.props.user.getProperties(this.props.group.getNumber());
    this.setState({
      userProperties,
    });
    this.propertiesListenerHandle = userProperties.registerUpdateListener(() => {
      this.forceUpdate();
    });
    this.profileListenerHandle = this.props.user.registerProfileUpdateListener(() => {
      this.forceUpdate();
    });
    userProperties.load().then(() => {
      if (this.props.user.getAddress() === Wallet.getAccountAddress()) {
        this.setState({
          isSelf: true,
        });
      }
    });
  }

  componentWillUnmount() {
    this.state.userProperties.unregisterUpdateListener(this.propertiesListenerHandle);
    this.props.user.unregisterProfileUpdateListener(this.profileListenerHandle);
  }

  renderAddress() {
    return (
      <div style={this.styles.addressWrapper}>
        Address:&nbsp;
        <span style={this.styles.address}>
          {this.props.user.getAddress()}
        </span>
      </div>
    );
  }

  renderBalance() {
    return (
      <div style={this.styles.balanceWrapper}>
        Balance:&nbsp;
        <span style={this.styles.balance}>
          {this.props.group.getUserProperties(this.props.user.getAddress()).getBalance().toLocaleString()}
        </span>
      </div>
    );
  }

  renderNickname() {
    const nickname = this.props.user.getNickname();
    if (nickname) {
      return (
        <span style={this.styles.nickname}>
          {nickname}
        </span>
      );
    } else {
      return (
        <span style={this.styles.nicknameAnon}>
          Anonymous
        </span>
      );
    }
  }

  renderTip() {
    return (
        <div style={this.styles.tipWrapper}>
          Tip:&nbsp;
          <input type='text' 
            style={this.styles.tipInput}
            value={this.state.inputTip}
            onChange={(e) => this.changeTip(e)}
          />
          <input type='submit' 
            style={this.styles.tipSend}
            value='send' 
            onClick={() => this.sendTip()}
            className={cx('button')}
          />
        </div>
      );
  }

  renderUpvote() {
    return (

      <a 
        style={this.styles.voteArrow}
        onMouseDown={() => this.upvoteMouseDown()}
        onMouseUp={() => this.upvoteMouseUp()}
        onMouseOut={() => this.upvoteMouseOut()}
      >
        ▲
      </a>
    );
  }

  renderBalance() {
      return (
        <span style={this.styles.balance}>
          {this.state.userProperties.getBalance().toString()}
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
        style={this.styles.voteArrow}
        onMouseDown={() => this.downvoteMouseDown()}
        onMouseUp={() => this.downvoteMouseUp()}
        onMouseOut={() => this.downvoteMouseOut()}
      >
        ▼
      </a>
    );
  }

  sendTip() {
    var amount = parseInt(this.state.inputTip);
    if (window.confirm("This transaction will cost you " + amount + " tokens, continue?") == false) {
        return;
    }
    var address = this.props.user.getAddress();
    if (amount === NaN) {
      return;
    }
    var isPos = amount >= 0;
    this.props.group.sendUserCurrency(address, (amount * (isPos ? 1 : -1)), isPos).then(() => {
      console.log("successfully sent currency!");
    }).catch((error) => {
      console.error("failed to send currency:", error);
    });
  }

  changeTip(event) {
    this.setState({
      inputTip: event.target.value,
    });
  }

  vote(amount) {
    const isPos = amount >= 0;
    amount = Math.abs(amount);
    if (window.confirm("This transaction will cost you " + amount + " tokens, continue?") == false) {
        return;
    }
    this.props.group.sendUserCurrency(this.props.user.getAddress(), amount, isPos).then(() => {
      console.log("successfully " + (isPos ? "up" : "down") + "tipped user #" + this.props.user.getAddress() + " by " + amount + "!");
    }).catch((error) => {
      console.error("failed to send currency:", error);
    });
  }

  changeCount(amount) {
    if (this.state.countActive) {
      console.log("counting active, changing count to", this.state.count + amount);
      this.setState({
        count: this.state.count + amount,
      });
      setTimeout(() => {
        this.changeCount(amount);
      }, 500);
    }
  }



  upvoteMouseDown() {
    //mouse down, reset count and begin counting up
    this.state.count = 0;
    this.state.countActive = true;
    this.changeCount(1);
  }

  upvoteMouseUp() {
    //mouse up over the element, send the tip
    this.state.countActive = false;
    this.vote(this.state.count);
    this.setState({
      count: 0,
    });
  }

  upvoteMouseOut() {
    //mouse out, stop counting, reset counter (cancelled)
    this.setState({
      count: 0,
      countActive: false,
    });
  }

  downvoteMouseDown() {
    //mouse down, reset count and begin counting up
    this.state.count = 0;
    this.state.countActive = true;
    this.changeCount(-1);
  }

  downvoteMouseUp() {
    //mouse up over the element, send the tip
    this.state.countActive = false;
    this.vote(this.state.count);
    this.setState({
      count: 0,
    });
  }

  downvoteMouseOut() {
    //mouse out, stop counting, reset counter (cancelled)
    this.setState({
      count: 0,
      countActive: false,
    });
  }



  render() {
    if (this.state.userProperties.isLoaded()) {
      return (
        <div style={this.styles.container} className='card'>
          <div style={this.styles.cardContent} className='card-content'>
            <div style={this.styles.userInfo}>
              <div style={this.styles.header}>
                {this.renderNickname()}
                {this.renderAddress()}
              </div>
              <div style={this.styles.votingContainer}>
                <div style={this.styles.voting}>
                  {this.renderUpvote()}
                  {this.renderBalance()}
                  {this.renderDownvote()}
                </div>
                <div style={this.styles.votingCountContainer}>
                  <span style={this.styles.votingCount}>
                    {this.renderCount()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div style={this.styles.container} className='card'>
          <div style={this.styles.cardContent} className='card-content'>
            Loading...
          </div>
        </div>
      );
    }

  }

  get styles() {
    return {
      container:
        this.props.sidebar ? {
          width: '96%',
          marginLeft: '2%',
          marginRight: '2%',
          marginTop: '1.5%',
          marginBottom: '1.5%',
          backgroundColor: this.state.isSelf ? 'yellow' : 'white',
        } : {
          width: '46%',
          marginLeft: '2%',
          marginRight: '2%',
          marginTop: '1.5%',
          marginBottom: '1.5%',
          backgroundColor: 'white',
        },
      contentWrapper: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      },
      content: {
        overflowY: 'auto',
        minHeight: '0px',
        flex: 1,
      },
      contentHr: {
        flexShrink: 0,
      },
      cardContent: {
        display: 'flex',
        flexDirection: 'column',
        overflowWrap: 'break-word',
        maxHeight: '500px',
        padding: '1rem',
      },
      timestamp: {
        fontSize: 'small',
      },
      date: {
        fontSize: 'small',
      },
      numberWrapper: {
        fontSize: 'small',
      },
      number: {
        fontSize: 'small',
      },
      balanceWrapper: {
        fontSize: 'small',
      },
      balance: {
        fontSize: 'small',
      },
      multiHash: {
        fontSize: 'small',
      },
      multiHashIpfs: {
        fontSize: 'x-small',
      },
      addressWrapper: {
        fontSize: 'small',
      },
      address: {
        fontSize: 'x-small',
      },
      tipWrapper: {
        display: 'flex',
      },
      tipInput: {
        width: '50px',
        flexGrow: '1',
      },
      tipSend: {
        fontSize: 'x-small',
      },
      nickname: {
      },
      nicknameAnon: {
        fontStyle: 'italic',
      },
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
      voting: {
        lineHeight: '20px',
        float: 'right',
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
      userInfo: {
        display: 'flex',
        flexFlow: 'row',
      },
      header: {
        display: 'flex',
        flexDirection: 'column',
        width: '90%',
      },
    }
  };

}
