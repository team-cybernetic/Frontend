/*
This file is part of Cybernetic Chat.

Cybernetic Chat is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Cybernetic Chat is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Cybernetic Chat.  If not, see <http://www.gnu.org/licenses/>.
*/


import React, { Component } from 'react';
import xss from 'xss';
import moment from 'moment';
import { Link } from 'react-router-dom';
import UpDownVoter from './UpDownVoter';

export default class PostView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0,
      countActive: false,
    };
  }

  componentWillMount() {
    this.listenerHandle = this.props.post.registerUpdateListener((post) => {
      console.log("PostView updated, post:", this.props.post);
      this.forceUpdate();
    });
    this.props.post.loadHeader().then(() => {
      const creator = this.props.post.getCreator();
      this.creatorListenerHandle = creator.registerProfileUpdateListener(() => {
        this.forceUpdate();
      });
      const parentGroup = this.props.post.getParentGroup();
      this.setState({
        parentGroup,
        creator,
      });
    }).catch((error) => {
      console.error("Error while loading header of post to get creator:", error);
    });
  }

  componentWillUnmount() {
    this.props.post.unregisterUpdateListener(this.listenerHandle);
    this.state.creator.unregisterProfileUpdateListener(this.creatorListenerHandle);
  }

  render() {
    if (this.props.post.isHeaderLoaded()) {
      return (
        <div style={this.styles.container} className='card'>
          <div style={this.styles.cardContent} className='card-content'>
            <div style={this.styles.postInfo}>
              <div style={this.styles.title}>
                {this.renderTitle()}
                {this.renderTimestamp()}
              </div>

              <UpDownVoter
                getBalance={() => {
                  return (
                    this.props.sidebar ?
                      this.props.post.getTokens().toString()
                    :
                      this.props.post.getBalance().toString()
                  );
                }}
                send={this.sendTip.bind(this)}
              />
            </div>
            <div style={this.styles.body}>
              {this.renderContent()}
            </div>
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
      return prefix + post.id + '-' + encodeURIComponent(post.title.replace(/ /g, '-')) + '';
    }
    return '';
  }

  renderTitle() {
    return (
      <div>
        <Link to={this.getTargetPath()}>{this.renderId()}</Link>&nbsp;-{this.getType()}-&nbsp;<Link to={this.getTargetPath() + '/'}>{this.props.post.title}</Link>
      </div>
    );
  }

  getType() {
    if (this.props.post.contentType) {
      var typeEnd = this.props.post.contentType.substring(this.props.post.contentType.indexOf('/') + 1);
      return (
        <span style={this.styles.type}>
          {typeEnd}
        </span>
      );
    } else {
      return (
        <span style={this.styles.type}>
           Pending...
        </span>
      );
    }
  }

  renderId() {
    if (this.props.post.id) {
      return (
        <span style={this.styles.number}>
          #{this.props.post.id}
        </span>
      );
    } else {
      return (
        <span style={this.styles.number}>
          Pending
        </span>
      );
    }
  }

  renderContent() {
    let content;
    let loaded = true;
    console.log("PostView rendering content: ", this.props.post.multiHashString);
    if (this.props.post.isContentLoaded()) {
      content = this.props.post.content;
    } else {
      content = 'Loading content...';
      loaded = false;
    }
    if (this.props.post.contentType.includes('image')) {
      let alt = "Loading image...";
      return (
        <div style={this.styles.contentWrapper}>
          <div style={this.styles.content}>
            <img
              src={content}
              alt={alt}
            />
          </div>
        </div>
      );
    } else if (this.props.post.contentType.includes('video')) {
      return (
        <div style={this.styles.contentWrapper}>
          <div style={this.styles.content}>
            <video width = "320" height = "240" controls
              src={content}
              type={this.props.post.contentType}
            >
              HTML5 video component not supported by your browser!
            </video>
          </div>
        </div>
      );
    } else if (this.props.post.contentType.includes('audio')) {
      return (
        <div style={this.styles.contentWrapper}>
          <div style={this.styles.content}>
            <audio controls
              src={content}
              type={this.props.post.contentType}
            >
              HTML5 audio component not supported by your browser!
            </audio>
          </div>
        </div>
      );
    } else if (this.props.post.contentType.includes('application')) {
      return (
        <div style={this.styles.contentWrapper}>
          <div style={this.styles.content}>
            <a href={content}>Download Content</a>
          </div>
        </div>
      );
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

  renderCreator() {
    let username = '';
    if (this.state.creator) {
      username = this.state.creator.getNickname();
      if (!username) {
        username = "Anonymous";
      }
    }
    return (
      <Link to={`/user/${this.props.post.creator}`}>
        {username} ({this.props.post.creator})
      </Link>
    );
  }


  renderTimestamp() {
    let m = moment(this.props.post.creationTime, 'X');
    return (
      <span style={this.styles.date}>
        Posted&nbsp;
        {m.calendar()} by {this.renderCreator()}
      </span>
    );
  }

  sendTip(amount, isPos) {
    let targetGroup = this.state.parentGroup;
    if (this.props.sidebar) {
      targetGroup = this.props.group;
    }
    console.log("Target group to send currency to:", targetGroup);
    targetGroup.sendPostCurrency(this.props.post.id, amount, isPos).then(() => {
      console.log("successfully " + (isPos ? "up" : "down") + "voted post #" + this.props.post.id + " in group " + targetGroup.getNumber() + " by " + amount + "!");
    }).catch((error) => {
      console.error("failed to send currency:", error);
    });
  }

  get styles() {
    return {
      container:
        this.props.sidebar ? {
          width: '96%',
          margin: '2%',
          backgroundColor: 'white',
        } : {
          width: '48%',
          margin: '1%',
          backgroundColor: this.props.selected ? '#fdffea' : 'white',
          border: 0,
        },
      postInfo: {
        display: 'flex',
        flexFlow: 'row',
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
      title: {
        display: 'flex',
        flexDirection: 'column',
        width: '90%',
      },
      votingContainer: {
        display: 'flex',
        marginLeft: '4px',
      },
      voting: {
        lineHeight: '20px',
        float: 'right',
        display: 'flex',
        flexDirection: 'column',
      },
      votingCountContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
      votingCount: {
        fontSize: 'small',
      },
      body: {
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '400px',
      },
      timestamp: {
        fontSize: 'small',
      },
      voteArrow: {
//        backgroundColor: this.props.selected ? '#fdffea' : 'white',
        border: 'none',
        textAlign: 'center',
        cursor: 'pointer',
      },
      balance: {
        textAlign: 'center',
        fontSize: 'small',
      },
      date: {
        color: '#858889',
        fontSize: 'x-small',
      },
      number: {
        fontSize: 'small',
      },
      type: {
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
      earnings: {
        minWidth: '125px',
        maxWidth: '155px',
        textAlign: 'center',
        padding: '5px',
        flex: '0 1 18%',
      },
      earningsText: {
        textAlign: 'left',
        fontSize: '12px',
        margin: '2px',
        // marginRight: '10%',
      },
      postButton: {
        height: '100%',
        width: '10%',
        float: 'right',
      },
      textArea: {
        flex: 1,
        resize: 'none',
        height: '100%',
        minHeight: 'auto',
        maxHeight: 'none',
        minWidth: 'auto',
        maxWidth: 'none',
      }
    }
  };
}
