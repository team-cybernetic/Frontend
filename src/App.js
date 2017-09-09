import React, { Component } from 'react';
import logo from './logo.svg';
import NavigationBar from './components/NavigationBar';
import ChildrenView from './components/ChildrenView';
import SideBar from './components/SideBar';
import Editor from './components/Editor';

import PostsContract from './contracts/Posts.json'
import getWeb3 from './utils/getWeb3'

class App extends Component {


    constructor(props) {
        super(props)

        this.state = {
            web3: null
        }
    }



    componentWillMount() {
        // Get network provider and web3 instance.
        // See utils/getWeb3 for more info.

        getWeb3.then(results => {
            this.setState({
                web3: results.web3
            })  

            // Instantiate contract once web3 provided.
            this.instantiateContract()
        }).catch((err) => {
            console.log('Error finding web3: ', err.message)
        })  
    }   

    instantiateContract() {
        /*  
         * SMART CONTRACT EXAMPLE
         *
         * Normally these functions would be called in the context of a
         * state management library, but for convenience I've placed them here.
         */

        const contract = require('truffle-contract')
        const postsContract = contract(PostsContract)
        postsContract.setProvider(this.state.web3.currentProvider)

        // Declaring this for later so we can chain functions on the contract
        var postsContractInstance

        // Get accounts.
        this.state.web3.eth.getAccounts((error, accounts) => {
            var i = 0
            accounts.map((account) => {
                this.state.web3.eth.getBalance(account, (error, balance) => {
                    console.log("account[", i, "] =", JSON.stringify(account), "; balance =", this.state.web3.fromWei(balance).toNumber())
                    i++
                })
            })
            this.setState({
                walletAddress: accounts[0] //TODO: WalletStore?
            })

            postsContract.deployed().then((instance) => { //once the contract is surely deployed
                postsContractInstance = instance
                return (postsContractInstance.getPostTitles.call()) //get all the post titles

            }).then((postTitles) => {
                console.log("post titles:", postTitles);

                postTitles.map((title) => { //for each post title

                    postsContractInstance.getPost(title).call().then((content, creator) => { //get the post content and creator
                        console.log("got a post :", { "title": title, "content": content, "creator": creator });
                        //TODO: display post or add to PostStore?
                    })
                })
            })
        })
    }


    render() {
        return (
            <div style={styles.container}>
                <NavigationBar />
                <div style={styles.content}>
                    <div style={styles.childrenAndEditor}>
                        <ChildrenView />
                        <Editor />
                    </div>
                    <SideBar />
                </div>
            </div>
        );
    }
}

const styles = {
    container: {
        display: 'flex',
        flexFlow: 'column',
        height: '100%',
    },
    content: {
        display: 'flex',
        flexFlow: 'row',
        height: '100%',
    },
    childrenAndEditor: {
        display: 'flex',
        flexFlow: 'column',
        width: '70%',
    },
};

export default App;
