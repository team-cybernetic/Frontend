import React, { Component } from 'react';
import Wallet from '../models/Wallet';
import cx from 'classnames';
import moment from 'moment';
import { Link } from 'react-router-dom';
import UpDownVoter from './UpDownVoter';

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

  renderJoinTime() {
    let m = moment(this.state.userProperties.getJoinTime(), 'X');
    return (
      <span style={this.styles.joinTime}>
        Member since&nbsp;{m.fromNow()}
      </span>
    );
  }

  renderAddress() {
    return (
      <div style={this.styles.addressWrapper}>
        Address:&nbsp;
        <span style={this.styles.address}>
          <Link to={`/user/${this.props.user.getAddress()}`}>{this.props.user.getAddress()}</Link>
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

  sendTip(amount, isPos) {
    this.props.group.sendUserCurrency(this.props.user.getAddress(), amount, isPos).then(() => {
      console.log("successfully " + (isPos ? "up" : "down") + "tipped user " + this.props.user.getAddress() + " by " + amount + "!");
    }).catch((error) => {
      console.error("failed to send currency:", error);
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
                {this.renderJoinTime()}
                {this.renderAddress()}
              </div>
              <UpDownVoter
                getBalance={() => this.state.userProperties.getBalance() }
                send={this.sendTip.bind(this)}
              />
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
        textAlign: 'center',
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
      userInfo: {
        display: 'flex',
        flexFlow: 'row',
      },
      header: {
        display: 'flex',
        flexDirection: 'column',
        width: '90%',
      },
      joinTime: {
        fontSize: 'x-small',
      },
    }
  };

}
