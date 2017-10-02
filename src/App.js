import React, { Component } from 'react';
import registerServiceWorker from './registerServiceWorker';
import initializeApp from './initializeApp';
import NavigationBar from './components/NavigationBar';
import ChildrenView from './components/ChildrenView';
import SideBar from './components/SideBar';
import Editor from './components/Editor';
import PostContract from './ethWrappers/PostContract';
import {
  BrowserRouter as Router,
  Route
} from 'react-router-dom';

export default class InitializationWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
    };
  }

  componentWillMount() {
    initializeApp().then(() => {
      this.setState({
        isLoading: false
      });
    }).catch((error) => {
      console.error("Error while initializing app:", error);
    });
    registerServiceWorker();
  }

  render() {
    if (this.state.isLoading) {
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
      isLoadingGroup: true,
    };
  }

  componentWillReceiveProps() {
    this.state = {
      isLoadingGroup: true,
    };
  }


  render() {
    if (this.state.isLoadingGroup) {
      var path = this.props.match.url;
      //var path = this.props.match.params.path;
      if (path === undefined || path === '' || typeof(path) !== 'string') {
        path = '/';
      } else if (!path.startsWith('/')) {
        path = '/' + path;
      }
      console.log("App path:", path);
      const PATH = /^(\/(.*\/)?)(.*)$/;
      let gm = PATH.exec(path);
      let groupPath = gm[1];
      let post = gm[3];
      let postNum;
      let postTitle;
      const PARENT = /^(.*\/).+\/?$/;
      let rm = PARENT.exec(path);
      let par;
      if(rm) {
        par = rm[1];
      }
      if (post) {
        const POST = /^([0-9]+)(-(.*))?$/;
        let pm = POST.exec(post);
        postNum = pm[1];
        postTitle = pm[3];
      }
      var pathState = {
        path,
        'parent': par,
        groupPath,
        isGroup: !postNum,
        post,
        postNum,
        postTitle,
      };
      console.log("pathState:", pathState);
      PostContract.navigateTo(groupPath).then((contractInstance) => {
        this.setState({
          isLoadingGroup: false,
          pathState,
        });
      });
      return (
        <div style={styles.container}>
          Loading group...
        </div>
      );
    } else {
      return (
        <div style={styles.container}>
          <NavigationBar key={`navbar-${path}`} pathState={this.state.pathState} />
          <div style={styles.content}>
            <div style={styles.childrenAndEditor}>
              <ChildrenView key={`children-${path}`} pathState={this.state.pathState} />
              <Editor key={`editor-${path}`} pathState={this.state.pathState} />
            </div>
            <SideBar key={`sidebar-${path}`} pathState={this.state.pathState} />
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
