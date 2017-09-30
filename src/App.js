import React, { Component } from 'react';
import registerServiceWorker from './registerServiceWorker';
import initializeApp from './initializeApp';
import NavigationBar from './components/NavigationBar';
import ChildrenView from './components/ChildrenView';
import SideBar from './components/SideBar';
import Editor from './components/Editor';
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom';

export default class InitializationWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true
    };
  }

  componentWillMount() {
    initializeApp().then(() => {
      this.setState({
        isLoading: false
      });
    });
    registerServiceWorker();
  }

  render() {
    if (this.state.isLoading) {
      return (
        <div style={styles.container}>
          Loading...
        </div>
      );
    } else {
      return (
        <Router>
          <Route path="/:path*" component={App} />
        </Router>
      );
    }
  }
}

class App extends Component {
  render() {
    const path = this.props.match.params.path;
    return (
      <div style={styles.container}>
        <NavigationBar key={path} path={path} />
        <div style={styles.content}>
          <div style={styles.childrenAndEditor}>
            <ChildrenView key={path} path={path} />
            <Editor key={path} path={path} />
          </div>
          <SideBar key={path} path={path} />
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
