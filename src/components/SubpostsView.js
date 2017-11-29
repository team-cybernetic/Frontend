/*
This file is part of Cybernetic Chat.

Cybernetic Chat is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Cybernetic Chat is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Cybernetic Chat.  If not, see <http://www.gnu.org/licenses/>.
*/


import React, { Component } from 'react';
import PostView from './PostView';
import { some } from 'lodash';
import { Scrollbars } from 'react-custom-scrollbars';

export default class SubpostsView extends Component {
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
      this.props.group.unregisterPostCreatedListener(this.listenerHandle);
      this.listenerHandle = null;
    }
  }

  loadPosts(isLoaded, group) {
    if (isLoaded) {
      if (!this.props.isLoaded) {
        if (!this.listenerHandle) {
          this.listenerHandle = group.registerPostCreatedListener((post) => this.addToPosts(post));
        }
        group.loadSubposts().then((posts) => {
          this.setState({
            posts: this.reorderPosts(posts)
          });
        });
      }
    }
  }

  render() {
    return (
      <Scrollbars style={styles.scrollBar}>
        <div style={styles.container}>
          <div style={styles.children}>
            {this.renderPosts()}
          </div>
        </div>
      </Scrollbars>
    );
  }

  renderPosts() {
    if (this.props.isLoaded && this.state.posts) {
      if (this.state.posts.length > 0) {
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
          <div style={styles.noPosts}>No comments or posts to see here.</div>
        );
      }
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
      return parseInt(post2.id, 10) - parseInt(post1.id, 10);
    });
  }

  alreadyHavePost(post) {
    return (!!post.id && some(this.state.posts, { id: post.id })) || (!!post.transactionId && some(this.state.posts, { transactionId: post.transactionId }));
  }
}

const styles = {
  container: {
    flex: '1 1 0%',
    height: '100%',
  },
  children: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    padding: '1%',
    paddingRight: 'calc(1% + 6px)',
    height: '100%',
//    minHeight: 'calc(100vh - 141px)', //TODO: this causes a permenant scroll down
  },
  scrollBar: {
    width: '100%',
    height: '96%',
    backgroundColor: '#e6ecf0',
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
  noPosts: {
    alignSelf: 'center',
    flex: 1,
    textAlign: 'center',
  },
};
