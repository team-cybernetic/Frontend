#!/bin/bash
rm build/contracts/*; truffle migrate --reset && cp build/contracts/*.json src/contracts/
