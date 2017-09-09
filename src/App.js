import React, { Component } from 'react';
import NavigationBar from './components/NavigationBar';
import ChildrenView from './components/ChildrenView';
import SideBar from './components/SideBar';
import Editor from './components/Editor';

class App extends Component {
  render() {
    if (this.props.isLoading) {
      return (
        <div style={styles.container}>
          Loading...
        </div>
      );
    } else {
      return (
        <div style={styles.container}>
          <NavigationBar />
          <div style={styles.content}>
            <div style={styles.childrenAndEditor}>
              <ChildrenView />
              <Editor />
            </div>
            <SideBar />
          </div>
        </div>
      );
    }
  }
}

const styles = {
  container: {
    display: 'flex',
    flexFlow: 'column',
    height: '100%',
  },
  content: {
    display: 'flex',
    flexFlow: 'row',
    height: '100%',
  },
  childrenAndEditor: {
    display: 'flex',
    flexFlow: 'column',
    width: '70%',
  },
};

export default App;
