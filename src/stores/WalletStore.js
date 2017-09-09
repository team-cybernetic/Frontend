export default class WalletStore {
  static postsContractInstance = null;
  static web3 = null;

  static initialize(web3, postsContractInstance) {
    this.web3 = web3;
    this.postsContractInstance = postsContractInstance;
  }

  static getActiveAccount(title, content) {
    return new Promise((resolve) => {
      this.web3.eth.getAccounts((error, accounts) => {
        resolve(accounts[0]);
      });
    });
  }
}
