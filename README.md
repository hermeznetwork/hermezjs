# HermezJS
HermezJS is an open source SDK to interact with Hermez Rollup network.

To deploy the contracts on localhost, run:
```
./deploy.sh
```
This command will download contracts, compile them and deploy them on http://localhost:8545

## Import modules
Load hermezjs library

```javascript
import * as hermez from './src/hermez'
```

## Create Transaction Pool
Initialize some local storage where user transactions are stored.

```
  hermez.txPool.initializeTransactionPool()
```

## Connect to Ethereum Network
Some of the operations in Hermez network, such as sending L1 transactions, require interacting with smart contracts.It is thus necessary to initialize a provider.

```
  hermez.setProvider("http://localhost:8545")
```

## Create a Wallet 
We can create a new Hermez wallet by providing the ethereum address associated with the provider initialized. This wallet will store the ethereum and babyjubjub keys for the newly created Hermez account. As discussed in the [`developer-guide`](../developers/dev-guide?id=Accounts), the ethereum address is used to authorize L1 transactions, and the babyjubjub key is used to authorize L2 transactions.

```
  const {hernezWallet, hermezEthereumAddress } = await hermez.createWalletFromEtherAccount(0)
```
## Check Token exists in Hermez Network
Before being able to operate in Hermez network, we must ensure that the token we want to ooperate with is listed. For that we make a call to the Hermez node API that will list all listed tokens. All tokens in Hermez Network must be ERC20.

```
  token = await hermez.getTokens()
  console.log(token)

>>>>
  {
    "tokens": [
      {
        "id": 4444,
        "ethereumAddress": "0xaa942cfcd25ad4d90a62358b0dd84f33b398262a",
        "name": "Maker Dai",
        "symbol": "DAI",
        "decimals": 18,
        "ethereumBlockNum": 539847538,
        "USD": 1.01,
        "fiatUpdate": null
      }
    ],
    "pagination": { "totalItems": 2048, "firstItem": 50, "lastItem": 2130 }
  }
```

In this case, Hermez network only DAI as the only available token to operate.

## Deposit Tokens from Ethereum into Hermez Network
Creating an Hermez account and depositing tokens are done simultaneously as a L1 transaction.  In this example we are going to deposit 100.2 DAI to the Hermez account. The steps are:
1. Select amount to deposit from ethereum into hermez using getTokenAmountBigInt
2. Select the token denomination of the deposit. Hermez contains a list of supported token that can be queried with getTokens(). This function returns the list of supported tokens. Only tokens in this list can be used.

```
  // Configure deposit amount
  amount = hermez.getTokenAmountBigInt("100.20",2)

  // retrieve DAI token info from Hermez network
  tokenDAI = token.tokens[0]

  // make deposit of ERC20 Tokens
  await hermez.deposit(amount,
                       hermezEthereumAddress,
                       tokenDAI, 
                       hermezWallet.publicKeyCompressedHex)
```
Internally, the deposit funcion calls Hermez smart contract to add the L1 transaction.

## Verify Balance
Balance can be obtained by querying an Hermez node and passing the hermezEthereumAddress of the account.

```
  acountInfo = await  hermez.getAccounts(hermezEthereumAddress)
  console.log(accountInfo)

>>>>>

{
  accounts: [
    {
      accountIndex: 'hez:DAI:4444',
      nonce: 121,
      balance: '8708856933496328593',
      bjj: 'hez:rR7LXKal-av7I56Y0dEBCVmwc9zpoLY5ERhy5w7G-xwe',
      hezEthereumAddress: 'hez:0xaa942cfcd25ad4d90a62358b0dd84f33b398262a',
      token: [Object]
    }
  ],
  pagination: { totalItems: 2048, firstItem: 50, lastItem: 2130 }
}

```
## Transfer
At this point, Hermez source account is already created with 100.2 DAI tokens. The next step is to transfer some funds to another Hermez rollup account.

First we create a second wallet following the procedure we saw earlier

```
   const {hermezWallet2, hermezEthereumAddress2 } =
                      await hermez.createWalletFromEtherAccount(1)
```

Next step we compute the fees for the transaction. For this we consult the recommended fees from the coordinator .

```
  // fee computation
  let state = await hermez.CoordinatorAPI.getState()
  console.log(state.recommendedFee)

>>>>
{
  existingAccount: 0.1,
  createAccount: 1.3,
  createAccountInternal: 0.5
}

```

The returned fees are the suggested feeds for different transactions:
- existingAccount : Do a transfer to an existing account
- createAccount   : Do a transfer to a inexistent account, and create a regular account
- createAccountInternal : Do a transfer to a and create internal account

The fee amounts are given in USD. However, fees are payed in the token of the transaction. So, we need to do a conversion.

```
  let usdTokenExchangeRate = tokenERC777.USD
  let fee = fees.existingAccount / usdTokenExchangeRate
```

The last part is to request the actual transfer.

```
  // src account
  let from = (await hermez.getAccounts(hermezEthereumAddress)).accounts[0]
  // dst account
  let to = (await hermez.getAccounts(hermezEthereumAddress2)).accounts[0]
  // amount to transfer
  amount = hermez.getTokenAmountBigInt("10",2)

  // generate L2 transaction
  var {transaction, encodedTransaction} = await hermez.generateL2Transaction(
    {
      from: from.accountIndex,
      to: to.accountIndex,
      amount: hermez.float2Fix(hermez.floorFix2Float(amount)),
      fee,
      nonce: from.nonce
    },
    walletRollup.publicKeyCompressedHex, from.token)

  // sign encoded transaction
  walletRollup.signTransaction(transaction, encodedTransaction)
  // send transaction to coordinator
  result = hermez.send(transaction, walletRollup.publicKeyCompressedHex)
  
  console.log(result9

>>>>>

{ status: 200, id: '0x00000000000001e240004700', nonce: 122 }


```
The result status 200 shows that transaction has been correctly received. Additionally, we receive the a nonce matching the transaction we sent, and an id that we can use to verify the status of the transaction,

## Verifying Transaction status
Transactions received by the operator will be stored in its transaction pool while they haven't been process. To check a transaction in the transaction pool we make a query to the coordinator node.

```
  txConf = await getPoolTransaction(result.id)
  console.log(txConf)

>>>>

{
  id: '0x00000000000001e240004700',
  type: 'Transfer',
  fromAccountIndex: 'hez:DAI:4444',
  toAccountIndex: 'hez:DAI:309',
  toHezEthereumAddress: 'hez:0xbb942cfcd25ad4d90a62358b0dd84f33b3982699'
  toBjj: 'hez:HVrB8xQHAYt9QTpPUsj3RGOzDmrCI4IgrYslTeTqo6Ix',
  amount: '6303020000000000000',
  fee: 36,
  nonce: 121,
  state: 'pend',
  signature: '72024a43f546b0e1d9d5d7c4c30c259102a9726363adcc4ec7b6aea686bcb5116f485c5542d27c4092ae0ceaf38e3bb44417639bd2070a58ba1aa1aab9d92c03',
  timestamp: '2019-08-24T14:15:22Z',
  batchNum: 5432,
  requestFromAccountIndex: 'hez:0xaa942cfcd25ad4d90a62358b0dd84f33b398262a',
  requestToAccountIndex: 'hez:DAI:33',
  requestToHezEthereumAddress: 'hez:0xbb942cfcd25ad4d90a62358b0dd84f33b3982699',
  requestToBJJ: 'hez:HVrB8xQHAYt9QTpPUsj3RGOzDmrCI4IgrYslTeTqo6Ix',
  requestTokenId: 4444,
  requestAmount: 'string',
  requestFee: 8,
  requestNonce: 6,
  token: {
    id: 4444,
    ethereumAddress: '0xaa942cfcd25ad4d90a62358b0dd84f33b398262a',
    name: 'Maker Dai',
    symbol: 'DAI',
    decimals: 18,
    ethereumBlockNum: 539847538,
    USD: 1.01,
    fiatUpdate: null
  }
}
 
```

At this point, the transactions is still in the coordinator's transaction pool as we can see in the `state` field. There are 4 possible stats:
1. **pend** : Pending
2. **fging** : Forging
3. **fged** : Forged
4. **invl** : Invalid

. After a few seconds, we verify transaction status

```
    // Get transaction confirmation
    txConf = await hermez.getHistoryTransaction(txPool.id)
    console.log(txConf)

>>>>>

{
  L1orL2: 'L2',
  id: '0x00000000000001e240004700',
  itemId: 0,
  type: 'Transsfer',
  position: 5,
  fromAccountIndex: 'hez:DAI:4444',
  toAccountIndex: 'hez:DAI:672',
  amount: '4903020000000000000',
  batchNum: 5432,
  historicUSD: 49.7,
  timestamp: '2019-08-24T14:15:22Z',
  token: {
    id: 4444,
    ethereumAddress: '0xaa942cfcd25ad4d90a62358b0dd84f33b398262a',
    name: 'Maker Dai',
    symbol: 'DAI',
    decimals: 18,
    ethereumBlockNum: 539847538,
    USD: 1.01,
    fiatUpdate: null
  },
  L1Info: null,
  L2Info: {
    "fee": 36
    "historicFeeUSD": 0.1
    "nonce" : 121
  }
}
```

