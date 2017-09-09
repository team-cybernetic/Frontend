import React, { Component } from 'react';

class Post extends Component {
  render() {
    return (
      <div style={styles.container} className='card'>
        <div className='card-content'>
          <a href='#'>{this.props.post.title}</a>
          <br />
          {this.props.post.content}
        </div>
      </div>
    );
  }
}

const styles = {
  container: {
    width: '250px',
    margin: '20px',
    backgroundColor: 'white',
  },
};

export default Post;
