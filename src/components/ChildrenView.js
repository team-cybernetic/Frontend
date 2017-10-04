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
    console.log("children view mounting");
    this.listenerId = PostStore.addNewPostListener((newPost) => this.addToPosts(newPost));
  }

  componentWillUpdate(nextProps, nextState) {
      console.log("children view props updated -- getting posts");
    if (this.props.isLoading && !nextProps.isLoading) {
      console.log(nextProps);
      console.log(nextState);
      PostStore.getPosts().then((posts) => {
        this.setState({ posts });
      });
    }
  }

  componentWillUnmount() {
    console.log("children view unmounting");
    PostStore.removeNewPostListener(this.listenerId);
  }

  render() {
    return (
      <div style={styles.container}>
        {this.state.posts === null ? this.renderLoader() : this.renderPosts()}
      </div>
    );
  }

  renderPosts() {
    return (
      <div style={styles.children}>
        {this.renderChildren()}
      </div>
    );
  }

  renderChildren() {
    if (!this.props.isLoading) {
      return (this.state.posts.map((post) => {
        return (
          <Post key={this.props.pathState.groupPath + (post.id ? post.id : post.transactionId)} post={post} parent={this.props.pathState.groupPath} />
        );
      }));
    } else {
      return (
        <div style={styles.loading}>
          Loading...
        </div>
      );
    }
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
  loading: {
    margin: 'auto',
  },
};

export default ChildrenView;
