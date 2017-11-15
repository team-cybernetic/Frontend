#!/bin/bash
rm build/contracts/*; truffle migrate --reset --network "$1" && test ! -L build/contracts && cp build/contracts/*.json src/contracts/
