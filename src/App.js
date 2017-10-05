import React, { Component } from 'react';
import registerServiceWorker from './registerServiceWorker';
import initializeApp from './initializeApp';
import NavigationBar from './components/NavigationBar';
import ChildrenView from './components/ChildrenView';
import SideBar from './components/SideBar';
import Editor from './components/Editor';
import GroupTree from './models/GroupTree';
import PathParser from './utils/PathParser';
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom';

export default class InitializationWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
    };
  }

  componentWillMount() {
    initializeApp().then(() => {
      this.setState({
        isLoaded: true
      });
    }).catch((error) => {
      console.error("Error while initializing app:", error);
    });
    registerServiceWorker();
  }

  render() {
    if (!this.state.isLoaded) {
      return (
        <div style={styles.container}>
          Loading App...
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

  constructor(props) {
    super(props);
    this.state = {
      isGroupLoaded: false,
      group: null,
      post: null,
      pathState: null,
    };
  }

  browseTo(path) {
    const parsedPath = PathParser.parse(path);
    if (!parsedPath.equals(this.state.pathState)) {
      let isGroupLoaded = this.state.pathState && parsedPath.sameGroup(this.state.pathState);
      if (this.state.pathState)
        console.log("App testing if", this.state.pathState.cleanGroupPath, "==", parsedPath.cleanGroupPath);
      this.setState({
        isGroupLoaded,
      });
      if (this.state.pathState)
        console.log("App testing if", this.state.pathState.cleanGroupPath, "==", parsedPath.cleanGroupPath, ":", parsedPath.sameGroup(this.state.pathState) ? 'true' : 'false', " -- which means that isGroupLoaded ==", isGroupLoaded ? 'true' : 'false');
      console.log("App path changed from", this.state.pathState, "to", parsedPath);
      GroupTree.getGroup(parsedPath).then(({group, post}) => {
        console.log("App successfully resolved group for", path, "with post:", post);
        this.setState({
          isGroupLoaded: true,
          group,
          post,
          pathState: parsedPath,
        });
      }).catch((errorState) => {
        //{error, group, partialPath} = errorState;
        //let error = errorState.error;
        let group = errorState.group;
        let partialPath = errorState.partialPath;
        console.log("App failed to navigate fully to", path, ":", errorState);
        this.setState({
          isGroupLoaded: true,
          group,
          post: undefined,
          pathState: partialPath,
        });
      });
    }
    this.setState({
      pathState: parsedPath,
    });
  }

  componentWillMount() {
    this.browseTo(this.props.match.url);
  }

  componentWillReceiveProps(nextProps) {
    this.browseTo(nextProps.match.url);
  }


  render() {
    return (
      <div style={styles.container}>
        <NavigationBar key={`navbar-${this.state.pathState.path}`} isLoaded={this.state.isGroupLoaded} group={this.state.group} post={this.state.post} pathState={this.state.pathState} />
        <div style={styles.content}>
          <div style={styles.childrenAndEditor}>
            <ChildrenView key={`children-${this.state.pathState.cleanGroupPath}`} isLoaded={this.state.isGroupLoaded} group={this.state.group} post={this.state.post} pathState={this.state.pathState} />
            <Editor key={`editor-${this.state.pathState.cleanGroupPath}`} isLoaded={this.state.isGroupLoaded} group={this.state.group} post={this.state.post} pathState={this.state.pathState} />
          </div>
          <SideBar key={`sidebar-${this.state.pathState.cleanGroupPath}`} isLoaded={this.state.isGroupLoaded} group={this.state.group} post={this.state.post} pathState={this.state.pathState} />
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
