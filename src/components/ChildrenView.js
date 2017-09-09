import React, { Component } from 'react';
import Post from './Post';
import PostStore from '../stores/PostStore';
import { some } from 'lodash';

class ChildrenView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      posts: null,
    };
  }

  componentWillMount() {
    PostStore.getPosts().then((posts) => {
      this.setState({ posts });
    });
    PostStore.addNewPostListener(this, (newPost) => this.addToPosts(newPost))
  }

  componentWillUnmount() {
    PostStore.removeNewPostListener(this);
  }

  render() {
    return (
      <div style={styles.container}>
        {this.state.posts === null ? this.renderLoader() : this.renderPosts()}
      </div>
    );
  }

  renderPosts() {
    return this.state.posts.map((post) => {
      return (
        <Post key={post.title} post={post} />
      );
    })
  }

  renderLoader() {
    return (
      <button style={styles.loader} className='button is-loading'></button>
    );
  }

  addToPosts(post) {
    if (!this.alreadyHavePost(post)) {
      let { posts } = this.state;
      if (posts === null) {
        posts = [];
      }
      posts.push(post);
      this.setState({ posts });
    }
  }

  alreadyHavePost(post) {
    return some(this.state.posts, { title: post.title });
  }
}

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexFlow: 'row',
    flexWrap: 'wrap',
    overflowY: 'auto',
    alignItems: 'flex-start',
  },
  loader: {
    flex: 1,
    border: 0,
    fontSize: '3em',
    alignSelf: 'center',
  },
};

export default ChildrenView;
