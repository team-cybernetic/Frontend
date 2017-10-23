module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 4719388,
      gasPrice: 10000000000,
    },
    blokkchat: {
        host: "ttt222.org",
        port: 8545,
        network_id: "*"
    }
  }
};
