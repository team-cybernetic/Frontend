import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';

class NavigationBar extends Component {
  render() {
    return (
      <div style={styles.outerBar}>
        {this.renderIcon('gear')}
        {this.renderIcon('bookmark')}
        {this.renderIcon('arrow-left')}
        {this.renderIcon('arrow-right')}
        {this.renderIcon('refresh')}
        {this.renderIcon('home')}
        <div style={styles.navbarContainer}>
          <input style={styles.navbarInput} type='text' />
        </div>
        {this.renderIcon('plus')}
      </div>
    );
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
  navbarContainer: {
      display: 'flex',
      flexGrow: '1',
      marginRight: '8px',
  },
  navbarInput: {
      marginTop: 'auto',
      marginBottom: 'auto',
      fontSize: 'large',
      width: '100%',
  }
};

export default NavigationBar;
