import React, { Component } from 'react';
import logo from './logo.svg';
import NavigationBar from './components/NavigationBar';
import ChildrenView from './components/ChildrenView';
import SideBar from './components/SideBar';
import Editor from './components/Editor';

class App extends Component {
  render() {
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
