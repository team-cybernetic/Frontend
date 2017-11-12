import React, { Component } from 'react';
import xss from 'xss';
import moment from 'moment';
import { Link } from 'react-router-dom';
import Blockchain from '../blockchain/Blockchain';

export default class PostView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0,
      countActive: false,
    };
  }

  componentWillMount() {
    console.log("props post:", this.props.post);
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
          <div style={this.styles.cardContent}>
            <div style={this.styles.postInfo}>

              <div style={this.styles.title}>
                {this.renderTitle()}
                {this.renderTimestamp()}
              </div>

              <div style={this.styles.votingContainer}>
                <div style={this.styles.voting}>
                  {this.renderUpvote()}
                  {this.renderBalance()}
                  {this.renderDownvote()}
                </div>

                <div style={this.styles.votingCountContainer}>
                  <span style={this.styles.votingCount}>
                    {this.renderCount()}
                  </span>
                </div>
        
              </div>
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
      return prefix + post.id + '-' + encodeURIComponent(post.title.replace(' ', '-')) + '';
    }
    return '';
  }

  renderTitle() {
    return (
      <div>
        <Link to={this.getTargetPath()}>{this.renderId()}</Link>&nbsp;--&nbsp;<Link to={this.getTargetPath() + '/'}>{this.props.post.title}</Link>
      </div>
    );
  }

  renderUpvote() {
    return (

      <a 
        style={this.styles.voteArrow}
        onMouseDown={() => this.upvoteMouseDown()}
        onMouseUp={() => this.upvoteMouseUp()}
        onMouseOut={() => this.upvoteMouseOut()}
      >
        ▲
      </a>
    );
  }

  renderBalance() {
      return (
        <span style={this.styles.balance}>
          {this.props.post.balance.toString()}
        </span>
    );
  }

  renderCount() {
    if (this.state.countActive) {
      return (this.state.count >= 0 ? '+' : '') + this.state.count;
    }
  }

  renderDownvote() {
    return (
      <a
        style={this.styles.voteArrow}
        onMouseDown={() => this.downvoteMouseDown()}
        onMouseUp={() => this.downvoteMouseUp()}
        onMouseOut={() => this.downvoteMouseOut()}
      >
        ▼
      </a>
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

  vote(amount) {
    const isPos = amount >= 0;
    amount = Math.abs(amount);
    if (window.confirm("This transaction will cost you " + amount + " tokens, continue?") == false) {
        return;
    }
    this.props.group.sendPostCurrency(this.props.post.id, amount, isPos).then(() => {
      console.log("successfully " + (isPos ? "up" : "down") + "voted post #" + this.props.post.id + " by " + amount + "!");
    }).catch((error) => {
      console.error("failed to send currency:", error);
    });
  }

  changeCount(amount) {
    if (this.state.countActive) {
      console.log("counting active, changing count to", this.state.count + amount);
      this.setState({
        count: this.state.count + amount,
      });
      setTimeout(() => {
        this.changeCount(amount);
      }, 500);
    }
  }

  upvoteMouseDown() {
    //mouse down, reset count and begin counting up
    this.state.count = 0;
    this.state.countActive = true;
    this.changeCount(1);
  }

  upvoteMouseUp() {
    //mouse up over the element, send the tip
    this.state.countActive = false;
    this.vote(this.state.count);
    this.setState({
      count: 0,
    });
  }

  upvoteMouseOut() {
    //mouse out, stop counting, reset counter (cancelled)
    this.setState({
      count: 0,
      countActive: false,
    });
  }

  downvoteMouseDown() {
    //mouse down, reset count and begin counting up
    this.state.count = 0;
    this.state.countActive = true;
    this.changeCount(-1);
  }

  downvoteMouseUp() {
    //mouse up over the element, send the tip
    this.state.countActive = false;
    this.vote(this.state.count);
    this.setState({
      count: 0,
    });
  }

  downvoteMouseOut() {
    //mouse out, stop counting, reset counter (cancelled)
    this.setState({
      count: 0,
      countActive: false,
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
