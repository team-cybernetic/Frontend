import React, { Component } from 'react';
import cx from 'classnames';
import PostStore from '../stores/PostStore';

const VALID_CONTENT_REGEX = /([0-9A-z][0-9A-z ]*)\n(\S.*)/;

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      textAreaValue: '',
      isPosting: false,
    }
  }

  render() {
    return (
      <div style={styles.container}>
        <div style={styles.earnings}>
          <p>Earnings</p>
          <p style={styles.earningsText}>Global: <span className='is-pulled-right'>0.54kB</span></p>
          <p style={styles.earningsText}>Local: <span className='is-pulled-right'>0.54kB</span></p>
        </div>
        <textarea
          style={styles.textArea}
          className='textarea'
          placeholder={'Clever Title\nWitty content...'}
          value={this.state.textAreaValue}
          onChange={(e) => this.changeContent(e)} />
        <button
          style={styles.postButton}
          className={cx('button', {'is-loading': this.state.isPosting})}
          onClick={() => this.createPost()}
          disabled={!this.isValid()}
        >
          Post
        </button>
      </div>
    );
  }

  isValid() {
    return !!VALID_CONTENT_REGEX.exec(this.state.textAreaValue);
  }

  createPost() {
    const matches = VALID_CONTENT_REGEX.exec(this.state.textAreaValue);
    const title = matches[1];
    const content = matches[2];
    this.setState({
      isPosting: true,
    });
    PostStore.createPost(title.trim(), content).then((post) => {
      console.log(post);
      this.setState({
        textAreaValue: '',
        isPosting: false,
      });
    }).catch((error) => {
      console.error(error);
      this.setState({
        isPosting: false,
      });
    });
  }

  changeContent(event) {
    this.setState({
      textAreaValue: event.target.value,
    });
  }
}

const styles = {
  container: {
    height: '100px',
    backgroundColor: 'lightgray',
    display: 'flex',
    flexFlow: 'row',
  },
  earnings: {
    width: '100px',
    textAlign: 'center',
    padding: '2px',
  },
  earningsText: {
    textAlign: 'left',
    fontSize: '12px',
    margin: '2px',
  },
  postButton: {
    height: '100%',
    width: '90px',
    float: 'right',
  },
  textArea: {
    flex: 1,
    resize: 'none',
    height: '100px',
    minHeight: 'auto',
    maxHeight: 'none',
    minWidth: 'auto',
    maxWidth: 'none',
  }

};

export default Editor;
