import React, { Component } from 'react';
import xss from 'xss';
import moment from 'moment';
import { Link } from 'react-router-dom';
import Blockchain from '../ethWrappers/Blockchain';

export default class PostView extends Component {
  componentWillMount() {
    this.listenerHandle = this.props.post.registerUpdateListener((post) => {
      this.forceUpdate();
    });
  }

  componentWillUnmount() {
    this.props.post.unregisterUpdateListener(this.listenerHandle);
  }

  render() {
    if (this.props.post.isHeaderLoaded()) {
      return (
        <div style={this.styles.container} className='card'>
          <div style={this.styles.cardContent} className='card-content'>
            {this.renderTitle()}
            {this.renderTimestamp()}
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
    const { post, parent } = this.props;

    if (post && post.id) {
      const prefix = parent || '/';
      return prefix + post.id + '-' + encodeURIComponent(post.title.replace(' ', '-')) + '';
    }
    return '';
  }

  renderTitle() {
    return (
      <Link to={this.getTargetPath()}>{this.props.post.title}</Link>
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

  renderConvertToGroupButton() {
    if (!Blockchain.isAddressNull(this.props.post.groupAddress)) {
      return ('');
    }
    return (
      <button style={this.styles.joinButton} onClick={() => this.createGroup(this.props.post.id)}>Create group!</button>
    );
  }

  createGroup(id) {
    console.log('creating group on post', id);
    this.props.group.convertPostToGroup(id).then((result) => {
      console.log('successfully created group on post', id, ':', result);
      this.forceUpdate();
    });
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
      content = 'Loading content...';
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

  renderTimestamp() {
    let m = moment(this.props.post.creationTime, 'X');
    return (
      <span style={this.styles.timestamp}>
        <span style={this.styles.date}>
          Posted&nbsp;
          {m.calendar()} by <Link to={`/user/${this.props.post.creator}`}>{this.props.post.creator}</Link>
        </span>
      </span>
    );
  }

  get styles() {
    return {
      container:
        this.props.sidebar ? {
          width: '96%',
          marginLeft: '2%',
          marginRight: '2%',
          marginTop: '2%',
          marginBottom: '2%',
          backgroundColor: 'white',
        } : {
          width: '48%',
          marginLeft: '1%',
          marginRight: '1%',
          marginTop: '1%',
          marginBottom: '1%',
          backgroundColor: this.props.selected ? '#fdffea' : 'white',
          border: 0,
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
        color: '#858889',
        fontSize: 'x-small',
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
