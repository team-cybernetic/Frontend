import React, { Component } from 'react';
import Collapsible from 'react-collapsible';
import PostStore from '../stores/PostStore';
import PostContract from '../ethWrappers/PostContract';
import './style.css';

class SideBar extends Component {
    constructor(props) {
    super(props);
  }

  getPostContent() {
    return ("TODO");
  }

  render() {
    return (
      <div style={styles.container}>
        <p style={styles.groupDesc}>{this.getPostContent()}</p>
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

  getCurPostNum() {
    var url = window.location.href;
    var groups = [];
    url = url.substring(0,url.length - 1);
    var curGroup = url.substring(url.lastIndexOf('/') + 1, url.length);
    return curGroup.substring(0, curGroup.indexOf('-')).trim();
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
