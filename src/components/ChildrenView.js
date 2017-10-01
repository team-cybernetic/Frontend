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
    this.listenerId = PostStore.addNewPostListener((newPost) => this.addToPosts(newPost));
  }

  componentWillUnmount() {
    PostStore.removeNewPostListener(this.listenerId);
  }

  render() {
    return (
      <div style={styles.container}>
        {this.state.posts === null ? this.renderLoader() : this.renderPosts()}
      </div>
    );
  }

  renderChildren() {
    return (this.state.posts.map((post) => {
      return (
          <Post key={post.id ? post.id : post.transactionId} post={post} />
      );
    }));
  }

  renderPosts() {
    return (
      <div style={styles.children}>
        {this.renderChildren()}
      </div>
    );
  }

  renderLoader() {
    return (
      <button style={styles.loader} className='button is-loading'></button>
    );
  }

  addToPosts(post) {
    console.log('adding post');
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
    return (!!post.id && some(this.state.posts, { id: post.id })) || (!!post.transactionId && some(this.state.posts, { transactionId: post.transactionId }));
  }
}

const styles = {
  container: {
    overflowY: 'scroll',
    flex: '1 1 0%',
  },
  children: {
    display: 'flex',
    flexFlow: 'row-reverse',
    flexWrap: 'wrap-reverse',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
  },
  loader: {
    flex: 1,
    border: 0,
    fontSize: '3em',
    alignSelf: 'center',
  },
};

export default ChildrenView;
