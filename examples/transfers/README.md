
# Examples
Examples contains a set of examples to help `hermezjs` user get started with most common operations in Hermez Network

To use the examples:
```
cd examples/
npm i
node transactions/<transaction-script> --url <ethNodeUrl>
```
If no `--url` parameters is provided, default url `http://localhost:8545` is used.
First transaction should be `create-accounts-and-deposit`

## Transfers
Transfers folder contains a set of routines that allow to send single transfers to a Coordinator:
- `create-accounts-and-deposit.js` creates two accounts with from Ethereum addresses indexes 1 and 2 and deposits 100 Eth
- `transfer.js` transfers 3 ETH from account 0 to account 1
- `multiple-transfer.js` performs 5 transfers of 1 ETH from account 0 to account 1
- `exit.js` performs an `exit` transaction of 12 ETH from account 0 
- `force-exit.js` performs a `force exit` transaction of 8 ETH from account 0 
- `withdrawal.js` performs a `withdrawal` transaction from account 0 

