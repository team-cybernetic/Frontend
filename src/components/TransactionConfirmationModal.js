import React, { Component } from 'react';
import Wallet from '../models/Wallet';

class TransactionConfirmationModal extends Component {
  static appListener = null;

  constructor(props) {
    super(props);
    this.state = {
      gasPrice: Wallet.defaultGasPrice(),
    };
  }

  render() {
    return (
      <div style={styles.wrapper}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>Are you sure you want to {this.props.description}?</div>
          <div style={styles.modalDescription}>If you click confirm, you'll pay the calculated amount of Ether. You can change the gas price if you'd like. The lower the gas price, the longer this action will take to execute.</div>

          <div className="field is-horizontal">
            <div className="field-label is-normal">
              <label className="label">Gas Required</label>
            </div>
            <div className="field-body">
              <div className="field">
                <div style={styles.fieldText}>
                  {this.props.costInGas.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="field is-horizontal">
            <div className="field-label is-normal">
              <label className="label">Gas Price</label>
            </div>
            <div className="field-body">
              <div className="field is-horizontal" style={styles.numberInputContainer}>
                <div className="control" style={styles.numberInput}>
                  <input
                    className='input'
                    type='number'
                    value={this.gweiGasPrice()}
                    onChange={(e) => this.onChangeGasPrice(e)}
                  />
                </div>
                <div>
                  Gwei
                </div>
              </div>
            </div>
          </div>

          <div className="field is-horizontal">
            <div className="field-label is-normal">
              <label className="label">Cost</label>
            </div>
            <div className="field-body">
              <div className="field">
                <div style={styles.fieldText}>
                  {this.costInEther().toLocaleString()} ETH
                  {this.costInUsd() && (
                    ' | ' + this.costInUsd().toLocaleString() + ' USD'
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="field is-horizontal">
            <div className="field-label is-normal">
              <label className="label">Remaining Balance</label>
            </div>
            <div className="field-body">
              <div className="field">
                <div style={styles.fieldText}>
                  {this.remainingBalanceInEther().toLocaleString()} ETH
                  {this.remainingBalanceInUsd() && (
                    ' | ' + this.remainingBalanceInUsd().toLocaleString() + ' USD'
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="field is-grouped is-grouped-centered">
            <p className="control">
              <button
                className='button'
                onClick={() => this.confirm()}
                disabled={!this.hasEnoughBalance()}
              >
                Confirm
              </button>
            </p>
            <p className="control">
              <button
                className='button'
                onClick={() => this.cancel()}
              >
                Cancel
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  onChangeGasPrice(e, key) {
    this.setState({
      gasPrice: e.target.value * 1000000000,
    });
  }

  costInWei() {
    return this.props.costInGas * this.state.gasPrice;
  }

  costInEther() {
    return Wallet.weiToEther(this.costInWei());
  }

  costInUsd() {
    return Wallet.weiToUsd(this.props.costInGas * this.state.gasPrice).toFixed(2);
  }

  remainingBalanceInEther() {
    return Wallet.weiToEther(Wallet.getCurrentBalance() - this.costInWei());
  }

  remainingBalanceInUsd() {
    return Wallet.weiToUsd(Wallet.getCurrentBalance() - this.costInWei());
  }

  hasEnoughBalance() {
    return this.remainingBalanceInEther() >= 0;
  }

  gweiGasPrice() {
    return this.state.gasPrice / 1000000000;
  }

  confirm() {
    this.props.confirmCallback(this.state.gasPrice);
    this.props.closeModal();
  }

  cancel() {
    this.props.cancelCallback();
    this.props.closeModal();
  }

  static registerAppListener(listener) {
    this.appListener = listener;
  }

  static show(costInGas, description, confirmCallback, cancelCallback) {
    if (this.appListener) {
      this.appListener({ costInGas, description, confirmCallback, cancelCallback });
    }
  }
}

const styles = {
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '2',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: '0',
    right: '0',
  },
  modal: {
    width: '960px',
    minHeight: '250px',
    backgroundColor: 'white',
    padding: '10px',
  },
  fieldText: {
    marginTop: '6px',
  },
  modalHeader: {
    fontSize: '24px',
  },
  modalDescription: {
    marginTop: '5px',
    marginBottom: '5px',
  },
  numberInputContainer: {
    alignItems: 'center',
  },
  numberInput: {
    marginRight: '4px',
    maxWidth: '30%',
    flex: '1',
  },
};

export default TransactionConfirmationModal;
