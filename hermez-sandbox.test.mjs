import hermez from './src/index.js'

test('getTokens', async () => {
  var i

  // Init network provider.
  hermez.Providers.setProvider('http://localhost:8545')

  // Initialize Transaction Pool
  // Transaction Pool declares an instance in LocalStorage where user transactions are stored.
  // When a L1Tx or L2Tx is sent, the transaction is also kept in the LocalStorage
  hermez.TxPool.initializeTransactionPool()

  // Create 2 wallets
  // To create a wallet, we need to provide a signature and a hermez ethereum address.
  //  Signature is created with a standard message (METAMASK_MESSAGE)
  //  Hermez ethereum address is created by appending 'hez:' to the ethereum address.
  // In this example we create a standard wallet. It is also possible to link the hermez wallet to a existing
  // Metamask wallet
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(1)
  const hermezWallet = wallet.hermezWallet
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // Create 2nd wallet
  const wallet2 = await hermez.HermezWallet.createWalletFromEtherAccount(2)
  const hermezWallet2 = wallet2.hermezWallet
  const hermezEthereumAddress2 = wallet2.hermezEthereumAddress

  // There should be some tokens already registered in Hermez. Verify
  // retrieve token info from Hermez network
  const token = await hermez.CoordinatorAPI.getTokens()
  // ERC20 Token -> Pick 3rd token
  const tokenERC20 = token.tokens[3]

  // fee computation
  const state = await hermez.CoordinatorAPI.getState()
  const usdTokenExchangeRate = tokenERC20.USD
  const fee = usdTokenExchangeRate ? state.recommendedFee.existingAccount / usdTokenExchangeRate : 0

  // TODO: Make a param
  expect(token.tokens.length).toBe(11)
  // Ether.
  expect(token.tokens[0].ethereumAddress).toBe('0x0000000000000000000000000000000000000000')

  for (i = 1; i < 6; i++) {
    expect(token.tokens[i].name).toBe('ERC20_'.concat(i - 1).toString())
  }
  for (i = 6; i < 11; i++) {
    expect(token.tokens[i].name).toBe('ERC20P_'.concat(i - 6).toString())
  }

  /// ///
  // Deposit
  // First transaction is a deposit from the ethereum address into hermez network. Since a hermez
  // account associated to the ethereum address doesn't exist at this point, this deposit transaction
  // will also create one.
  // The steps to do a deposit are:
  //   - Select amount to deposit from ethereum into hermez using getTokenAmountBitInt
  //   - Select the token denomination of the deposit. Hermez contains a list of supported token that
  //      can be queried with getTokens(). This function returns the list of supported tokens. Only
  //      tokens in this list can be used.
  //   - Sender Hermez address
  //   - Sender Compresed Babyjubjub

  const amountDeposit = hermez.Utils.getTokenAmountBigInt('100', 2)

  // make deposit of ERC20 Tokens
  await hermez.Tx.deposit(amountDeposit,
    hermezEthereumAddress,
    tokenERC20,
    hermezWallet.publicKeyCompressedHex)

  // make deposit of ERC20 Tokens in new account
  await hermez.Tx.deposit(amountDeposit,
    hermezEthereumAddress2,
    tokenERC20,
    hermezWallet2.publicKeyCompressedHex)

  // Wait until transaction is forged
  await waitNBatches(3)

  // Check accounts status
  const tx1 = await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id])
  /*
    TX1 {
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
  */

  expect(`hez:${tokenERC20.symbol}:256`).toBe(tx1.accounts[0].accountIndex)
  expect(amountDeposit.toString()).toBe(tx1.accounts[0].balance)
  // TODO check BJJ
  expect(hermezEthereumAddress).toBe(tx1.accounts[0].hezEthereumAddress)
  // TODO check nonce -> always 0 so dont
  // TODO check token
  /*
    Token {
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
  */

  const tx2 = await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress2, [tokenERC20.id])
  expect(hermezEthereumAddress2).toBe(tx2.accounts[0].hezEthereumAddress)
  expect(`hez:${tokenERC20.symbol}:257`).toBe(tx2.accounts[0].accountIndex)
  expect(amountDeposit.toString()).toBe(tx2.accounts[0].balance)

  // Check account by accountIndex
  const tx11 = await hermez.CoordinatorAPI.getAccount(`hez:${tokenERC20.symbol}:256`)
  /*
    TX11 {
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
  */

  expect(`hez:${tokenERC20.symbol}:256`).toBe(tx11.accountIndex)
  expect(amountDeposit.toString()).toBe(tx11.balance)
  // TODO : bjj
  expect(hermezEthereumAddress).toBe(tx11.hezEthereumAddress)

  const tx21 = await hermez.CoordinatorAPI.getAccount(`hez:${tokenERC20.symbol}:257`)
  expect(`hez:${tokenERC20.symbol}:257`).toBe(tx21.accountIndex)
  expect(amountDeposit.toString()).toBe(tx21.balance)
  // TODO : bjj
  expect(hermezEthereumAddress2).toBe(tx21.hezEthereumAddress)

  // src account
  const srcAccount = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
    .accounts[0]
  // dst account
  const dstAccount = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress2, [tokenERC20.id]))
    .accounts[0]

  /// /////////////////////
  // Force Exit (L1)
  const amountExit = hermez.Utils.getTokenAmountBigInt('10', 2)
  await hermez.Tx.forceExit(amountExit, srcAccount.accountIndex, tokenERC20)
  await hermez.Tx.forceExit(amountExit, dstAccount.accountIndex, tokenERC20)

  await waitNBatches(3)
  const finalBalance = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
    .accounts[0]
    .balance
  // Check hermez balance
  expect(finalBalance.toString()).toBe((amountDeposit - amountExit).toString())

  /// //////////////////
  // Withdraw from both accounts
  const exitInfoSrc = (await hermez.CoordinatorAPI.getExits(srcAccount.hezEthereumAddress, true)).exits[0]
  await hermez.Tx.withdraw(amountExit,
    srcAccount.accountIndex,
    tokenERC20,
    hermezWallet.publicKeyCompressedHex,
    exitInfoSrc.batchNum,
    exitInfoSrc.merkleProof.siblings,
    true,
    true)
  /*
    ExitISrc {
      accountIndex: 'hez:20_2:256',
      balance: '1000',
      batchNum: 44,
      delayedWithdrawRequest: null,
      delayedWithdrawn: null,
      instantWithdrawn: null,
      itemId: 1,
      merkleProof: {
        root: '15930773634968394848237533688003473773942383021984352642025769371194419863398',
        siblings: [
          '20237069565860242721214833379834325487539366600821058428836422236689460816735',
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
    */

  const exitInfoDst = (await hermez.CoordinatorAPI.getExits(dstAccount.hezEthereumAddress, true)).exits[0]
  await hermez.Tx.withdraw(amountExit,
    dstAccount.accountIndex,
    tokenERC20,
    hermezWallet2.publicKeyCompressedHex,
    exitInfoDst.batchNum,
    exitInfoDst.merkleProof.siblings,
    true,
    true)

  /// ////////////////
  // Transfer
  //  Transfer is a L2 transaction. At this point, Hermez source account is already created with
  //  some amount of tokens.
  //  The steps to configure a transfer transaction are:
  //  - Generate the L2 transaction locally first by calling generateL2Transaction(). This function
  //     returns a temporary transaction + a compressed transaction.
  //     For this we need:
  //     * Source account index -> retrieved by calling getAccounts with sender hermez address and token id
  //        of the token used for the transfer. Source account index must exist.
  //     * Destination account index -> retrieved by calling getAccounts with sender hermez address and token id. If its an Exit, set it to false
  //        of the token used for the transfer. Destination account undex must exit. Additionally, token id
  //        associated to source account must much token id associated to destination account.
  //     * Amount of tokens to transfer. Sender must have enough funds.
  //     * Fee : Amount to be paid to coordinator. The fee will be paid in the same denomination as the token
  //        of the transaction. Recommended feeds can be retrieved using getFees().
  //     * Nonce : current noce of the sender's token account, retrieved with getAccounts() function
  //     * Sender compressed BabyJubJub un hex format
  //     * Token object recovered from hermez when calling getAccounts()
  //   - Sign compressed transaction and store result as part of the transaction. For this, ouw babyjub wallet
  //      was a signature function signTransaction()
  //   - Send the transaction to the coordinator

  // amount to transfer
  const amountXfer = hermez.Utils.getTokenAmountBigInt('10', 2)

  // generate L2 transaction
  const l2Tx = {
    type: 'Transfer',
    from: srcAccount.accountIndex,
    to: dstAccount.accountIndex,
    amount: hermez.Float16.float2Fix(hermez.Float16.floorFix2Float(amountXfer)),
    fee,
    nonce: srcAccount.nonce
  }

  const xferTx = await hermez.TxUtils.generateL2Transaction(l2Tx,
    hermezWallet.publicKeyCompressedHex,
    srcAccount.token)
  hermezWallet.signTransaction(xferTx.transaction, xferTx.encodedTransaction)
  const XferResult = await hermez.Tx.sendL2Transaction(xferTx.transaction, hermezWallet.publicKeyCompressedHex)
  // XferResult { status: 200, id: '0x020000000001000000000000', nonce: 0 }

  // Check transaction in coordinator's transaction pool
  const txXferPool = await hermez.CoordinatorAPI.getPoolTransaction(XferResult.id)
  /*
    txXferPool {
      amount: '1000',
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
      signature: '7d3b80fb99117dc53cee880dcac001e96b3c28c8df8dfbc17aad70e9578abc157f03bc894e14cf09d5a85d4a467c384ec12535263844e20c42d592b736920905',
      state: 'pend',
      timestamp: '2020-12-17T06:35:04.791194Z',
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
   */

  await waitNBatches(3)

  // Check transaction has been processed
  const txXferConf = await hermez.CoordinatorAPI.getHistoryTransaction(txXferPool.id)
  /*
  txXferConf {
      L1Info: null,
      L1orL2: 'L2',
      L2Info: { fee: 1, historicFeeUSD: null, nonce: 1 },
      amount: '1000',
      batchNum: 47,
      fromAccountIndex: 'hez:20_2:256',
      fromBJJ: 'hez:1-WYg_cDxmLQPTxBDF2BdJYNsmK2KcaL6tcueTqWoQ6v',
      fromHezEthereumAddress: 'hez:0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
      historicUSD: null,
      id: '0x020000000001000000000000',
      itemId: 9,
      position: 0,
      timestamp: '2020-12-17T06:35:20Z',
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
  */

  /// ///////////////////////////
  // Exit (L2)

  // generate L2 transaction
  const l2ExitTx = {
    type: 'Exit',
    from: dstAccount.accountIndex,
    to: `hez:${tokenERC20.symbol}:1`,
    amount: hermez.Float16.float2Fix(hermez.Float16.floorFix2Float(amountExit)),
    fee,
    nonce: dstAccount.nonce
  }

  const exitTx = await hermez.TxUtils.generateL2Transaction(
    l2ExitTx,
    hermezWallet2.publicKeyCompressedHex,
    dstAccount.token)
  hermezWallet2.signTransaction(exitTx.transaction, exitTx.encodedTransaction)
  const l2TxExitResult = await hermez.Tx.sendL2Transaction(exitTx.transaction,
    hermezWallet2.publicKeyCompressedHex)
  // l2TxExitResult { status: 200, id: '0x020000000001010000000000', nonce: 0 }

  // Check transaction in coordinator's transaction pool
  const txExitPool = await hermez.CoordinatorAPI.getPoolTransaction(l2TxExitResult.id)
  /*
 txExitPool {
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
      timestamp: '2020-12-17T06:37:07.679496Z',
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
  */

  await waitNBatches(3)

  // Check transaction has been processed
  const txExitConf = await hermez.CoordinatorAPI.getHistoryTransaction(txExitPool.id)
  /*
 txExitConf {
      L1Info: null,
      L1orL2: 'L2',
      L2Info: { fee: 1, historicFeeUSD: null, nonce: 1 },
      amount: '1000',
      batchNum: 54,
      fromAccountIndex: 'hez:20_2:257',
      fromBJJ: 'hez:_ayj1cwk6Kuch4oodEgYYTRWidBywlsV8cYlOyVPiZzl',
      fromHezEthereumAddress: 'hez:0x306469457266CBBe7c0505e8Aad358622235e768',
      historicUSD: null,
      id: '0x020000000001010000000000',
      itemId: 10,
      position: 0,
      timestamp: '2020-12-17T06:37:23Z',
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
  */

  /// ////////////////////
  // Withdraw
  const exitInfo = (await hermez.CoordinatorAPI.getExits(dstAccount.hezEthereumAddress, true)).exits[0]
  /*
 exitInfo {
      accountIndex: 'hez:20_2:257',
      balance: '1000',
      batchNum: 54,
      delayedWithdrawRequest: null,
      delayedWithdrawn: null,
      instantWithdrawn: null,
      itemId: 3,
      merkleProof: {
        root: '20237069565860242721214833379834325487539366600821058428836422236689460816735',
        siblings: [
          '0', '0', '0', '0', '0', '0',
          '0', '0', '0', '0', '0', '0',
          '0', '0', '0', '0', '0', '0',
          '0', '0', '0', '0', '0', '0',
          '0', '0', '0', '0', '0', '0',
          '0', '0', '0'
        ],
        oldKey: '0',
        oldValue: '0',
        isOld0: false,
        key: '257',
        value: '713350510735653878340100485826090483179576041267077696317320125549707814496',
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
  */
  await hermez.Tx.withdraw(amountExit,
    dstAccount.accountIndex,
    tokenERC20,
    hermezWallet2.publicKeyCompressedHex,
    exitInfo.batchNum,
    exitInfo.merkleProof.siblings,
    true,
    true)
}, 3000000)

// Wait some batches
async function waitNBatches (nBatches) {
  // TODO . lastBatch is null many times
  var lastBatch = (await hermez.CoordinatorAPI.getState()).network.lastBatch
  while (true) {
    var currentBatch = (await hermez.CoordinatorAPI.getState()).network.lastBatch
    if (lastBatch != null &&
        currentBatch != null &&
        currentBatch.batchNum - lastBatch.batchNum > nBatches) {
      break
    }
    if (lastBatch == null) {
      lastBatch = (await hermez.CoordinatorAPI.getState()).network.lastBatch
      currentBatch = lastBatch
    }
    if (currentBatch == null) {
      currentBatch = (await hermez.CoordinatorAPI.getState()).network.lastBatch
    }
    await sleep(2000)
  }
}

async function sleep (timeout) {
  await new Promise(resolve => setTimeout(resolve, timeout))
}
