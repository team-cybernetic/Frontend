import React, { Component } from 'react';
import PostView from './PostView';
import Collapsible from 'react-collapsible';
import './style.css';
import cx from 'classnames';

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
      group.getUsers().then((users) => {
        if (users) {
          console.log("users!");
          users.forEach((user, idx) => {
            console.log("user[" + idx + "]:", user);
          });
        } else {
          console.log("no users!");
          users = [];
        }
        this.setState({
          users,
        });
      });
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
          <PostView key={post.id ? post.id : post.transactionId} sidebar={true} post={post} parent={this.props.pathState.parent} />
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
    this.props.group.joinGroup().then(() => {
      console.log("successfully joined group!");
    }).catch((error) => {
      console.log("failed to join group:", error);
    });
  }

  renderUsers() {
    if (this.state.users) {
      return (this.state.users.map((user) => {
        console.log("rendering user", user.getAddress());
        const address = user.getAddress(); //user hasn't loaded yet, so this returns undefined
        const id = user.getNumber();
        return (
          <div key={address ? address : id}> { /*TODO: <UserView> objects */}
            User: {address}&nbsp;{id}<br />
          </div>
        );
      }));
    } else {
      if (Array.isArray(this.state.users)) {
        return ("");
      } else {
        return ("Loading users...");
      }
    }
  }

  renderUsersAccordian() {
    return (
      <Collapsible
        triggerClassName="CustomTriggerCSS"
        triggerOpenedClassName="CustomTriggerCSS--open"
        contentOuterClassName="CustomOuterContentCSS"
        contentInnerClassName="CustomInnerContentCSS"
        transitionTime={200}
        easing="ease-in"
        trigger="Members"
      >
        {this.renderUsers()}
      </Collapsible>
    );
  }

  render() {
    return (
      <div style={styles.container}>
        {this.renderPost()}
        <p style={styles.groupDesc}>x Members / x Earnings</p>

        <button
      style={styles.joinButton}
      className={cx('button')}
      onClick={() => this.joinGroup()}
        > Join Group </button>


        { /* To be populated with actual data */ }
        {this.renderUsersAccordian()}

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
