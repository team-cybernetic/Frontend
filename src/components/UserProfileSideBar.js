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
import './style.css';
import moment from 'moment';
import UserStore from '../stores/UserStore';

class UserProfileSidebar extends Component {
  constructor(props) {
    super(props);
    console.log("UserProfileSidebar props:", props);
  }

  componentWillMount() {
    this.loadProfile(this.userAddress());
  }

  componentWillUnmount() {
    if (this.updateListener) {
      this.state.user.unregisterProfileUpdateListener(this.updateListener);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.userAddress() !== nextProps.pathState.userAddress) {
      if (this.updateListener) {
        this.state.user.unregisterProfileUpdateListener(this.updateListener);
      }
      this.loadProfile(nextProps.pathState.userAddress);
    }
  }

  loadProfile(address) {
    this.setState({ isLoading: true });
    const user = UserStore.getUser(address);
    user.loadProfile().then(() => {
      this.setState({ isLoading: false });
    });
    if (this.updateListener) {
      this.state.user.unregisterProfileUpdateListener(this.updateListener);
    }
    this.updateListener = user.registerProfileUpdateListener(() => {
      this.forceUpdate();
    });
    this.setState({ user });
  }

  userAddress() {
    return this.props.pathState.userAddress;
  }

  render() {
    return (
      <div style={styles.container}>
        {this.renderStats()}
      </div>
    );
  }

  renderProfileLastUpdateTime() {
    const profileLastUpdateTime = this.state.user.getProfileLastUpdateTime();
    let m = moment(profileLastUpdateTime, 'X');
    console.log("Profile last updated:", profileLastUpdateTime.toString());
    if (!!profileLastUpdateTime && profileLastUpdateTime.toString() !== '0') { //it's a BigNumber
      return (
        <span style={styles.profileLastUpdateTime}>
          Profile last updated&nbsp;{m.fromNow()}
        </span>
      );
    } else {
      return (
        <span style={styles.profileLastUpdateTime}>
          Profile never set!
        </span>
      );
    }
  }

  renderStats() {
    if (!this.state.isLoading) {
      return (
        <div style={styles.stats}>
          {this.renderProfileLastUpdateTime()}
        </div>
      );
    } else {
      return (
        <div style={styles.loading}>
        </div>
      );
    }
  }
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#e6ecf0',
    margin: '0px',
    overflowY: 'auto',
  },
  stats: {
    textAlign: 'center',
    fontSize: 'small',
    margin: '2px',
    marginBottom: '10px',
    marginTop: '10px',
  },
  profileLastUpdateTime: {

  },
};

export default UserProfileSidebar;
