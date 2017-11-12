import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import CyberneticChat from '../blockchain/CyberneticChat';
import Wallet from '../models/Wallet';
import UserStore from '../stores/UserStore';
import xss from 'xss';

class UserProfileView extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.loadProfile(this.userAddress());
  }

  componentWillReceiveProps(nextProps) {
    if (this.userAddress() !== nextProps.pathState.userAddress) {
      this.loadProfile(nextProps.pathState.userAddress);
    }
  }

  componentWillUnmount() {
    if (this.profileUpdateListenerHandle && this.state.user) {
      this.state.user.unregisterProfileUpdateListener(this.profileUpdateListenerHandle);
    }
  }

  loadProfile(address) {
    if (this.profileUpdateListenerHandle && this.state.user) {
      this.state.user.unregisterProfileUpdateListener(this.profileUpdateListenerHandle);
    }
    this.setState({ isLoading: true });
    const user = UserStore.getUser(address);
    user.loadProfile().then(() => {
      this.setState({ isLoading: false });
    });
    this.setState({ user });
    this.profileUpdateListenerHandle = user.registerProfileUpdateListener(() => this.forceUpdate());
  }

  render() {
    return (
      <Scrollbars style={styles.scrollBar}>
        <div style={styles.container}>
          <div style={styles.children}>
            {this.renderContent()}
          </div>
        </div>
      </Scrollbars>
    );
  }

  renderContent() {
    let content;
    let loaded = true;
    if (this.state.isLoading) {
      content = 'Loading content...';
    } else if (!this.state.user.profile) {
      if (this.userAddress() === Wallet.getAccountAddress()) {
        content = 'You haven\'t created a profile yet.';
      } else {
        content = 'This user hasn\'t created a profile yet.';
      }
    } else {
      content = xss(this.state.user.profile).replace(/\n/g, '<br />');
    }
    const html = { __html: content };
    return (
      <div>
        <div>Nickname: {this.state.user.nickname}</div>
        <div>Profile: <span dangerouslySetInnerHTML={html}></span></div>
      </div>
    );
  }

  userAddress() {
    return this.props.pathState.userAddress;
  }
}

const styles = {
  container: {
    flex: '1 1 0%',
    padding: '1%',
  },
  children: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
  },
  scrollBar: {
    width: '100%',
    height: '96%',
    backgroundColor: '#e6ecf0',
  },
  loader: {
    flex: 1,
    border: 0,
    fontSize: '3em',
    alignSelf: 'center',
  },
};

export default UserProfileView;
