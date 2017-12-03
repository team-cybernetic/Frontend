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
import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router-dom';
import Wallet from '../models/Wallet';

class NavigationBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userAccountMenuOpen: false,
    };
  }

  render() {
    return (
      <div style={styles.outerBar}>
        <div style={styles.groupTitleWrapper}>
          <span style={styles.groupTitle}>{this.getGroupTitle()}</span>
        </div>
        {this.renderParentButton()}
        {this.renderUserButton()}
        {this.renderUserAccountMenu()}
      </div>
    );
  }

  parentPath() {
    if (!this.props.isLoaded || !this.props.pathState.parent) {
      return '';
    } else {
      return this.props.pathState.parent;
    }
  }

  renderParentButton() {
    return (
      <Link to={`${this.parentPath()}`} >{this.renderIcon('level-up')}</Link>
    );
  }

  renderUserButton() {
    return (
      <Link to='#' onClick={() => this.toggleUserAccountMenu()}>{this.renderIcon('user')}</Link>
    );
  }

  renderUserAccountMenu() {
    if (this.state.userAccountMenuOpen) {
      return (
        <div style={styles.userAccountMenu}>
          {Wallet.accounts.sort('address').map((user) => {
            return (
              <div key={user.address}
                   onClick={() => this.switchCurrentUser(user)}
                   style={styles.userAccountItem(user.address === Wallet.getAccountAddress())}>{user.nickname ? user.nickname : user.address}</div>
            );
          })}
        </div>
      );
    }
    return null;
  }

  getGroupTitle() {
    if (this.props.isLoaded) {
      return this.props.pathState.titleOnlyPath || this.props.pathState.path;
    } else {
      return "Loading...";
    }
  }

  renderIcon(name) {
    return (
      <FontAwesome style={styles.icon} name={name} />
    );
  }

  toggleUserAccountMenu() {
    this.setState({ userAccountMenuOpen: !this.state.userAccountMenuOpen });
  }

  switchCurrentUser(user) {
    this.setState({ userAccountMenuOpen: false });
    Wallet.switchCurrentUser(user);
  }
}

const styles = {
  outerBar: {
    backgroundColor: 'white',
    display: 'flex',
    flex: '1 1 auto',
    paddingRight: '8px',
    paddingLeft: '8px',
    borderBottom: '1px solid #aaafb2'
  },
  icon: {
    padding: '16px 5px',
    fontSize: '1.3em',
  },
  groupTitleWrapper: {
    display: 'flex',
    flexGrow: '1',
    justifyContent: 'center',
  },
  groupTitle: {
    textAlign: 'center',
    fontSize: 'x-large',
    fontWeight: 'bold',
    margin: '4px',
  },
  userAccountMenu: {
    position: 'absolute',
    right: 0,
    top: '49px',
    zIndex: 2,
    border: '1px solid gray',
    boxShadow: '-1px 2px 1px #888888',
  },
  userAccountItem: (highlighted) => {
    return {
      width: '200px',
      fontSize: '16px',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      cursor: 'pointer',
      padding: '3px 5px',
      backgroundColor: highlighted ? 'lightyellow' : 'white',
    }
  }
};

export default NavigationBar;
