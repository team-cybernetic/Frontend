import React, { Component } from 'react';
import Collapsible from 'react-collapsible';
import PostStore from '../stores/PostStore';
import './style.css';

class SideBar extends Component {
    constructor(props) {
    super(props);
    this.state = {
      isPosting: false,
    }
  }

  render() {
    return (
      <div style={styles.container}>
        <p style={styles.groupDesc}>[ short description of group could go here. ]</p>
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
    const title = "Example Group"
    const content = "This is an Example Group";
    const contentType = "group";
    this.setState({
      isPosting: true,
    });
    PostStore.createPost(title.trim(), content, contentType).then((post) => {
      console.log("Created a post:", post);
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
