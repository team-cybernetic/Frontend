import React, { Component } from 'react';
import cx from 'classnames';
import Wallet from '../models/Wallet';
import { Type } from '../utils/PathParser';
import CyberneticChat from '../blockchain/CyberneticChat';
import UserStore from '../stores/UserStore';

const VALID_CONTENT_REGEX = /^\s*(\S.*)(\n\s*((.*\n?)+)\s*)?/;

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      textAreaValue: '',
      isPosting: false,
      localBalance: "",
    }
    this.userListener = null;
    this.oldUser = null;
  }

  getBalances(isLoaded, group) {
    if (isLoaded && !this.isUserProfile()) {
      const userAddress = Wallet.getAccountAddress();
      group.userExists(userAddress).then((exists) => {
        if (exists) {
          const userProperties = group.getUserProperties(userAddress);
          userProperties.load().then(() => {
            console.log("Editor loaded userProperties header:", userProperties);
            if (this.userListener) {
              this.oldUser.unregisterUpdateListener(this.userListener);
            }
            this.userListener = userProperties.registerUpdateListener(() => {
              console.log("Editor got userProperties update:", userProperties);
              this.setState({
                localBalance: userProperties.getBalance().toLocaleString(),
              });
            });

            this.setState({
              localBalance: userProperties.getBalance().toLocaleString(),
            });
          }).catch((error) => {
            console.error("Editor failed to load balance of self userProperties", userAddress, ":", error);
          });
          this.oldUser = userProperties;
        } else {
          console.log("Editor detect that self userProperties", userAddress, "is not in group!");
        }
      }).catch((error) => {
        console.error("Editor failed to get status of self userProperties", userAddress, ":", error);
      });
    }
  }

  componentWillMount() {
    this.walletListener = Wallet.registerBalanceUpdateListener((oldBalance, newBalance) => {
      this.forceUpdate();
    });
    this.getBalances(this.props.isLoaded, this.props.group);
    if (this.isOwnUserProfile()) {
      this.loadProfile(this.props.pathState.userAddress);
    }
  }

  componentWillReceiveProps(nextProps) {
    this.getBalances(nextProps.isLoaded, nextProps.group);
    if (!this.isOwnUserProfile() && nextProps.pathState.userAddress === Wallet.getAccountAddress()) {
      this.loadProfile(nextProps.pathState.userAddress);
    }
  }

  componentWillUnmount() {
    Wallet.unregisterBalanceUpdateListener(this.walletListener);
  }

  loadProfile(address) {
    this.setState({ user: UserStore.getUser(address) });
  }

  render() {
    return (
      <div style={styles.container0}>
        <div style={styles.container}>
          <div style={styles.earnings}>
            <p>Balances</p>
            <p style={styles.earningsText}>Global: <span className='is-pulled-right'>{this.getGlobalBalance()}</span></p>
            {!this.isUserProfile() && <p style={styles.earningsText}>Local: <span className='is-pulled-right'>{this.getLocalBalance()}</span></p>}
          </div>
          <textarea
            style={styles.textArea}
            className='textarea'
            placeholder={this.placeholder()}
            value={this.state.textAreaValue}
            onChange={(e) => this.changeContent(e)}
            disabled={this.isUserProfile() && !this.isOwnUserProfile()}
          />
          {this.renderButton()}
        </div>
      </div>
    );
  }

  renderButton() {
    if (this.isUserProfile()) {
      return (
        <button
          style={styles.postButton}
          className={cx('button', {'is-loading': this.state.isPosting})}
          onClick={() => this.updateProfile()}
          disabled={!this.isValid() || !this.isOwnUserProfile()}
        >
          Update
        </button>
      );
    } else {
      return (
        <button
          style={styles.postButton}
          className={cx('button', {'is-loading': this.state.isPosting})}
          onClick={() => this.createPost()}
          disabled={!this.isValid()}
        >
          Post<br />
          {!this.hasContent() ? (this.isValid() ? "[title only]" : "") : ""}
        </button>
      );
    }
  }

  placeholder() {
    if (this.isUserProfile()) {
      if (this.isOwnUserProfile()) {
        return 'Nickname\n[Profile description...]';
      } else {
        return 'Can\'t update someone else\'s profile.';
      }
    } else {
      return 'Clever Title\n[Witty content...]'
    }
  }

  isUserProfile() {
    return this.props.pathState.type === Type.USER;
  }

  isOwnUserProfile() {
    return this.props.pathState.userAddress === Wallet.getAccountAddress();
  }

  getGlobalBalance() {
    return (Wallet.getCurrentEthBalance().toFixed(6).toLocaleString());
  }

  getLocalBalance() {
    return (this.state.localBalance);
  }

  isValid() {
    return !!VALID_CONTENT_REGEX.exec(this.state.textAreaValue);
  }

  hasContent() {
    const matches = VALID_CONTENT_REGEX.exec(this.state.textAreaValue);
    return (matches && matches[3]) ? true : false;
  }

  createPost() {
    const matches = VALID_CONTENT_REGEX.exec(this.state.textAreaValue);
    const title = matches[1];
    const content = matches[3] ? matches[3] : '';
    const contentType = "text/plain";
    const userPermissionsFlagsMode = true; //TODO: flags or levels mode?
    this.setState({
      isPosting: true,
    });
    this.props.group.createPost({title: title.trim(), content, contentType, userPermissionsFlagsMode}).then((post) => {
      console.log("post created:", post);
      this.setState({
        textAreaValue: '',
        isPosting: false,
      });
    }).catch((error) => {
      if (error) {
        if (!error.cancel) {
          console.error(error);
        } else {
          console.log("User cancelled creating the post!");
        }
      }
      this.setState({
        isPosting: false,
      });
    });
  }

  updateProfile() {
    const matches = VALID_CONTENT_REGEX.exec(this.state.textAreaValue);
    const nickname = matches[1];
    const profile = matches[3] ? matches[3] : '';
    const profileMimeType = "text/plain";
    this.setState({ isPosting: true });
    this.state.user.updateProfile(nickname, profile, profileMimeType).then(() => {
      this.setState({
        isPosting: false,
        textAreaValue: '',
      });
    }).catch((error) => {
      console.error("Error updating profile.", error);
    });
  }

  changeContent(event) {
    this.setState({
      textAreaValue: event.target.value,
    });
  }
}

const styles = {
  container0: {
    backgroundColor: '#e6ecf0',
    height: '20%',
  },
  container: {
    height: '100%',
    backgroundColor: '#d7dce0',
    display: 'flex',
    flexFlow: 'row',
    border: '1px solid #aaafb2',
    marginRight: '1%',
  },
  earnings: {
    minWidth: '125px',
    maxWidth: '155px',
    textAlign: 'center',
    padding: '5px',
    flex: '0 1 18%',
  },
  earningsText: {
    textAlign: 'left',
    fontSize: '12px',
    margin: '2px',
  },
  postButton: {
    height: '100%',
    width: '10%',
    float: 'right',
  },
  textArea: {
    flex: 1,
    resize: 'none',
    height: '100%',
    minHeight: 'auto',
    maxHeight: 'none',
    minWidth: 'auto',
    maxWidth: 'none',
  }

};

export default Editor;
