module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: '0x47E7C4',
      gasPrice: 1000000000,
    },
    debug: {
      host: "localhost",
      port: 9545,
      network_id: "4447", // Match any network id
      gas: '0x47E7C4',
      gasPrice: 1000000000,
    },
    blokkchat: {
        host: "ttt222.org",
        port: 8545,
        network_id: "*",
        gas: '0x47E7C4',
        gasPrice: 1000000000,
    }
  }
};
