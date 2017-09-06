import React, { Component } from 'react';

class ChildrenView extends Component {
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
    backgroundColor: 'gray',
  },
};

export default ChildrenView;
