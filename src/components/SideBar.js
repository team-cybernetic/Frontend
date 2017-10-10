import React, { Component } from 'react';
import Post from './Post';
import Collapsible from 'react-collapsible';
import './style.css';

class SideBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      post: null,
      group: null,
      isLoaded: undefined,
    };
  }

  setContent(isLoaded, group, post, pathState) {
    if (isLoaded) {
      console.log("Sidebar loaded!");
      this.setState({
        isLoaded,
        group,
        post,
        pathState,
      });
    } else {
      console.log("Sidebar loading...");
    }
  }

  componentWillMount() {
    this.setContent(this.props.isLoaded, this.props.group, this.props.post, this.props.pathState);
  }

  componentWillReceiveProps(nextProps) {
    this.setContent(nextProps.isLoaded, nextProps.group, nextProps.post, nextProps.pathState);
  }

  renderPost() {
    if (this.props.isLoaded) {
      if (this.props.pathState.isGroup) {
        console.log("sidebar render group TODO");
      } else if (this.state.post) {
        let post = this.state.post;
        return (
          <Post key={post.id ? post.id : post.transactionId} sidebar={true} post={post} parent={this.props.pathState.parent} />
        );
      } else {
        return (
          <p style={styles.groupDesc}>Loading post...</p>
        );
      }
    } else {
      return (
        <p style={styles.groupDesc}>Loading...</p>
      );
    }
  }

  joinGroup() {
    console.log("TODO: join group");
  }

  render() {
    return (
      <div style={styles.container}>
        {this.renderPost()}
        <p style={styles.groupDesc}>x Members / x Earnings</p>

        <button
        style={styles.joinButton}
        onClick={() => this.joinGroup()}
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
