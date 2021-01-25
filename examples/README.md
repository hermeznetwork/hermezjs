
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

## Trannsactions
Transactions folder contains a set of routines that allow to send single transfers to a Coordinator:
- `create-accounts-and-deposit.js` creates two accounts with from Ethereum addresses indexes 1 and 2 and deposits 100 Eth
- `transfer.js` transfers 3 ETH from account 0 to account 1
- `exit.js` performs an `exit` transaction of 12 ETH from account 0 
- `force-exit.js` performs a `force exit` transaction of 8 ETH from account 0 
- `withdrawal.js` performs a `withdrawal` transaction from account 0 



