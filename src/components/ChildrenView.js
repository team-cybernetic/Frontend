import React, { Component } from 'react';
import PostView from './PostView';
import { some } from 'lodash';

class ChildrenView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      posts: null,
    };
    this.listenerHandle = null;
  }

  componentWillMount() {
    this.loadPosts(this.props.isLoaded, this.props.group);
  }

  componentWillReceiveProps(nextProps) {
    this.loadPosts(nextProps.isLoaded, nextProps.group);
  }

  componentWillUnmount() {
    if (this.listenerHandle) {
      this.props.group.unregisterPostCreationListener(this.listenerHandle);
      this.listenerHandle = null;
    }
  }

  loadPosts(isLoaded, group) {
    if (isLoaded) {
      if (!this.props.isLoaded) {
        if (!this.listenerHandle) {
          this.listenerHandle = group.registerPostCreationListener((post) => this.addToPosts(post));
        }
        group.getChildren().then((posts) => {
          this.setState({
            posts: this.reorderPosts(posts)
          });
        });
      }
    }
  }

  render() {
    return (
      <div style={styles.container}>
        <div style={styles.children}>
          {this.renderPosts()}
        </div>
      </div>
    );
  }

  renderPosts() {
    if (this.props.isLoaded && this.state.posts) {
      return (this.state.posts.map((post) => {
        return (
          <PostView
            key={'post-' + this.props.pathState.cleanGroupPath + (post.id ? post.id : post.transactionId)}
            post={post}
            selected={this.props.post && (this.props.post.id === post.id)}
            group={this.props.group}
            parent={this.props.pathState.groupPath}
          />
        );
      }));
    } else {
      return (
        <button style={styles.loader} className='button is-loading'></button>
      );
    }
  }

  addToPosts(post) {
    console.log("childrenView adding to posts", post);
    if (!this.alreadyHavePost(post)) {
      let { posts } = this.state;
      if (posts === null) {
        posts = [];
      }
      posts.push(post);
      this.setState({
        posts: this.reorderPosts(posts)
      });
    } else {
      console.log("we already had this though");
    }
  }

  reorderPosts(posts) {
    return posts.sort((post1, post2) => {
      if (!post1.id) {
        return -1;
      } else if (!post2.id) {
        return 1;
      }
      return parseInt(post2.id) - parseInt(post1.id);
    });
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
    flexWrap: 'wrap',
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
