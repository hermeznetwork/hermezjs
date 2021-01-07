# HermezJS
HermezJS is an open source SDK to interact with the Hermez Rollup network.

To deploy a local setup of a Hermez Coordinator with the Hermez smart contracts we recommend using our sandbox. To do so:

```sh
git clone https://github.com/hermeznetwork/integration-testing.git
cd integration-testing
make build
make start
```

**NOTE** To run all tests, type:
```
npm run test
```

## Import modules
Load hermezjs library

```js
import hermez from './src/index.js'
```

## Create Transaction Pool
Initialize the storage where user transactions are stored. This needs to be initialized at the start of your application.

```js
  hermez.txPool.initializeTransactionPool()
```

## Connect to Ethereum Network
Some of the operations in Hermez network, such as sending L1 transactions, require interacting with smart contracts. It is thus necessary to initialize an Ethereum provider.
During this example, we have deployed the contracts in our local blockchain.

```js
  hermez.Providers.setProvider('http://localhost:8545')
```

## Create a Wallet 
We can create a new Hermez wallet by providing the Ethereum account index associated with the provider initialized. This wallet will store the Ethereum and BabyJubJub keys for the Hermez account. The Ethereum address is used to authorize L1 transactions, and the BabyJubJub key is used to authorize L2 transactions. We will create two wallets

```js
  // Create 1st wallet
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(1)
  const hermezWallet = wallet.hermezWallet
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // Create 2nd wallet
  const wallet2 = await hermez.HermezWallet.createWalletFromEtherAccount(2)
  const hermezWallet2 = wallet2.hermezWallet
  const hermezEthereumAddress2 = wallet2.hermezEthereumAddress

```

## Check token exists in Hermez Network
Before being able to operate on the Hermez Network, we must ensure that the token we want to operate with is listed. For that we make a call to the Hermez Coordinator API that will list all available tokens. All tokens in Hermez Network must be ERC20. For the rest of the example, we will use one of the tokens that have been registered in the Hermez Network. In this example there are 4 tokens registered.

```js
  const token = await hermez.CoordinatorAPI.getTokens()
  console.log(token)
  const tokenERC20 = token.tokens[3]

>>>>
   {
      tokens: [
        {
          itemId: 1,
          id: 0,
          ethereumBlockNum: 0,
          ethereumAddress: '0x0000000000000000000000000000000000000000',
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
          USD: null,
          fiatUpdate: null
        },
        {
          itemId: 2,
          id: 1,
          ethereumBlockNum: 37,
          ethereumAddress: '0x24650cad431915051e2987455b76e0cdcaa1d4d8',
          name: 'ERC20_0',
          symbol: '20_0',
          decimals: 18,
          USD: null,
          fiatUpdate: null
        },
        {
          itemId: 3,
          id: 2,
          ethereumBlockNum: 49,
          ethereumAddress: '0x715752d24f27224d4a88957896a141df87a50448',
          name: 'ERC20_1',
          symbol: '20_1',
          decimals: 18,
          USD: null,
          fiatUpdate: null
        },
        {
          itemId: 4,
          id: 3,
          ethereumBlockNum: 61,
          ethereumAddress: '0x2e9f55f7266d8c7e07d359daba0e743e331b7a1a',
          name: 'ERC20_2',
          symbol: '20_2',
          decimals: 18,
          USD: null,
          fiatUpdate: null
        }
      ]
   }

```

## Deposit Tokens from Ethereum into Hermez Network
Creating an Hermez account and depositing tokens is done simultaneously as an L1 transaction.  In this example we are going to deposit 100 `ERC20_2` tokens to the newly created Hermez account. The steps are:
1. Select amount to deposit from Ethereum into Hermez using `getTokenAmountBigInt()`
2. Select the token denomination of the deposit. 

```js
  const amountDeposit = hermez.Utils.getTokenAmountBigInt('100', 2)

  // make deposit of ERC20 Tokens in 1st account
  await hermez.Tx.deposit(amountDeposit,
    hermezEthereumAddress,
    tokenERC20,
    hermezWallet.publicKeyCompressedHex)

  // make deposit of ERC20 Tokens in 2nd account
  await hermez.Tx.deposit(amountDeposit,
    hermezEthereumAddress2,
    tokenERC20,
    hermezWallet2.publicKeyCompressedHex)

```
Internally, the deposit funcion calls the Hermez smart contract to add the L1 transaction.

## Verify Balance
A token balance can be obtained by querying a Hermez node and passing the `hermezEthereumAddress` of the Hermez account.

```js
  const acount1 = await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress)
  console.log(accountInfo)

>>>>>
    {
      accounts: [
        {
          accountIndex: 'hez:20_2:256',
          balance: '10000',
          bjj: 'hez:1-WYg_cDxmLQPTxBDF2BdJYNsmK2KcaL6tcueTqWoQ6v',
          hezEthereumAddress: 'hez:0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
          itemId: 1,
          nonce: 0,
          token: [Object]
        }
      ],
      pendingItems: 0
    }

```

> Note that the `bjj` reported by some of the API endpoints is the same as the one included in the `Hermez Wallet` object, but they are represented in a different format.

Alternatively, an account query can be filtered using the `accountIndex`

```js
    const account1ByIdx = await hermez.CoordinatorAPI.getAccount(`hez:${tokenERC20.symbol}:256`)
    console.log(account1ByIdx)

>>>>>

    {
      accountIndex: 'hez:20_2:256',
      balance: '10000',
      bjj: 'hez:1-WYg_cDxmLQPTxBDF2BdJYNsmK2KcaL6tcueTqWoQ6v',
      hezEthereumAddress: 'hez:0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
      itemId: 1,
      nonce: 0,
      token: {
        USD: null,
        decimals: 18,
        ethereumAddress: '0x2e9f55f7266d8c7e07d359daba0e743e331b7a1a',
        ethereumBlockNum: 61,
        fiatUpdate: null,
        id: 3,
        itemId: 4,
        name: 'ERC20_2',
        symbol: '20_2'
      }
    }
```
### Force Exit

This is the L1 equivalent of an Exit. With this option, the Smart Contract forces Coordinators to pick up these transactions before they pick up L2 transactions. Meaning that these transactions will always be picked up.

This is a security measure. We don't expect users to need to make a Force Exit.
An `Exit` transaction is the first of two transactions used to recover the tokens from Hermez Network to Ethereum. The second transaction is a `withdraw` wich we will see later on.

```js
  const amountExit = hermez.Utils.getTokenAmountBigInt('10', 2)
  await hermez.Tx.forceExit(amountExit, account1t.accountIndex, tokenERC20)
```

Once the transaction has been forged by a Coordinator, we can poll the account status again to check the balance

```js
    const account1Update = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
    console.log(account1Update)

>>>>>>

    {
      accounts: [
        {
          accountIndex: 'hez:20_2:256',
          balance: '9000',
          bjj: 'hez:1-WYg_cDxmLQPTxBDF2BdJYNsmK2KcaL6tcueTqWoQ6v',
          hezEthereumAddress: 'hez:0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
          itemId: 1,
          nonce: 0,
          token: [Object]
        }
      ],
      pendingItems: 0
    }
```

We can verify that the balance has been updated as a result of the `forceExit` transaction.

The `Exit` transaction status can be verified using the API.

```js
  const exitInf1 = (await hermez.CoordinatorAPI.getExits(account1.hezEthereumAddress, true)).exits[0]
  console.log(exitInfo1)

>>>>>>

    {
      accountIndex: 'hez:20_2:256',
      balance: '1000',
      batchNum: 8,
      delayedWithdrawRequest: null,
      delayedWithdrawn: null,
      instantWithdrawn: null,
      itemId: 1,
      merkleProof: {
        root: '15930773634968394848237533688003473773942383021984352642025769371194419863398',
        siblings: [
          '20237069565860242721214833379834325487539366600821058428836422236689460816735',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0',
          '0'
        ],
        oldKey: '0',
        oldValue: '0',
        isOld0: false,
        key: '256',
        value: '3233189796127090573603784718448359930448209299931418775008529513224557435764',
        fnc: 0
      },
      token: {
        USD: null,
        decimals: 18,
        ethereumAddress: '0x2e9f55f7266d8c7e07d359daba0e743e331b7a1a',
        ethereumBlockNum: 61,
        fiatUpdate: null,
        id: 3,
        itemId: 4,
        name: 'ERC20_2',
        symbol: '20_2'
      }
    }
```

The information reported will be necessary to complete the `withdraw` stage.

### Withdrawing funds from Hermez

After doing any type of `Exit` transaction, which moves the user's funds from their token account to a specific Exit merkle tree, one needs to do a `withdraw` of those funds to an Ethereum L1 account.
To do a `withdraw` we need to indicate the `accountIndex` the includes the Ethereum address where the funds will be transferred, the amount and type of tokens, and some information
to verify the ownership of those tokens. Additionally, there is one boolean flag. If set to true, the `withdraw` will be instantaneous.

```js
  await hermez.Tx.withdraw(
    amountExit,
    account1.accountIndex,
    tokenERC20,
    hermezWallet.publicKeyCompressedHex,
    exitInfo1.batchNum,
    exitInfo1.merkleProof.siblings,
    true)
```

## Transfer
At this point, a Hermez account is already created with some tokens. The next step is to transfer some funds to another Hermez account.

First, we compute the fees for the transaction. For this we consult the recommended fees from the Coordinator.

```js
  // fee computation
  const state = await hermez.CoordinatorAPI.getState()
  console.log(state.recommendedFee)

>>>>
{
  existingAccount: 0.1,
  createAccount: 1.3,
  createAccountInternal: 0.5
}

```

The returned fees are the suggested fees for different transactions:
- existingAccount : Make a transfer to an existing account.
- createAccount   : Make a transfer to an non-existent account, and create a regular account
- createAccountInternal : Make a transfer to an non-existent account and create internal account

The fee amounts are given in USD. However, fees are payed in the token of the transaction. So, we need to do a conversion.

```js
  const usdTokenExchangeRate = tokenERC20.USD
  const fee = fees.existingAccount / usdTokenExchangeRate
```

The last part is to make the actual transfer. 

```js
  // amount to transfer
  const amountTransfer = hermez.Utils.getTokenAmountBigInt('20', 2)

  // generate L2 transaction
  const l2Tx = {
    from: account1.accountIndex,
    to: account2.accountIndex,
    amount: amountTransfer,
    fee
  }

  const XferResult = await hermez.Tx.generateAndSendL2Tx(l2Tx, hermezWallet, srcAccount.token)
  console.log(xferResult)

>>>>>

  { status: 200, id: '0x020000000001000000000000', nonce: 0 }

```
The result status 200 shows that transaction has been correctly received. Additionally, we receive the nonce matching the transaction we sent, and an id that we can use to verify the status of the transaction.

## Verifying Transaction status
Transactions received by the Coordinator will be stored in its transaction pool while they haven't been processed. To check a transaction in the transaction pool we make a query to the coordinator node.

```js
  const txXferPool = await hermez.CoordinatorAPI.getPoolTransaction(xferResult.id)
  console.log(txXferPool)

>>>>

   {
      amount: '2000',
      batchNum: null,
      fee: 1,
      fromAccountIndex: 'hez:20_2:256',
      fromBJJ: 'hez:1-WYg_cDxmLQPTxBDF2BdJYNsmK2KcaL6tcueTqWoQ6v',
      fromHezEthereumAddress: 'hez:0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
      id: '0x020000000001000000000000',
      nonce: 0,
      requestAmount: null,
      requestFee: null,
      requestFromAccountIndex: null,
      requestNonce: null,
      requestToAccountIndex: null,
      requestToBJJ: null,
      requestToHezEthereumAddress: null,
      requestTokenId: null,
      signature: 'ef27fca61db77585d1e54bc21b404ca227c7776726c94002d95702877cd0468b556523bec7d3ac3dd16bfaea92ae99e188cb4899071d295f5dd8cfed0ef97402',
      state: 'pend',
      timestamp: '2020-12-17T14:36:35.700549Z',
      toAccountIndex: 'hez:20_2:257',
      toBjj: 'hez:_ayj1cwk6Kuch4oodEgYYTRWidBywlsV8cYlOyVPiZzl',
      toHezEthereumAddress: 'hez:0x306469457266CBBe7c0505e8Aad358622235e768',
      token: {
        USD: null,
        decimals: 18,
        ethereumAddress: '0x2e9f55f7266d8c7e07d359daba0e743e331b7a1a',
        ethereumBlockNum: 61,
        fiatUpdate: null,
        id: 3,
        itemId: 4,
        name: 'ERC20_2',
        symbol: '20_2'
      },
      type: 'Transfer'
    }
 
```

At this point, the transactions is still in the coordinator's transaction pool as we can see in the `state` field. There are 4 possible states:
1. **pend** : Pending
2. **fging** : Forging
3. **fged** : Forged
4. **invl** : Invalid

After a few seconds, we verify tthe ransaction status in the list of forged transactions to check if the transaction has been processed:

```js
    // Get transaction confirmation
    const txXferConf = await hermez.CoordinatorAPI.getHistoryTransaction(txXferPool.id)
    console.log(txXferConf)

>>>>>

    {
      L1Info: null,
      L1orL2: 'L2',
      L2Info: { fee: 1, historicFeeUSD: null, nonce: 1 },
      amount: '2000',
      batchNum: 15,
      fromAccountIndex: 'hez:20_2:256',
      fromBJJ: 'hez:1-WYg_cDxmLQPTxBDF2BdJYNsmK2KcaL6tcueTqWoQ6v',
      fromHezEthereumAddress: 'hez:0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
      historicUSD: null,
      id: '0x020000000001000000000000',
      itemId: 9,
      position: 0,
      timestamp: '2020-12-17T21:41:53Z',
      toAccountIndex: 'hez:20_2:257',
      toBJJ: 'hez:_ayj1cwk6Kuch4oodEgYYTRWidBywlsV8cYlOyVPiZzl',
      toHezEthereumAddress: 'hez:0x306469457266CBBe7c0505e8Aad358622235e768',
      token: {
        USD: null,
        decimals: 18,
        ethereumAddress: '0x2e9f55f7266d8c7e07d359daba0e743e331b7a1a',
        ethereumBlockNum: 61,
        fiatUpdate: null,
        id: 3,
        itemId: 4,
        name: 'ERC20_2',
        symbol: '20_2'
      },
      type: 'Transfer'
    }
  }
```
If the API returns an object, it means that the transaction has been forged.

### Exit

A different alternative to retrieve the funds back is by using an L2 `Exit` transaction. The steps
involved to generate an `Exit` transaction are the same as for the `Transfer` transaction we already saw.
The only difference  is that there is no `to` account recipient.

```js
  const l2ExitTx = {
    from: account2.accountIndex,
    amount: amountExit,
    fee
  }

  const l2TxExitResult = await hermez.Tx.generateAndSendL2Tx(l2ExitTx, hermezWallet2, dstAccount.token)
  console.log(l2TxExitResult)

>>>>
  { status: 200, id: '0x020000000001010000000000', nonce: 0 }
```

Again, we can check the status of this last transaction in the Coordinator pool

```js
  // Check transaction in coordinator's transaction pool
  const txExitPool = await hermez.CoordinatorAPI.getPoolTransaction(l2TxExitResult.id)

>>>>>>

    {
      amount: '1000',
      batchNum: null,
      fee: 1,
      fromAccountIndex: 'hez:20_2:257',
      fromBJJ: 'hez:_ayj1cwk6Kuch4oodEgYYTRWidBywlsV8cYlOyVPiZzl',
      fromHezEthereumAddress: 'hez:0x306469457266CBBe7c0505e8Aad358622235e768',
      id: '0x020000000001010000000000',
      nonce: 0,
      requestAmount: null,
      requestFee: null,
      requestFromAccountIndex: null,
      requestNonce: null,
      requestToAccountIndex: null,
      requestToBJJ: null,
      requestToHezEthereumAddress: null,
      requestTokenId: null,
      signature: 'f3c73394b3c167d9fc259081dbe69ff742a52c9db0cd3feb9bff5603487aae042d90a4d46becc7dbe4245c2bfd28f62b590236470338f1687840b82d990c4e05',
      state: 'pend',
      timestamp: '2020-12-17T22:21:43.870526Z',
      toAccountIndex: 'hez:20_2:1',
      toBjj: null,
      toHezEthereumAddress: null,
      token: {
        USD: null,
        decimals: 18,
        ethereumAddress: '0x2e9f55f7266d8c7e07d359daba0e743e331b7a1a',
        ethereumBlockNum: 61,
        fiatUpdate: null,
        id: 3,
        itemId: 4,
        name: 'ERC20_2',
        symbol: '20_2'
      },
      type: 'Exit'
    }

```

And we can query the Coordinator whether or not our transaction has been forged

```js
  const txExitConf = await hermez.CoordinatorAPI.getHistoryTransaction(txExitPool.id)
  console.log(txExitConf)

>>>>>>

    {
      L1Info: null,
      L1orL2: 'L2',
      L2Info: { fee: 1, historicFeeUSD: null, nonce: 1 },
      amount: '1000',
      batchNum: 16,
      fromAccountIndex: 'hez:20_2:257',
      fromBJJ: 'hez:_ayj1cwk6Kuch4oodEgYYTRWidBywlsV8cYlOyVPiZzl',
      fromHezEthereumAddress: 'hez:0x306469457266CBBe7c0505e8Aad358622235e768',
      historicUSD: null,
      id: '0x020000000001010000000000',
      itemId: 10,
      position: 0,
      timestamp: '2020-12-17T22:21:59Z',
      toAccountIndex: 'hez:20_2:1',
      toBJJ: null,
      toHezEthereumAddress: null,
      token: {
        USD: null,
        decimals: 18,
        ethereumAddress: '0x2e9f55f7266d8c7e07d359daba0e743e331b7a1a',
        ethereumBlockNum: 61,
        fiatUpdate: null,
        id: 3,
        itemId: 4,
        name: 'ERC20_2',
        symbol: '20_2'
      },
      type: 'Exit'
    }

```

The funds should now appear in the Ethereum account that made the withdrawal.

