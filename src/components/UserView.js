import React, { Component } from 'react';
import WalletStore from '../stores/WalletStore'
import xss from 'xss';
import moment from 'moment';
import { Link } from 'react-router-dom';

export default class UserView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSelf: undefined,
    };
  }

  componentWillMount() {
    this.listenerHandle = this.props.user.registerUpdateListener((post) => {
      this.forceUpdate();
    });
    this.props.user.loadHeader().then(() => {
      if (this.props.user.getAddress() === WalletStore.getAccountAddress()) {
        this.setState({
          isSelf: true,
        });
      }
    });
  }

  componentWillUnmount() {
    this.props.user.unregisterUpdateListener(this.listenerHandle);
  }

  renderAddress() {
    return (
      <div style={this.styles.addressWrapper}>
        Address:&nbsp;
        <span style={this.styles.address}>
          {this.props.user.getAddress()}
        </span>
      </div>
    );
  }

  renderNumber() {
    return (
      <div style={this.styles.numberWrapper}>
        User&nbsp;#
        <span style={this.styles.number}>
          {this.props.user.getNumber()}
        </span>
      </div>
    );
  }

  render() {
    if (this.props.user.isHeaderLoaded()) {
      return (
        <div style={this.styles.container} className='card'>
          <div style={this.styles.cardContent} className='card-content'>
            {this.renderNumber()}
            {this.renderAddress()}
          </div>
        </div>
      );
    } else {
      return (
        <div style={this.styles.container} className='card'>
          <div style={this.styles.cardContent} className='card-content'>
            Loading...
          </div>
        </div>
      );
    }

  }

  get styles() {
    return {
      container:
        this.props.sidebar ? {
          width: '96%',
          marginLeft: '2%',
          marginRight: '2%',
          marginTop: '1.5%',
          marginBottom: '1.5%',
          backgroundColor: this.state.isSelf ? 'yellow' : 'white',
        } : {
          width: '46%',
          marginLeft: '2%',
          marginRight: '2%',
          marginTop: '1.5%',
          marginBottom: '1.5%',
          backgroundColor: 'white',
        },
      contentWrapper: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      },
      content: {
        overflowY: 'auto',
        minHeight: '0px',
        flex: 1,
      },
      contentHr: {
        flexShrink: 0,
      },
      cardContent: {
        display: 'flex',
        flexDirection: 'column',
        overflowWrap: 'break-word',
        maxHeight: '500px',
        padding: '1rem',
      },
      timestamp: {
        fontSize: 'small',
      },
      date: {
        fontSize: 'small',
      },
      numberWrapper: {
        fontSize: 'small',
      },
      number: {
        fontSize: 'small',
      },
      multiHash: {
        fontSize: 'small',
      },
      multiHashIpfs: {
        fontSize: 'x-small',
      },
      addressWrapper: {
        fontSize: 'small',
      },
      address: {
        fontSize: 'x-small',
      },
    }
  };

}
