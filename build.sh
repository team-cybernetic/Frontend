# trap ctrl-c and call ctrl_c()

restore_contract_state() {
    # move the built code into a production folder
    rm -rf production
    mv build production

    # make the src/contracts directory back into a symlink
    mkdir build
    ln -s ../src/contracts/ build/contracts
#    mv src/contracts/* build/contracts/
#    rm -rf src/contracts
#    ln -s "../build/contracts" "src/contracts"
}

trap restore_contract_state INT

# make src/contracts a real directory instead of symlink
if [ -h src/contracts ]; then #if it's a symlink
    rm src/contracts
    mkdir src/contracts #make it a directory
    mv build/contracts/* src/contracts/
    rm -Rf build/contracts
    ln -s ../src/contracts build/contracts
fi
#if [ -d build/contracts ]; then
#    cp build/contracts/*.json src/contracts/
#fi

# build
node_modules/react-scripts/bin/react-scripts.js build || true

restore_contract_state
