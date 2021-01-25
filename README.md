# Sandbox-Rinkeby
Draft branch while changes are properly commited to `hermezjs` that allows to test transacions

# How to test sandbox-rinkeby

0. Start VPN. You need VPN to connect to Rinkeby node.
1. Clone integration testing repo (branch `feature/automatic-aws-deploy4`)
2. Deploy contracts in Rinkeby. Addresses where contracts are deployed are dumped in file `deployments/deploy_output.json`
```
cd integration-testing
make deploy-contracts BUILD=sandbox-rinkeby
```
3. Start Hermez (starts wallet, batch-explorer, node and mock prover)
```
make start BUILD=sandbox-rinkeby DEPLOYMENT_FILE=deployments/deploy_output.json
```
4. In `hermezjs test/sandbox` branch
```
npm run build-node
```
6. In `hermezjs` main folder. copy .env.example to .env and set both Ethereum accounts' private keys
5. In examplex/constants.js configure `EXAMPLES_HERMEZ_ROLLUP_ADDRESS` and `EXAMPLES_HERMEZ_WDELAYER_ADDRESS` from contracts address file `deployments/deploy-output.json`
7. Launch transactions scripts from `hermezjs/examples/ folder`. Start by creates-accounts-deposits.js. Ensure you have ETH on both accounts
```
node examplex/creates-accounts-deposits.js
```


