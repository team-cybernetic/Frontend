import React, { Component } from 'react';
import UserView from './UserView';
import Collapsible from 'react-collapsible';
import './style.css';
import cx from 'classnames';
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

  componentWillReceiveProps(nextProps) {
    if (this.userAddress() !== nextProps.pathState.userAddress) {
      this.loadProfile(nextProps.pathState.userAddress);
    }
  }

  loadProfile(address) {
    this.setState({ isLoading: true });
    const user = UserStore.getUser(address);
    user.loadProfile().then(() => {
      this.setState({ isLoading: false });
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
    console.log("Profile last updated:", profileLastUpdateTime);
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
