#!/bin/bash
rm build/contracts/*; truffle migrate --reset --network blokkchat && cp build/contracts/*.json src/contracts/
