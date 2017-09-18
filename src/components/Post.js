import React, { Component } from 'react';
import xss from 'xss';
import moment from 'moment';

class Post extends Component {
  render() {
    return (
      <div style={styles.container} className='card'>
        <div style={styles.content} className='card-content'>
          <a href={'#' + this.props.post.title}>{this.props.post.title}</a><br />
          <span style={styles.date}>Posted {this.renderTimestamp()}</span><br />
          <hr />
          {this.renderContent()}
        </div>
      </div>
    );
  }

  renderContent() {
    const html = {
      __html: xss(this.props.post.ipfsHash).replace('\n', '<br />'),
    }
    return (
      <span dangerouslySetInnerHTML={html}></span>
    );
  }

  renderTimestamp() {
    let m = moment(this.props.post.creationTime, "X");
    return (m.calendar());
      /*
    let date = new Date(this.props.post.creationTime * 1000);
    return ("at " + date.getHours().padStart(2, "0") + ":" + date.getMinutes().padStart(2, "0") + ":" + date.getSeconds().padStart(2, "0")
        + " on " + date.getDate().padStart(2, "0") + "/" + (date.getMonth() + 1).padStart(2, "0") + "/" + date.getFullYear());
      */
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
  }
};

export default Post;
