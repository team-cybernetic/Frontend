import React, { Component } from 'react';
import xss from 'xss';
import moment from 'moment';
import { Link } from 'react-router-dom';

class Post extends Component {
  componentWillMount() {
    let post = this.props.post;
    post.waitForConfirmation().then(() => {
      this.forceUpdate();
      post.loadHeader().then(() => {
        this.forceUpdate();
        post.loadContent().then(() => {
          this.forceUpdate();
        });
      });
    });
    this.groupListenerHandle = this.props.group.registerNewGroupEventListener((error, result) => {
      console.log("NewGroup event:", error, result);
      if (!error) {
        let id = result.args.postNumber.toString();
        console.log("testing", id, "vs", this.props.post.id);
        if (id === this.props.post.id) {
          let addr = result.args.groupAddress;
          this.props.post.populate({ groupAddress: addr });
          this.forceUpdate();
        }
      }
    });
  }

  componentWillUnmount() {
    if (this.groupListenerHandle) {
      this.props.group.unregisterEventListener(this.groupListenerHandle);
    }
  }

  render() {
    if (this.props.post.isHeaderLoaded()) {
      return (
        <div style={this.styles.container} className='card'>
          <div style={this.styles.cardContent} className='card-content'>
            {this.renderTitle()}
            {this.renderTimestamp()}
            {this.renderCreator()}
            {this.renderGroup()}
            {this.renderMultiHash()}
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
    let post = this.props.post;

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

    return (parentPath + post.id + '-' + encodeURIComponent(this.props.post.title) + trailingSlash);
  }

  renderTitle() {
    return (
      <Link to={`${this.getTargetPath()}`}>{this.renderId()}{this.props.post.title}</Link>
    );
  }

  renderCreator() {
    return (
      <span style={this.styles.creator}>
        Creator:&nbsp;
        <span style={this.styles.creatorHash}>
          {this.props.post.creator}
        </span>
      </span>
    );
  }

  renderGroup() {
    return (
      <span style={this.styles.multiHash}>
        Group:&nbsp;
        <Link style={this.styles.multiHashIpfs} to={`${this.getTargetPath()}/`}>{this.props.post.groupAddress}</Link>{this.renderConvertToGroupButton()}
      </span>
    );
  }

  renderMultiHash() {
    if (this.props.post.multiHashString) {
      return (
        <span style={this.styles.multiHash}>
          IPFS:&nbsp;
          <a href={"https://ipfs.io/ipfs/" + this.props.post.multiHashString} target="_blank" style={this.styles.multiHashIpfs}>
            {this.props.post.multiHashString}
          </a>
        </span>
      );
    }
  }

  renderId() {
    if (this.props.post.id) {
      return (
        <span style={this.styles.number}>
          #{this.props.post.id} --&nbsp;
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
    if (this.props.post.isContentLoaded()) {
      content = this.props.post.content;
    } else {
      content = "Loading IPFS content...";
      loaded = false;
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

  renderConvertToGroupButton() {
    return (
    <button
        style={this.styles.joinButton}
        onClick={() => this.createGroup(this.props.post.id)}
        >+</button>
    );
  }

  createGroup(id) {
    console.log("creating group on post", id);
    this.props.group.convertPostToGroup(id).then((result) => {
      console.log("successfully created group on post", id, ":", result);
      this.forceUpdate(); 
    });
  }

  renderTimestamp() {
    let m = moment(this.props.post.creationTime, "X");
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
