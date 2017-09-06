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
        <input type='text' />
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
  },
  icon: {
    padding: '16px 5px',
    fontSize: '1.3em',
  },
};

export default NavigationBar;
