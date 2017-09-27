import React, { Component } from 'react';
import Collapsible from 'react-collapsible';
import './style.css';

class SideBar extends Component {
  render() {
    return (
      <div style={styles.container}>
        <p style={styles.groupTitle}>Group Title</p>

        <p style={styles.groupDesc}>[ short description of group could go here. ]</p>
        <p style={styles.groupDesc}>x Members / x Earnings</p>

        <button
        style={styles.joinButton}
        /* onClick={() => join / request group */
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
  groupTitle: {
    textAlign: 'center',
    fontSize: 'x-large',
    fontWeight: 'bold',
    margin: '2px',
    marginTop: '10px',
  },
  groupDesc: {
    textAlign: 'center',
    fontSize: 'small',
    margin: '2px',
    marginBottom: '10px',
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
