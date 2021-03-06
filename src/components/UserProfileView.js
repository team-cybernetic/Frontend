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
import { Scrollbars } from 'react-custom-scrollbars';
import Wallet from '../models/Wallet';
import UserStore from '../stores/UserStore';
import xss from 'xss';

class UserProfileView extends Component {

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
