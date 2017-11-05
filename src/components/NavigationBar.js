import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import { Link } from 'react-router-dom';

class NavigationBar extends Component {
  render() {
    return (
      <div style={styles.outerBar}>
        <div style={styles.groupTitleWrapper}>
          <span style={styles.groupTitle}>{this.getGroupTitle()}</span>
        </div>
        {this.renderParentButton()}
        {this.renderIcon('plus')}
        {this.renderIcon('gear')}
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
};

export default NavigationBar;
