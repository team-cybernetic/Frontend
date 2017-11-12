import React, { Component } from 'react';
import PostView from './PostView';
import UserView from './UserView';
import Collapsible from 'react-collapsible';
import Wallet from '../models/Wallet'
import './style.css';
import cx from 'classnames';
import { some, compact } from 'lodash';

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

  updateBalance(group) {
    group.loadTokens().then((tokens) => {
      console.log("Sidebar got group tokens:", tokens);
      this.setState({
        tokens: tokens.toLocaleString(),
      });
    });
  }

  setContent(isLoaded, group, post, pathState) {
    if (isLoaded) {
      if (this.props.isLoaded) {
        return; //went from loaded -> loaded, no update
      }
      this.updateBalance(group);
      group.registerTokensChangedListener(() => {
        this.updateBalance(group);
      });
      group.loadUsers().then((users) => {
        if (users) {
          users.forEach((user, idx) => {
            console.log("user[" + idx + "]:", user);
            //TODO: this blocks until ALL the users are loaded, make it dynamically grow the list?
            const userProperties = user.getProperties(group.getNumber());
            userProperties.load().then(() => {
              let userInGroup = some(users, (user) => {
                let walletAddr = Wallet.getAccountAddress();
                let userAddr = user.getAddress();
                return (walletAddr === userAddr);
              });
              this.setState({
                userInGroup: this.userInGroup || userInGroup,
              });
            });
          });
        } else {
          console.log("no users!");
          users = [];
        }
        this.setState({
          users,
          userCount: compact(users).length,
        });
      }).catch((error) => {
        console.error("Sidebar: error while loading users list for group", group.getNumber(), ":", error);
      });
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
  }

  componentWillReceiveProps(nextProps) {
    this.setContent(nextProps.isLoaded, nextProps.group, nextProps.post, nextProps.pathState);
  }

  renderPost() {
    if (this.props.isLoaded) {
      if (this.props.pathState.isGroup) {
        console.log("sidebar render group TODO");
      } else if (this.state.post) {
        let post = this.state.post;
        return (
          <PostView key={post.id ? post.id : post.transactionId} sidebar={true} post={post} parent={this.props.pathState.parent} />
        );
      } else {
        return (
          <p style={styles.groupDesc}>Loading post...</p>
        );
      }
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
        {this.renderUsers()}
      </Collapsible>
    );
  }

  renderJoinButton() {
    if (!this.state.isLoaded) {
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

  renderStats() {
    if (!this.state.isLoaded) {
      return ('');
    }
    return (
      <div style={styles.stats}>
        {this.state.userCount} Member{this.state.userCount === 1 ? '' : 's'} / {this.state.tokens} Earnings
      </div>
    );
  }

  render() {
    return (
      <div style={styles.container}>
        {this.renderPost()}
        {this.renderStats()}
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
