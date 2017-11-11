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
    this.listenerHandle = this.props.user.registerUpdateListener((post) => {
      this.forceUpdate();
    });
    this.props.user.loadHeader().then(() => {
      if (this.props.user.getAddress() === Wallet.getAccountAddress()) {
        this.setState({
          isSelf: true,
        });
      }
    });
  }

  componentWillUnmount() {
    this.props.user.unregisterUpdateListener(this.listenerHandle);
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

  /*
  renderNumber() {
    return (
      <div style={this.styles.numberWrapper}>
        User&nbsp;#
        <span style={this.styles.number}>
          {this.props.user.getNumber()}
        </span>
      </div>
    );
  }
  */

  renderBalance() {
    return (
      <div style={this.styles.balanceWrapper}>
        Balance:&nbsp;
        <span style={this.styles.balance}>
          {this.props.user.getBalance().toLocaleString()}
        </span>
      </div>
    );
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

  render() {
    if (this.props.user.isHeaderLoaded()) {
      return (
        <div style={this.styles.container} className='card'>
          <div style={this.styles.cardContent} className='card-content'>
            {this.renderAddress()}
            {this.renderBalance()}
            {this.renderTip()}
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
      }
    }
  };

}
