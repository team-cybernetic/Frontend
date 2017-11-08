import React, { Component } from 'react';
import registerServiceWorker from './registerServiceWorker';
import initializeApp from './initializeApp';
import NavigationBar from './components/NavigationBar';
import ChildrenView from './components/ChildrenView';
import SideBar from './components/SideBar';
import Editor from './components/Editor';
import GroupStore from './stores/GroupStore';
import PathParser, { Type } from './utils/PathParser';
import PropTypes from 'prop-types';
import TransactionConfirmationModal from './components/TransactionConfirmationModal';
import UserProfileSideBar from './components/UserProfileSideBar';
import UserProfileView from './components/UserProfileView';
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
      this.setState({
        error,
      });
    });
    registerServiceWorker();
  }

  render() {
    if (!this.state.error) {
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
    } else {
      return (
        <div style={styles.errorContainer}>
          <span style={styles.error}>
            {this.state.error.userMessage ? this.state.error.userMessage : this.state.error.message}
          </span>
        </div>
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
    if (!parsedPath.equals(this.state.pathState) && parsedPath.type === Type.POST) {
      let isGroupLoaded = this.state.pathState && parsedPath.sameGroup(this.state.pathState);
      this.setState({
        isGroupLoaded,
      });
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
          console.log("App was able to partially navigate to", errorState.partialPath.path, "instead of the desired", parsedPath.path);
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
      isLoaded: this.state.isGroupLoaded || this.state.pathState.type === Type.USER,
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
            {this.renderMainView(sharedState)}
            <Editor key={`editor-${pathState.cleanGroupPath}`} {...sharedState} />
          </div>
          {this.renderSidebar(sharedState)}
        </div>
      </div>
    );
  }

  renderMainView(sharedState) {
    if (sharedState.pathState.type === Type.USER) {
      return (
        <UserProfileView key={`user-profile-${sharedState.pathState.cleanGroupPath}`} {...sharedState} />
      );
    } else {
      return (
        <ChildrenView key={`children-${sharedState.pathState.cleanGroupPath}`} {...sharedState} />
      );
    }
  }

  renderSidebar(sharedState) {
    if (sharedState.pathState.type === Type.USER) {
      return (
        <UserProfileSideBar key={`user-profile-sidebar-${sharedState.pathState.cleanGroupPath}`} {...sharedState} />
      );
    } else {
      return (
        <SideBar key={`sidebar-${sharedState.pathState.cleanGroupPath}`} {...sharedState} />
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
  loader: {
    flex: 1,
    border: 0,
    fontSize: '3em',
    alignSelf: 'center',
  },
  errorContainer: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
  },
  error: {
    position: 'relative',
    top: '50%',
    transform: 'translateY(-50%)', 
  },
};
