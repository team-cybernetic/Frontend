import React, { Component } from 'react';
import UserView from './UserView';
import Collapsible from 'react-collapsible';
import './style.css';
import cx from 'classnames';

class UserProfileSidebar extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div style={styles.container}>
        {this.renderStats()}
      </div>
    );
  }

  renderStats() {
    return (
      <div style={styles.stats}>
        <div>User since 2017</div>
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
};

export default UserProfileSidebar;
