import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';

class NavigationBar extends Component {
  render() {
    return (
      <div style={styles.outerBar}>
        <div style={styles.groupTitleWrapper}>
          <span style={styles.groupTitle}>{this.getGroupTitle()}</span>
        </div>
        {this.renderIcon('plus')}
        {this.renderIcon('gear')}
      </div>
    );
  }

  getGroupTitle() {
    return (this.props.pathState.path);
    /*
    var url = this.props.path;
    if(url === undefined) {
      return 'root';
    }
    return url.substring(url.indexOf('-') + 1).trim();
    */
  }  

  renderIcon(name) {
    return (
      <FontAwesome style={styles.icon} name={name} />
    );
  }
}

const styles = {
  outerBar: {
    backgroundColor: 'lightgray',
    display: 'flex',
    flex: '1 1 auto',
    paddingRight: '8px',
    paddingLeft: '8px',
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
