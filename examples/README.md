
# Examples
Examples contains a set of examples to help `hermezjs` user get started with most common operations in Hermez Network

Configure examples/constants with the correct values for :
- EXAMPLES_WEB3_URL 
- EXAMPLES_HERMEZ_API_URL 
- EXAMPLES_HERMEZ_ROLLUP_ADDRESS 
- EXAMPLES_HERMEZ_WDELAYER_ADDRESS 
- EXAMPLES_PRIVATE_KEY1 
- EXAMPLES_PRIVATE_KEY2 

To use the examples:
```
node <transaction-script> 
```
First transaction should be `create-accounts-and-deposit`

## Transactions
Transactions folder contains a set of routines that allow to send single transfers to a Coordinator:
- `create-accounts-and-deposit.js` creates two accounts with from Ethereum addresses indexes 1 and 2 and deposits 100 Eth
- `transferA.js` transfers ETH from account 0 to account 1
- `transferB.js` transfers ETH from account 1 to account 0
- `exitA.js` performs an `exit` transaction from account 0 
- `exitB.js` performs an `exit` transaction from account 1 
- `force-exitA.js` performs a `force exit` transaction from account 0 
- `force-exitB.js` performs a `force exit` transaction from account 1
- `withdrawalA.js` performs a `withdrawal` transaction from account 0 
- `withdrawalB.js` performs a `withdrawal` transaction from account 1 
