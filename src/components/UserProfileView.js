import React, { Component } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

class UserProfileView extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    //load profile
  }

  componentWillReceiveProps(nextProps) {
    //load profile
  }

  render() {
    return (
      <Scrollbars style={styles.scrollBar}>
        <div style={styles.container}>
          <div style={styles.children}>
            This is a user's profile
          </div>
        </div>
      </Scrollbars>
    );
  }
}

const styles = {
  container: {
    flex: '1 1 0%',
    padding: '1%',
  },
  children: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
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
};

export default UserProfileView;
