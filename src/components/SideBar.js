import React, { Component } from 'react';

class SideBar extends Component {
  render() {
    return (
      <div style={styles.container}>
      </div>
    );
  }
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderLeft: '1px solid lightgrey',
  },
};

export default SideBar;
