# Cybernetic Chat

Cybernetic Chat is a decentralized, group-based social media platform.
Like other social networks, users can post content and interact with others.
It runs as a web application on the React framework and is backed by the Ethereum blockchain.
It also utilizes IPFS to store posted content such as text, images, or video.

## Release Notes

This first version of Cybernetic Chat is the result of two semsters of work and contains the following features:

* Creating posts/groups (posts = groups)
* Upvoting/downvoting posts
* Transferring currency to other users
* Tracking your current balance
* Editing/viewing user profiles

## Install Guide

### Pre-requisites

This install guide assumes you're running macOS, Linux, or Windows and have an internet connection.
Additionally, you need to have the following installed:

* **node**: For information, see [this guide](https://nodejs.org/en/).
* **yarn**: For information, see [this guide](https://yarnpkg.com/en/docs/install).
* **truffle**: For information, see [this guide](http://truffleframework.com/).
* **git**: For information, see [this guide](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git).

### Downloading the source

To run locally, you'll need to download the source code. It is hosted on GitHub (presumably you're there reading this), and can be
downloaded by executing the following in any terminal that can use git:

`git clone git@github.com:team-cybernetic/Frontend.git`

### Setting up Ethereum

You have two options here.

* You can use the Ethereum testnet hosted by us (ttt222.org). Note: **this is default**
* You can run your own locally. Note: **we recommend this** (at least initially)

To run your own, install ganache-cli using [the instructions here](https://github.com/trufflesuite/ganache-cli).

Then, simply run the following command:

`ganache-cli`

### Building the project

Because the project is backed by an Ethereum contract, you'll need to ensure the contract is deployed correctly. To do this,
run the following:

`cd Frontend`

`./build-contracts.sh`

Next you'll need to install the rest of the project's dependencies:

`yarn install`

### Running

Now that you have the pre-requisites, deployed contracts, and project dependencies, it's time to run! It's as easy as executing
the following command:

`yarn start`

The above command should automatically open the project in your browser, but if it doesn't simply visit: [http://localhost:3000](http://localhost:3000).

## Troubleshooting

### Modules not found

If modules are missing, it probably means you need to run:

`yarn install`
