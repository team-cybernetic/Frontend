import React, { Component } from 'react';
import Post from './Post';
import Collapsible from 'react-collapsible';
import PostStore from '../stores/PostStore';
import './style.css';

class SideBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      post: null,
    };
  }

  componentWillUpdate(nextProps, nextState) {
    console.log("sidebar next state:", nextState, this.state);
    if (!nextState.post && !this.state.post) {
      console.log("sidebar next props:", nextProps);
      if (nextProps.isLoading) {
        console.log("sidebar loading");
      } else {
        console.log("sidebar loaded");
        if (nextProps.pathState.isGroup) {
          console.log("sidebar loading group");
        } else {
          console.log("sidebar loading post");
          let post = PostStore.getPost(nextProps.pathState.postNum);
          post.waitForContentLoad().then(() => {
            console.log("sidebar post loaded");
            this.setState({ post });
          });
        }
      }
    }
  }

  renderPost() {
    if (this.props.isLoading) {
      console.log("sidebar render loading");
      return (
        <p style={styles.groupDesc}>Loading...</p>
      );
    } else {
      if (this.props.pathState.isGroup) {
        console.log("sidebar render group TODO");
      } else if (this.state.post) {
        console.log("sidebar render post");
        let post = this.state.post;
        return (
          <Post key={post.id ? post.id : post.transactionId} sidebar={true} post={post} parent={this.props.pathState.parent} />
        );
      } else {
        console.log("sidebar render loading post");
        return (
          <p style={styles.groupDesc}>Loading post...</p>
        );
      }
    }
  }

  getPostContent() {
    if (this.props.isLoading) {
      return ("Loading...");
    } else {
      let id = this.props.pathState.postNum;
      if (id) {
        console.log("sidebar rendering post:", id);
        /*
        content = xss(content).replace(/\n/g, '<br />');
        if (content.length) {
          const html = {
            __html: content,
          }
          return (
            <div style={styles.contentWrapper}>
              {loaded ? <hr style={styles.contentHr}/> : ''}
              <div style={styles.content}>
              <span dangerouslySetInnerHTML={html}></span>
              </div>
              </div>
          );
        }
        */

      } else {
        console.log("sidebar not rendering a post, rendering group:", this.props.pathState.group);
      }
    }
    return ("TODO");
  }

  render() {
    return (
      <div style={styles.container}>
        { /*<p style={styles.groupDesc}>{this.getPostContent()}</p>*/ }
        {this.renderPost()}
        <p style={styles.groupDesc}>x Members / x Earnings</p>

        <button
        style={styles.joinButton}
        onClick={() => this.testMethod()}
        > Join Group </button>


    <Collapsible
    triggerClassName="CustomTriggerCSS"
    triggerOpenedClassName="CustomTriggerCSS--open"
    contentOuterClassName="CustomOuterContentCSS"
    contentInnerClassName="CustomInnerContentCSS"
    transitionTime={200}
    easing="ease-in"
    trigger="Members">
            { /* To be populated with actual data */ }
      <p>Admin <br />User <br />User<br />User<br />User<br />User<br />User<br />User<br />User<br />User<br />User<br />User<br />User<br />User<br />User</p>
    </Collapsible>

    <Collapsible
    triggerClassName="CustomTriggerCSS"
    triggerOpenedClassName="CustomTriggerCSS--open"
    contentOuterClassName="CustomOuterContentCSS"
    contentInnerClassName="CustomInnerContentCSS"
    transitionTime={200}
    easing="ease-in"
    trigger="Ruleset">
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis sed nisi diam. Suspendisse pulvinar ipsum facilisis, blandit nisi sit amet, ornare risus. Suspendisse enim sapien, viverra sit amet pharetra in, efficitur in sapien.</p>
    </Collapsible>

    <Collapsible
    triggerClassName="CustomTriggerCSS"
    triggerOpenedClassName="CustomTriggerCSS--open"
    contentOuterClassName="CustomOuterContentCSS"
    contentInnerClassName="CustomInnerContentCSS"
    transitionTime={200}
    easing="ease-in"
    trigger="Content Types">
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis sed nisi diam. Suspendisse pulvinar ipsum facilisis, blandit nisi sit amet, ornare risus. Suspendisse enim sapien, viverra sit amet pharetra in, efficitur in sapien.</p>
    </Collapsible>


      </div>

    );
  }
  testMethod() {

    /*
    PostContract.setGroupAddress(1,'0x12345678').then((result) => {
      console.log(result);
    });
    */
    /*
    PostContract.getGroupAddress(1).then((result) => {
      console.log('get',result.toString());
    });
    */
    /*
    var postNum = this.getCurPostNum();
    console.log(postNum);
    var prom = PostContract.convertPost2Group(postNum);
    prom.then((addr) => {
      console.log('we got the address as', addr);
      PostContract.joinGroup(addr);
      var naddr = PostContract.getGroupAddress(postNum);
      console.log('got the group address, its ', naddr);
    }).catch((error) => {
          console.error("Error while executing testMethod contract function.", error);
    });
    */
  }
}





const styles = {
  container: {
    flex: 1,
    backgroundColor: '#a5a5a5',
    borderLeft: '1px solid lightgrey',
    margin: '0px',
    overflowY: 'auto',
  },
  groupDesc: {
    textAlign: 'center',
    fontSize: 'small',
    margin: '2px',
    marginBottom: '10px',
    marginTop: '10px',
  },
  joinButton: {
    textAlign: 'center',
    fontSize: 'medium',
    height: '5%',
    width: '30%',
    paddingBottom: '20px',
    display: 'block',
    margin: '0 auto',
    marginBottom: '10px',
    cursor: 'pointer',
  },

};

export default SideBar;
