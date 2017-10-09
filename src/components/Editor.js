import React, { Component } from 'react';
import cx from 'classnames';

const VALID_CONTENT_REGEX = /^\s*(\S.*)(\n\s*((.*\n?)+)\s*)?/;

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
          <p style={styles.earningsText}>Local: <span className='is-pulled-right'>0.12kB</span></p>
        </div>
        <textarea
          style={styles.textArea}
          className='textarea'
          placeholder={'Clever Title\n[Witty content...]'}
          value={this.state.textAreaValue}
          onChange={(e) => this.changeContent(e)} />
        <button
          style={styles.postButton}
          className={cx('button', {'is-loading': this.state.isPosting})}
          onClick={() => this.createPost()}
          disabled={!this.isValid()}
        >
          Post<br />
        {!this.hasContent() ? (this.isValid() ? "[title only]" : "") : ""}
        </button>
      </div>
    );
  }

  isValid() {
    return !!VALID_CONTENT_REGEX.exec(this.state.textAreaValue);
  }

  hasContent() {
    const matches = VALID_CONTENT_REGEX.exec(this.state.textAreaValue);
    return (matches && matches[3]) ? true : false;
  }

  createPost() {
    const matches = VALID_CONTENT_REGEX.exec(this.state.textAreaValue);
    const title = matches[1];
    const content = matches[3] ? matches[3] : '';
    const contentType = "text/plain";
    this.setState({
      isPosting: true,
    });
    this.props.group.createPost({title: title.trim(), content, contentType}).then((post) => {
      console.log("post created:", post);
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
//    whiteSpace: 'normal',
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
