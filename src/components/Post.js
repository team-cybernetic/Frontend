import React, { Component } from 'react';
import xss from 'xss';

class Post extends Component {
  render() {
    return (
      <div style={styles.container} className='card'>
        <div style={styles.content} className='card-content'>
          <a href='#'>{this.props.post.title}</a>
          <br />
          {this.renderContent()}
        </div>
      </div>
    );
  }

  renderContent() {
    const html = {
      __html: xss(this.props.post.content).replace('\n', '<br />'),
    }
    return (
      <span dangerouslySetInnerHTML={html}></span>
    );
  }
}

const styles = {
  container: {
    width: '250px',
    margin: '20px',
    backgroundColor: 'white',
  },
  content: {
    maxHeight: '250px',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

export default Post;
