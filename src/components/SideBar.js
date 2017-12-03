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
import PostView from './PostView';
import UserView from './UserView';
import Collapsible from 'react-collapsible';
import Wallet from '../models/Wallet'
import './style.css';
import cx from 'classnames';
import { compact } from 'lodash';

class SideBar extends Component {
  constructor(props) {
    super(props);
    this.userViewMap = [];
    this.state = {
      post: null,
      group: null,
      isLoaded: undefined,
      pathState: null,
      userInGroup: undefined,
    };
  }

  updateUsers(group) {
    group.loadUsers().then((users) => {
      let userInGroup = false;
      if (users) {
        console.log("updateUsers promise");
        const walletAddr = Wallet.getAccountAddress();
        for (let user of users) {
          const userAddress = user.getAddress();
          console.log("user[" + userAddress + "]:", user);
          if (userAddress === walletAddr) {
            userInGroup = true;
            break;
          }
        }
      } else {
        console.log("no users!");
        users = [];
      }
      this.setState({
        users,
        userCount: compact(users).length,
        userInGroup,
      });
    }).catch((error) => {
      console.error("Sidebar: error while loading users list for group", group.getNumber(), ":", error);
    });

  }

  setContent(isLoaded, group, post, pathState) {
    if (isLoaded) {
      if (this.props.isLoaded) {
        return; //went from loaded -> loaded, no update
      }

      this.updateUsers(group);

      if (this.userJoinListener) {
        group.unregisterTokensChangedListener(this.userJoinListener);
      }
      this.userJoinListener = group.registerUserJoinedListener(() => {
        console.log("Sidebar got UserJoined event");
        this.updateUsers(group);
      });

      if (this.userLeaveListener) {
        group.unregisterTokensChangedListener(this.userLeaveListener);
      }
      this.userLeaveListener = group.registerUserLeftListener(() => {
        console.log("Sidebar got UserLeft event");
        this.updateUsers(group);
      });
      console.log("Sidebar registered userLeaveListener", this.userLeaveListener);

      this.setState({
        isLoaded,
        group,
        post,
        pathState,
      });
    }
  }

  componentWillMount() {
    this.setContent(this.props.isLoaded, this.props.group, this.props.post, this.props.pathState);
    this.balanceUpdateListener = Wallet.registerBalanceUpdateListener(() => {
      if (this.props.group) {
        this.updateUsers(this.props.group);
      }
    });
  }

  componentWillUnmount() {
    Wallet.unregisterBalanceUpdateListener(this.balanceUpdateListener);
  }

  componentWillReceiveProps(nextProps) {
    this.setContent(nextProps.isLoaded, nextProps.group, nextProps.post, nextProps.pathState);
  }

  renderPost() {
    if (this.props.isLoaded) {
      let post;
      if (this.props.pathState.isGroup) {
        post = this.state.group.getPost();
      } else if (this.state.post) {
        post = this.state.post;
      } else {
        return (
          <p style={styles.groupDesc}>Loading post...</p>
        );
      }
      return (
        <PostView key={post.id ? post.id : post.transactionId} sidebar={true} post={post} group={post.getGroup()} parent={this.props.pathState.parent} />
      );
    } else {
      return (
        <p style={styles.groupDesc}>Loading...</p>
      );
    }
  }

  joinGroup() {
    this.props.group.joinGroup().then(() => {
      console.log("successfully joined group!");
    }).catch((error) => {
      console.error("failed to join group:", error);
    });
  }

  leaveGroup() {
    this.props.group.leaveGroup().then(() => {
      console.log("successfully left group!");
    }).catch((error) => {
      console.error("failed to leave group:", error);
    });
  }

  renderUsers() {
    if (this.state.users) {
      return (this.state.users.map((user) => {
        const address = user.getAddress(); //user hasn't loaded yet, so this returns undefined
        let key = 'u' + this.props.pathState.cleanPath;
        if (!this.userViewMap[address]) {
          this.userViewMap[address] = user;
        }
        key = key + address;
        return (
          <UserView key={key} sidebar={true} user={user} group={this.props.group} />
        );
      }));
    } else {
      if (Array.isArray(this.state.users)) {
        return ("");
      } else {
        return ("Loading users...");
      }
    }
  }

  renderUsersAccordian() {
    return (
      <Collapsible
        triggerClassName="CustomTriggerCSS fa fa-chevron-right"
        triggerOpenedClassName="CustomTriggerCSS--open fa fa-chevron-down"
        contentOuterClassName="CustomOuterContentCSS"
        contentInnerClassName="CustomInnerContentCSS"
        transitionTime={200}
        easing="ease-in"
        trigger="Members"
      >
        {this.state.userCount} Member{this.state.userCount === 1 ? '' : 's'}
        {this.renderUsers()}
      </Collapsible>
    );
  }

  renderJoinButton() {
    if (!this.state.isLoaded || this.state.userInGroup === undefined) {
      return ('');
    }
    if (!this.state.userInGroup) {
      return (
        <button
          style={styles.joinButton}
          className={cx('button')}
          onClick={() => this.joinGroup()}
        >
          Join Group
        </button>
      );
    } else {
      return (
        <button
          style={styles.joinButton}
          className={cx('button')}
          onClick={() => this.leaveGroup()}
        >
          Leave Group
        </button>
      );
    }
  }

  render() {
    return (
      <div style={styles.container}>
        {this.renderPost()}
        {this.renderJoinButton()}
        {this.renderUsersAccordian()}

        <Collapsible
          triggerClassName="CustomTriggerCSS fa fa-chevron-right"
          triggerOpenedClassName="CustomTriggerCSS--open fa fa-chevron-down"
          contentOuterClassName="CustomOuterContentCSS"
          contentInnerClassName="CustomInnerContentCSS"
          transitionTime={200}
          easing="ease-in"
          trigger="Ruleset"
        >
          <p>Ruleset</p>
        </Collapsible>

        <Collapsible
          triggerClassName="CustomTriggerCSS fa fa-chevron-right"
          triggerOpenedClassName="CustomTriggerCSS--open fa fa-chevron-down"
          contentOuterClassName="CustomOuterContentCSS"
          contentInnerClassName="CustomInnerContentCSS"
          transitionTime={200}
          easing="ease-in"
          trigger="Content Types"
        >
          <p>Content Types</p>
        </Collapsible>
      </div>
    );
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
  joinButton: {
    textAlign: 'center',
    fontSize: 'medium',
    height: '5%',
    width: 'auto',
    paddingBottom: '20px',
    display: 'block',
    margin: '0 auto',
    marginBottom: '10px',
    cursor: 'pointer',
  },

};

export default SideBar;
