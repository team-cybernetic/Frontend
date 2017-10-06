import React, { Component } from 'react';
import xss from 'xss';
import moment from 'moment';
import { Link } from 'react-router-dom';

class Post extends Component {
  constructor(props) {
    super(props);
    this.state = {
      post: props.post,
    };
  }

  componentWillMount() {
    this.props.post.loadHeader().then(() => this.forceUpdate());
    this.props.post.loadContent().then(() => this.forceUpdate());
    /*
     //TODO
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
    */
  }

  componentWillUnmount() {
    //TODO
    //PostStore.removeNewPostListener(this.listenerId);
  }

  render() {
    if (this.state.post.multiHashString !== null) {
      return (
        <div style={this.styles.container} className='card'>
          <div style={this.styles.cardContent} className='card-content'>
            {this.renderTitle()}
            {this.renderTimestamp()}
            {this.renderCreator()}
            {this.renderMultiHash()}
            {this.renderGroup()}
            {this.renderButton()}
            {this.renderContent()}
          </div>
        </div>
      );
    } else {
      return (
        <div style={this.styles.container} className='card'>
          <div style={this.styles.cardContent} className='card-content'>
            {this.renderId()}Loading...
          </div>
        </div>
      );
    }
  }

  getTargetPath() {
    let post = this.state.post;

    if (!post) {
      return;
    }

    if (!post.id) {
      return;
    }

    var parentPath = this.props.parent;
    if (!parentPath) {
      parentPath = '/';
    }

    var trailingSlash = '';
    /*
    if (!!this.state.post.groupAddress && this.state.post.groupAddress !== '0x' && this.state.post.groupAddress !== '0x0000000000000000000000000000000000000000') {
      trailingSlash = '/';
    }
    */

    return (parentPath + post.id + '-' + encodeURIComponent(this.state.post.title) + trailingSlash);
  }

  renderTitle() {
    return (
      <Link to={`${this.getTargetPath()}`}>{this.renderId()}{this.state.post.title}</Link>
    );
  }

  renderCreator() {
    return (
      <span style={this.styles.creator}>
        Creator:&nbsp;
        <span style={this.styles.creatorHash}>
          {this.state.post.creator}
        </span>
      </span>
    );
  }

  renderGroup() {
    return (
      <span style={this.styles.multiHash}>
        Group:&nbsp;
        <Link style={this.styles.multiHashIpfs} to={`${this.getTargetPath()}/`}>{this.state.post.groupAddress}</Link>
      </span>
    );
  }

  renderMultiHash() {
    if (this.state.post.multiHashString) {
      return (
        <span style={this.styles.multiHash}>
          IPFS:&nbsp;
          <a href={"https://ipfs.io/ipfs/" + this.state.post.multiHashString} target="_blank" style={this.styles.multiHashIpfs}>
            {this.state.post.multiHashString}
          </a>
        </span>
      );
    }
  }

  renderId() {
    if (this.state.post.id) {
      return (
        <span style={this.styles.number}>
          #{this.state.post.id} --&nbsp;
        </span>
      );
    } else {
      return (
        <span style={this.styles.number}>
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
        <div style={this.styles.contentWrapper}>
          {loaded ? <hr style={this.styles.contentHr}/> : ''}
          <div style={this.styles.content}>
            <span dangerouslySetInnerHTML={html}></span>
          </div>
        </div>
      );
    }
  }

  renderButton() {
    return (
    <button
        style={this.styles.joinButton}
        onClick={() => this.createGroup(this.state.post.id)}
        > Convert To Group </button>
    );
  }

  createGroup(id) {
    console.log(id);
    this.props.group.convertPostToGroup(id).then((result) => {
      console.log(result);
      this.forceUpdate(); 
    });
  }

  renderTimestamp() {
    let m = moment(this.state.post.creationTime, "X");
    return (
      <span style={this.styles.timestamp}>
        Posted&nbsp;
        <span style={this.styles.date}>
          {m.calendar()}
        </span>
      </span>
    );
  }

  get styles() {
    return {
      container:
        this.props.sidebar ?
        {
          width: '96%',
          marginLeft: '2%',
          marginRight: '2%',
          marginTop: '1.5%',
          marginBottom: '1.5%',
          backgroundColor: 'white',
        }
        :
        {
          width: '46%',
          marginLeft: '2%',
          marginRight: '2%',
          marginTop: '1.5%',
          marginBottom: '1.5%',
          backgroundColor: this.props.selected ? 'yellow' : 'white',
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
    }
  };
}

export default Post;
