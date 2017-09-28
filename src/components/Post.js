import React, { Component } from 'react';
import xss from 'xss';
import moment from 'moment';

class Post extends Component {


  constructor(props) {
    super(props);
    this.state = {
      post: props.post,
    };
  }

  render() {
    //console.log("rendering post #" + this.state.post.number);
    if (!this.state.post.ethMature) {
      //console.log("post #" + this.state.post.number, "is immature!");
      this.state.post.getPost.then((post) => {
        //console.log("resolved post:", post);
        this.setState({
          post: Object.assign({}, this.state.post, post, {ethMature: true}),
        });
        //console.log("this.state.post =", this.state.post);
      });
      return (
        <div style={styles.container} className='card'>
          <div style={styles.content} className='card-content'>
            {this.renderNumber()}Loading...
          </div>
        </div>
      );
    } else {
      if (!this.state.post.contentMature) {
        this.state.post.getContent.then((content) => {
          this.setState({
            post: Object.assign({}, this.state.post, {content, contentMature: true}),
          });
        });
      }
      //console.log("post #" + this.state.post.number, "is mature");
      return (
        <div style={styles.container} className='card'>
          <div style={styles.content} className='card-content'>
            <a href={'#' + this.state.post.title}>{this.state.post.title}</a><br />
            {this.renderNumber()}<span style={styles.date}>Posted {this.renderTimestamp()}</span><br />
            {this.renderCreator()}<br />
            {this.renderMultiHash()}
            {this.renderContent()}
          </div>
        </div>
      );
    }
  }

  renderCreator() {
    if (!this.state.post.contentMature) {
        <span style={styles.creator}>
          Loading...
        </span>
    } else {
      return (
        <span style={styles.creator}>
          Creator:&nbsp;{this.state.post.creator}
        </span>
      );
    }
  }

  renderMultiHash() {
    if (this.state.post.multiHash) {
      return (
        <span style={styles.multiHash}>
          IPFS:&nbsp;
          <a href={"https://ipfs.io/ipfs/" + this.state.post.multiHash} target="_blank" style={styles.multiHashIpfs}>
            {this.state.post.multiHash}
          </a>
        </span>
      );
    } else {
      return;
    }
  }

  renderNumber() {
    return (
      <span style={styles.number}>
        #{this.state.post.number.toString(10)} --&nbsp;
      </span>
    );
  }

  renderContent() {
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

  renderTimestamp() {
    let m = moment(this.state.post.creationTime, "X");
    return (m.calendar());
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      post: nextProps.post,
    });
  }
}

const styles = {
  container: {
    width: '250px',
    margin: '20px',
    backgroundColor: 'white',
  },
  content: {
//    maxHeight: '250px',
    display: 'block',
    overflowWrap: 'break-word',
//    overflow: 'hidden',
//    textOverflow: 'ellipsis',
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
  },
  creator: {
    fontSize: 'small',
  },
};

export default Post;
