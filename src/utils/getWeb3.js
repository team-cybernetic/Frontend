import Web3 from 'web3'

export default function getWeb3() {
  return new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener('load', function() {
      let results;
      let web3 = window.web3;

      // Checking if Web3 has been injected by the browser (Mist/MetaMask)
      if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider.
        web3 = new Web3(web3.currentProvider);

        results = {
          web3: web3,
          managedWeb3: true,
        };

        console.log('Injected web3 detected.');

        resolve(results);
      } else {
        // Fallback to localhost if no web3 injection.
        console.log('No web3 instance injected');
        var provider = new Web3.providers.HttpProvider('http://localhost:9545'); //try local debug node
        web3 = new Web3(provider);

        if (web3.isConnected()) {
            console.log("connected to local web3 debug node, version", web3.version.api, "network", web3.version.network);
        } else {
          provider = new Web3.providers.HttpProvider('http://localhost:8545'); //prefer local node
          web3 = new Web3(provider);

          if (web3.isConnected()) {
            console.log("connected to local web3 node, version", web3.version.api, "network", web3.version.network);
          } else {
            provider = new Web3.providers.HttpProvider('https://web3.ttt222.org'); //fallback to remote node
            web3 = new Web3(provider);
            if (web3.isConnected()) {
              console.log("connected to remote web3 node, version", web3.version.api, "network", web3.version.network);
            } else {
              reject(new Error("Unable to connect to any web3 provider!"));
            }
          }
        }
        results = {
          web3: web3,
          managedWeb3: false,
        };

        resolve(results);
      }
    });
  });
}
