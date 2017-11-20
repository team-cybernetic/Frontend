#!/bin/bash
nuke=0
doall="--all"
doreset="--reset"
domigrate=1
declare -a targets

while [ $# -gt 0 ]; do
  if [ "$1" == "--rm" ]; then
    nuke=1
  elif [ "$1" == "--noreset" ]; then
    doreset=""
  elif [ "$1" == "--noall" ]; then
    doall=""
  elif [ "$1" == "--nomigrate" ]; then
    domigrate=0
  else
    targets+=("$1")
  fi
  shift
done

if [ $nuke -eq 1 ]; then
  rm build/contracts/*.json
else
  truffle compile $doall || domigrate=0
fi

if [ $domigrate -eq 1 ]; then
  if [ ${#targets[@]} -gt 0 ]; then
    for target in "${targets[@]}"; do
      truffle migrate $doreset --network "$target" 
    done
  else 
    truffle migrate $doreset
  fi

  if [ ! -L build/contracts ]; then
    cp build/contracts/*.json src/contracts/
  fi
fi
