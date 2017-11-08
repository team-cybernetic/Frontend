import React, { Component } from 'react';
import cx from 'classnames';
import Wallet from '../models/Wallet';
import { Type } from '../utils/PathParser';

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
          const user = group.getUser(userAddress);
          user.loadHeader().then(() => {
            console.log("Editor loaded user header:", user);
            if (this.userListener) {
              this.oldUser.unregisterUpdateListener(this.userListener);
            }
            this.userListener = user.registerUpdateListener(() => {
              console.log("Editor got user update:", user);
              this.setState({
                localBalance: user.getBalance().toLocaleString(),
              });
            });

            this.setState({
              localBalance: user.getBalance().toLocaleString(),
            });
          }).catch((error) => {
            console.error("Editor failed to load balance of self user", userAddress, ":", error);
          });
          this.oldUser = user;
        } else {
          console.log("Editor detect that self user", userAddress, "is not in group!");
        }
      }).catch((error) => {
        console.error("Editor failed to get status of self user", userAddress, ":", error);
      });
    }
  }

  componentWillMount() {
    this.walletListener = Wallet.registerBalanceUpdateListener((oldBalance, newBalance) => {
      this.forceUpdate();
    });
    this.getBalances(this.props.isLoaded, this.props.group);
  }

  componentWillReceiveProps(nextProps) {
    this.getBalances(nextProps.isLoaded, nextProps.group);
  }

  componentWillUnmount() {
    Wallet.unregisterBalanceUpdateListener(this.walletListener);
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
        <button
          style={styles.postButton}
          className={cx('button', {'is-loading': this.state.isPosting})}
          onClick={() => this.createPost()}
          disabled={!this.isValid()}
        >
          Post<br />
        {!this.hasContent() ? (this.isValid() ? "[title only]" : "") : ""}
        </button>
      </div>
      </div>
    );
  }

  placeholder() {
    if (this.isUserProfile()) {
      if (this.isOwnUserProfile()) {
        return 'Update your profile details.';
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
        console.error(error);
      }
      this.setState({
        isPosting: false,
      });
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
