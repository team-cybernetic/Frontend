import React, { Component } from 'react';
import xss from 'xss';
import moment from 'moment';

class Post extends Component {
  render() {
    return (
      <div style={styles.container} className='card'>
        <div style={styles.content} className='card-content'>
          <a href={'#' + this.props.post.title}>{this.props.post.title}</a><br />
          {this.renderNumber()}<span style={styles.date}>Posted {this.renderTimestamp()}</span><br />
          {this.renderContent()}
        </div>
      </div>
    );
  }

  renderNumber() {
    return (
      <span style={styles.number}>
        #{this.props.post.number.toString(10)} --&nbsp;
      </span>
    );
  }

  renderContent() {
    let content = xss(this.props.post.content).replace(/\n/g, '<br />');
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
    let m = moment(this.props.post.creationTime, "X");
    return (m.calendar());
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
};

export default Post;
