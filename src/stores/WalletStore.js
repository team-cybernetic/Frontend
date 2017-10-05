export default class WalletStore {
  static postsContractInstance = null;
  static web3 = null;

  static initialize(web3, postsContractInstance) {
    this.web3 = web3;
    this.postsContractInstance = postsContractInstance;
    this.web3.eth.getAccounts((error, accounts) => {
      this.web3.eth.defaultAccount = accounts[0];
      this.web3.eth.getBalance(this.getAccountAddress(), (error, balance) => {
        console.log("account balance =", this.web3.fromWei(balance).toNumber());
      });
    });
  }

  static getAccountAddress() {
    return this.web3.eth.defaultAccount;
  }
}
