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
      hasGroup: undefined,
      post,
      postNum,
      postTitle,
    };
    console.log("pathState:", pathState);
    if (this.state.isLoadingGroup) {
      PostContract.navigateTo(groupPath).then(({contract, num}) => {
        console.log("num = ", num);
        if (num) {
          console.log("post", num, "failed to resolve group, but we have its parent contract now:", contract);
          pathState.hasGroup = false;
        } else {
          if (pathState.isGroup) {
            pathState.hasGroup = true;
          } //undefined for a post
        }
        console.log("app navigated, setting loading = false");
        console.log("pathState passed:", pathState);
        this.setState({
          isLoadingGroup: false,
          pathState,
        });
      }).catch((error, instance, num) => {
        if (!error) {
        }
      });
    }
    return (
      <div style={styles.container}>
        <NavigationBar key={`navbar-${path}`} isLoading={this.state.isLoadingGroup} pathState={this.state.pathState} />
        <div style={styles.content}>
          <div style={styles.childrenAndEditor}>
            <ChildrenView key={`children-${path}`} isLoading={this.state.isLoadingGroup} pathState={this.state.pathState} />
            <Editor key={`editor-${path}`} isLoading={this.state.isLoadingGroup} pathState={this.state.pathState} />
          </div>
          <SideBar key={`sidebar-${path}`} isLoading={this.state.isLoadingGroup} pathState={this.state.pathState} />
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
