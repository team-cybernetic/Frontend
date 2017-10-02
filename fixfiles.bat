cd src
del contracts
mkdir contracts
cd ..
xcopy contracts/Posts.sol src/contracts/Posts.sol
xcopy contracts/Migrations.sol src/contracts/Migrations.sol