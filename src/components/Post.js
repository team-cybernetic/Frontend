import React, { Component } from 'react';
import xss from 'xss';
import moment from 'moment';
import PostStore from '../stores/PostStore';

class Post extends Component {
  constructor(props) {
    super(props);
    this.state = {
      post: props.post,
    };
  }

  componentWillMount() {
    PostStore.addNewPostListener(this, (post) => {
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
    PostStore.removeNewPostListener(this);
  }

  render() {
    if (this.state.post.multiHashString) {
      return (
        <div style={styles.container} className='card'>
          <div style={styles.content} className='card-content'>
            <a href={'#' + this.state.post.title}>{this.state.post.title}</a><br />
            {this.renderId()}<span style={styles.date}>Posted {this.renderTimestamp()}</span><br />
            {this.renderCreator()}<br />
            {this.renderMultiHash()}
            {this.renderContent()}
          </div>
        </div>
      );
    } else {
      return (
        <div style={styles.container} className='card'>
          <div style={styles.content} className='card-content'>
            {this.renderId()}Loading...
          </div>
        </div>
      );
    }
  }

  renderCreator() {
    return (
      <span style={styles.creator}>
        Creator:&nbsp;{this.state.post.creator}
      </span>
    );
  }

  renderMultiHash() {
    if (this.state.post.contentType) {
      if (this.state.post.contentType === 'group') {
        return (
        <span style={styles.multiHash}>
          IPFS:&nbsp;
          <a href={"group"} target="_blank" style={styles.multiHashIpfs}>
            {this.state.post.multiHashString}
          </a>
        </span>
      );
      }
    }
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
    if (this.state.post.content === undefined || this.state.post.content === null) {
      return (
        <div>
          <span>
            Loading...
          </span>
        </div>
      );
    } else {
      let content = xss(this.state.post.content).replace(/\n/g, '<br />');
      const html = {
        __html: content,
      }
      return (
        <div>
          {content.length ? <hr /> : ''}
          <span dangerouslySetInnerHTML={html}></span>
        </div>
      );
    }
  }

  renderTimestamp() {
    let m = moment(this.state.post.creationTime, "X");
    return (m.calendar());
  }
}

const styles = {
  container: {
    width: '45%',
    marginLeft: '3%',
    marginRight: '1%',
    marginTop: '1.5%',
    marginBottom: '1.5%',
    backgroundColor: 'white',
  },
  content: {
    display: 'block',
    overflowWrap: 'break-word',
    overflowY: 'hidden',
    maxHeight: '500px',
  },
  date: {
    fontSize: 'small',
  },
  number: {
    fontSize: 'small',
  },
  multiHash: {
    fontSize: 'x-small',
  },
  multiHashIpfs: {
  },
  creator: {
    fontSize: 'small',
  },
};

export default Post;
