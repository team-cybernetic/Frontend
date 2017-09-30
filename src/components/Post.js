import React, { Component } from 'react';
import xss from 'xss';
import moment from 'moment';
import PostStore from '../stores/PostStore';
import { Link } from 'react-router-dom';

class Post extends Component {
  constructor(props) {
    super(props);
    this.state = {
      post: props.post,
    };
  }

  componentWillMount() {
    this.listenerId = PostStore.addNewPostListener((post) => {
      if (this.state.post.id === post.id) {
        this.setState({ post });
      }
    });
    if (this.state.post) {
      this.state.post.waitForFullCreation().then(() => this.forceUpdate());
      this.state.post.waitForHeaderLoad().then(() => this.forceUpdate());
      this.state.post.waitForContentLoad().then(() => this.forceUpdate());
    }
  }

  componentWillUnmount() {
    PostStore.removeNewPostListener(this.listenerId);
  }

  render() {
    if (this.state.post.multiHashString !== null) {
      return (
        <div style={styles.container} className='card'>
          <div style={styles.cardContent} className='card-content'>
            {this.renderTitle()}
            {this.renderTimestamp()}
            {this.renderCreator()}
            {this.renderMultiHash()}
            {this.renderContent()}
          </div>
        </div>
      );
    } else {
      return (
        <div style={styles.container} className='card'>
          <div style={styles.cardContent} className='card-content'>
            {this.renderId()}Loading...
          </div>
        </div>
      );
    }
  }

  getTargetPath(parentPath) {
    return ((parentPath ? (parentPath.endsWith('/') ? parentPath : parentPath + '/') : '/') + (this.state.post.id ? this.state.post.id : '0') + '-' + encodeURIComponent(this.state.post.title) + (this.state.post.groupAddress ? '/' : ''));
  }

  renderTitle() {
    return (
      <Link to={`${this.getTargetPath()}`}>{this.renderId()}{this.state.post.title}</Link>
    );
  }

  renderCreator() {
    return (
      <span style={styles.creator}>
        Creator:&nbsp;
        <span style={styles.creatorHash}>
          {this.state.post.creator}
        </span>
      </span>
    );
  }

  renderMultiHash() {
    if (this.state.post.multiHashString) {
      return (
        <span style={styles.multiHash}>
          IPFS:&nbsp;
          <a href={"https://ipfs.io/ipfs/" + this.state.post.multiHashString} target="_blank" style={styles.multiHashIpfs}>
            {this.state.post.multiHashString}
          </a>
        </span>
      );
    }
  }

  renderId() {
    if (this.state.post.id) {
      return (
        <span style={styles.number}>
          #{this.state.post.id} --&nbsp;
        </span>
      );
    } else {
      return (
        <span style={styles.number}>
          Pending --&nbsp;
        </span>
      );
    }
  }

  renderContent() {
    let content;
    let loaded = true;
    if (this.state.post.content === undefined || this.state.post.content === null) {
      content = "Loading...";
      loaded = false;
    } else {
      content = this.state.post.content;
    }
    content = xss(content).replace(/\n/g, '<br />');
    if (content.length) {
      const html = {
        __html: content,
      }
      return (
        <div style={styles.contentWrapper}>
          {loaded ? <hr style={styles.contentHr}/> : ''}
          <div style={styles.content}>
            <span dangerouslySetInnerHTML={html}></span>
          </div>
        </div>
      );
    }
  }

  renderTimestamp() {
    let m = moment(this.state.post.creationTime, "X");
    return (
      <span style={styles.timestamp}>
        Posted&nbsp;
        <span style={styles.date}>
          {m.calendar()}
        </span>
      </span>
    );
  }
}

const styles = {
  container: {
    width: '46%',
    marginLeft: '2%',
    marginRight: '2%',
    marginTop: '1.5%',
    marginBottom: '1.5%',
    backgroundColor: 'white',
  },
  contentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    overflowY: 'auto',
    minHeight: '0px',
    flex: 1,
  },
  contentHr: {
    flexShrink: 0,
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    overflowWrap: 'break-word',
    maxHeight: '500px',
    padding: '1rem',
  },
  timestamp: {
    fontSize: 'small',
  },
  date: {
    fontSize: 'small',
  },
  number: {
    fontSize: 'small',
  },
  multiHash: {
    fontSize: 'small',
  },
  multiHashIpfs: {
    fontSize: 'x-small',
  },
  creator: {
    fontSize: 'small',
  },
  creatorHash: {
    fontSize: 'x-small',
  },
};

export default Post;
