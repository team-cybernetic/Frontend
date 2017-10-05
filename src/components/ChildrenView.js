import React, { Component } from 'react';
import Post from './Post';
//import PostStore from '../stores/PostStore';
import { some } from 'lodash';

class ChildrenView extends Component {
  constructor(props) {
    super(props);
    console.log("creating new children view");
    this.state = {
      posts: null,
    };
  }

  componentWillMount() {
    console.log("children view mounting");
    this.loadPosts(this.props.isLoaded, this.props.group);
    //TODO: add listener to group
    //this.listenerId = PostStore.addNewPostListener((newPost) => this.addToPosts(newPost));
  }

  componentWillReceiveProps(nextProps) {
    console.log("children view props updated -- getting posts");
    this.loadPosts(nextProps.isLoaded, nextProps.group);
  }

  componentWillUnmount() {
    console.log("children view unmounting");
    //TODO: remove listener from group
    //PostStore.removeNewPostListener(this.listenerId);
  }

  loadPosts(isLoaded, group) {
    if (isLoaded) {
      console.log("children view done loading, getting posts");
      group.getPosts().then((posts) => {
        console.log("children view got these posts from group:", posts);
        this.setState({ posts });
      });
    } else {
      console.log("children view still loading, not getting posts yet");
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
        if (this.props.post && (this.props.post.id === post.id))
          console.log("post", post.id, "should be selected");
        return (
          <Post key={'post-' + this.props.pathState.cleanGroupPath + (post.id ? post.id : post.transactionId)} post={post} selected={this.props.post && (this.props.post.id === post.id)} parent={this.props.pathState.groupPath} />
        );
      }));
    } else {
      return (
        <button style={styles.loader} className='button is-loading'></button>
      );
    }
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
