import React, { Component } from 'react';

class Editor extends Component {
    render() {
        return (
            <div style={styles.container}>
                <button id="post" style={styles.btn_post}>Post!</button>
                Title: <input type="text" id="title" style={styles.txt_title} /><br />
                Content: <textarea id="content" style={styles.txt_content} />
            </div>
        );
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
