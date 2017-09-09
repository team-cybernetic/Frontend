import React, { Component } from 'react';
import PostStore from '../stores/PostStore';
import WalletStore from '../stores/WalletStore';

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      content: '',
    }
  }

  render() {
    return (
      <div style={styles.container}>
        <button style={styles.btn_post} onClick={() => this.createPost()}>Post!</button>
        Title:
        <input
          type="text"
          style={styles.txt_title}
          value={this.state.title}
          onChange={(e) => this.updateField('title', e)} />
        <br />
        Content:
        <textarea
          style={styles.txt_content}
          value={this.state.content}
          onChange={(e) => this.updateField('content', e)} />
      </div>
    );
  }

  createPost() {
    PostStore.createPost(this.state.title, this.state.content).then((post) => {
      console.log(post);
    }).catch(console.error);
  }

  updateField(name, event) {
    this.setState({
      [name]: event.target.value,
    });
  }
}

const styles = {
  container: {
    height: '100px',
    backgroundColor: 'lightgray',
  },
  btn_post: {
    height: '100%',
    width: '90px',
    float: 'right',
  },
  txt_title: {
    width: '400px',
  },
  txt_content: {
    height: '50px',
    width: '400px',
  }

};

export default Editor;
