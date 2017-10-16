import React, { Component } from 'react';
import registerServiceWorker from './registerServiceWorker';
import initializeApp from './initializeApp';
import NavigationBar from './components/NavigationBar';
import ChildrenView from './components/ChildrenView';
import SideBar from './components/SideBar';
import Editor from './components/Editor';
import GroupStore from './stores/GroupStore';
import PathParser from './utils/PathParser';
import PropTypes from 'prop-types';
import TransactionConfirmationModal from './components/TransactionConfirmationModal';
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
          <button style={styles.loader} className='button is-loading'></button>
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
  static contextTypes = {
    router: PropTypes.object
  };

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
      GroupStore.resolvePath(parsedPath).then(({group, post}) => {
        console.log("App successfully resolved path for", path, "with post:", post);
        this.setState({
          isGroupLoaded: true,
          group,
          post,
          pathState: parsedPath,
        });
      }).catch((errorState) => {
        if (errorState.partial) {
          console.log("App was able to partially navigate to", errorState.partialPath.path);
          this.context.router.history.replace({ pathname: errorState.partialPath.path });
          this.setState({
            isGroupLoaded: true,
            group: errorState.group,
            post: undefined,
            pathState: errorState.partialPath,
          });
        } else {
          console.error("App failed to navigate fully to", path, ":", errorState);
        }
      });
    }
    this.setState({
      pathState: parsedPath,
    });
  }

  componentWillMount() {
    this.browseTo(this.props.match.url);
    TransactionConfirmationModal.registerAppListener((transactionConfirmationInfo) => {
      transactionConfirmationInfo.closeModal = () => {
        this.setState({ transactionConfirmationInfo: null});
      }
      this.setState({ transactionConfirmationInfo });
    });
  }

  componentWillReceiveProps(nextProps) {
    this.browseTo(nextProps.match.url);
  }

  render() {
    const { group, post, pathState, transactionConfirmationInfo } = this.state;
    const sharedState = {
      isLoaded: this.state.isGroupLoaded,
      group,
      post,
      pathState,
    };

    return (
      <div style={styles.container}>
        {transactionConfirmationInfo && (
          <TransactionConfirmationModal {...transactionConfirmationInfo} />
        )}
        <NavigationBar key={`navbar-${pathState.path}`} {...sharedState} />
        <div style={styles.content}>
          <div style={styles.childrenAndEditor}>
            <ChildrenView key={`children-$pathState.cleanGroupPath}`} {...sharedState} />
            <Editor key={`editor-${pathState.cleanGroupPath}`} {...sharedState} />
          </div>
          <SideBar key={`sidebar-${pathState.cleanGroupPath}`} {...sharedState} />
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
  loader: {
    flex: 1,
    border: 0,
    fontSize: '3em',
    alignSelf: 'center',
  },
};
