import hermez from './src/index.js'

test('Hermez Tx flow', async () => {
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

  console.log('Deposit')
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
  expect(`hez:${tokenERC20.symbol}:256`).toBe(tx1.accounts[0].accountIndex)
  expect(amountDeposit.toString()).toBe(tx1.accounts[0].balance)
  // TODO check BJJ
  expect(hermezEthereumAddress).toBe(tx1.accounts[0].hezEthereumAddress)

  const tx2 = await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress2, [tokenERC20.id])
  expect(`hez:${tokenERC20.symbol}:257`).toBe(tx2.accounts[0].accountIndex)
  expect(hermezEthereumAddress2).toBe(tx2.accounts[0].hezEthereumAddress)
  // TODO check BJJ
  expect(amountDeposit.toString()).toBe(tx2.accounts[0].balance)

  // Check account by accountIndex
  const tx11 = await hermez.CoordinatorAPI.getAccount(`hez:${tokenERC20.symbol}:256`)
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
  console.log('Force Exit')
  const amountExit = hermez.Utils.getTokenAmountBigInt('10', 2)
  await hermez.Tx.forceExit(amountExit, srcAccount.accountIndex, tokenERC20)
  await hermez.Tx.forceExit(amountExit, dstAccount.accountIndex, tokenERC20)

  await waitNBatches(3)
  const acco = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
  const finalBalance = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
    .accounts[0]
    .balance
  // Check hermez balance
  expect(finalBalance.toString()).toBe((amountDeposit - amountExit).toString())

  /// //////////////////
  // Withdraw from both accounts
  console.log('Withdrawal')
  const exitInfoSrc = (await hermez.CoordinatorAPI.getExits(srcAccount.hezEthereumAddress, true)).exits[0]
  await hermez.Tx.withdraw(amountExit,
    srcAccount.accountIndex,
    tokenERC20,
    hermezWallet.publicKeyCompressedHex,
    exitInfoSrc.batchNum,
    exitInfoSrc.merkleProof.siblings,
    true)
  expect(`hez:${tokenERC20.symbol}:256`).toBe(exitInfoSrc.accountIndex)
  expect(amountExit.toString()).toBe(exitInfoSrc.balance)
  // TODO: check L1 account balance

  const exitInfoDst = (await hermez.CoordinatorAPI.getExits(dstAccount.hezEthereumAddress, true)).exits[0]
  await hermez.Tx.withdraw(amountExit,
    dstAccount.accountIndex,
    tokenERC20,
    hermezWallet2.publicKeyCompressedHex,
    exitInfoDst.batchNum,
    exitInfoDst.merkleProof.siblings,
    true)
  expect(`hez:${tokenERC20.symbol}:257`).toBe(exitInfoDst.accountIndex)
  expect(amountExit.toString()).toBe(exitInfoDst.balance)
  // TODO: check L1 account balance

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

  console.log('Transfer')
  // amount to transfer
  const amountXfer = hermez.Utils.getTokenAmountBigInt('20', 2)

  // generate L2 transaction
  const l2Tx = {
    type: 'Transfer',
    from: srcAccount.accountIndex,
    to: dstAccount.accountIndex,
    amount: hermez.Float16.float2Fix(hermez.Float16.floorFix2Float(amountXfer)),
    fee
    // nonce: srcAccount.nonce
  }

  const xferTx = await hermez.TxUtils.generateL2Transaction(l2Tx,
    hermezWallet.publicKeyCompressedHex,
    srcAccount.token)
  hermezWallet.signTransaction(xferTx.transaction, xferTx.encodedTransaction)
  const XferResult = await hermez.Tx.sendL2Transaction(xferTx.transaction, hermezWallet.publicKeyCompressedHex)
  expect(XferResult.status).toBe(200)

  // Check transaction in coordinator's transaction pool
  const txXferPool = await hermez.CoordinatorAPI.getPoolTransaction(XferResult.id)
  expect(tokenERC20.name).toBe(txXferPool.token.name)
  expect(amountXfer.toString()).toBe(txXferPool.amount)
  expect(`hez:${tokenERC20.symbol}:256`).toBe(txXferPool.fromAccountIndex)
  // TODO fromBJJ
  expect('Transfer').toBe(txXferPool.type)
  expect(XferResult.id).toBe(txXferPool.id)
  expect(`hez:${tokenERC20.symbol}:257`).toBe(txXferPool.toAccountIndex)
  // TODO toBJJ
  expect(hermezEthereumAddress2).toBe(txXferPool.toHezEthereumAddress)
  expect(tokenERC20.id).toBe(txXferPool.token.id)
  expect(tokenERC20.name).toBe(txXferPool.token.name)
  console.log('1')

  await waitNBatches(3)
  console.log('2')
  // Check transaction has been processed
  const txXferConf = await hermez.CoordinatorAPI.getHistoryTransaction(txXferPool.id)
  console.log('XferConf', txXferConf)
  console.log('3')
  expect(null).toBe(txXferConf.L1Info)
  console.log('4')
  expect('L2').toBe(txXferConf.L1orL2)
  console.log('6')
  expect(amountXfer.toString()).toBe(txXferConf.amount)
  expect(`hez:${tokenERC20.symbol}:256`).toBe(txXferConf.fromAccountIndex)
  expect(hermezEthereumAddress).toBe(txXferConf.fromHezEthereumAddress)
  expect(XferResult.id).toBe(txXferConf.id)
  expect(`hez:${tokenERC20.symbol}:257`).toBe(txXferConf.toAccountIndex)
  console.log('7')
  expect(hermezEthereumAddress2).toBe(txXferConf.toHezEthereumAddress)
  expect(tokenERC20.id).toBe(txXferConf.token.id)
  console.log('8')
  expect(tokenERC20.name).toBe(txXferConf.token.name)
  expect('Transfer').toBe(txXferConf.type)

  /// ///////////////////////////
  // Exit (L2)

  console.log('Exit')
  // generate L2 transaction
  const l2ExitTx = {
    type: 'Exit',
    from: dstAccount.accountIndex,
    // TODO : Hermezjs should calculate exit account
    to: `hez:${tokenERC20.symbol}:1`,
    amount: hermez.Float16.float2Fix(hermez.Float16.floorFix2Float(amountExit)),
    fee
    // nonce: dstAccount.nonce
  }

  const exitTx = await hermez.TxUtils.generateL2Transaction(
    l2ExitTx,
    hermezWallet2.publicKeyCompressedHex,
    dstAccount.token)
  hermezWallet2.signTransaction(exitTx.transaction, exitTx.encodedTransaction)
  const l2TxExitResult = await hermez.Tx.sendL2Transaction(exitTx.transaction,
    hermezWallet2.publicKeyCompressedHex)
  expect(l2TxExitResult.status).toBe(200)

  // Check transaction in coordinator's transaction pool
  const txExitPool = await hermez.CoordinatorAPI.getPoolTransaction(l2TxExitResult.id)
  expect(tokenERC20.name).toBe(txExitPool.token.name)
  expect(amountExit.toString()).toBe(txExitPool.amount)
  expect(`hez:${tokenERC20.symbol}:257`).toBe(txExitPool.fromAccountIndex)
  // TODO fromBJJ
  expect('Exit').toBe(txExitPool.type)
  expect(l2TxExitResult.id).toBe(txExitPool.id)
  expect(hermezEthereumAddress2).toBe(txExitPool.fromHezEthereumAddress)
  expect(tokenERC20.id).toBe(txExitPool.token.id)
  expect(tokenERC20.name).toBe(txExitPool.token.name)

  await waitNBatches(3)

  // Check transaction has been processed
  const txExitConf = await hermez.CoordinatorAPI.getHistoryTransaction(txExitPool.id)
  expect(null).toBe(txExitConf.L1Info)
  expect('L2').toBe(txExitConf.L1orL2)
  expect(amountExit.toString()).toBe(txExitConf.amount)
  expect(`hez:${tokenERC20.symbol}:257`).toBe(txExitConf.fromAccountIndex)
  expect(hermezEthereumAddress2).toBe(txExitConf.fromHezEthereumAddress)
  expect(l2TxExitResult.id).toBe(txExitConf.id)
  expect(`hez:${tokenERC20.symbol}:1`).toBe(txExitConf.toAccountIndex)
  expect(null).toBe(txExitConf.toHezEthereumAddress)
  expect(tokenERC20.id).toBe(txExitConf.token.id)
  expect(tokenERC20.name).toBe(txExitConf.token.name)
  expect('Exit').toBe(txExitConf.type)

  /// ////////////////////
  // Withdraw
  console.log('Withdrawal')
  const exitInfo = (await hermez.CoordinatorAPI.getExits(dstAccount.hezEthereumAddress, true)).exits[0]
  expect(`hez:${tokenERC20.symbol}:257`).toBe(exitInfo.accountIndex)
  expect(amountExit.toString()).toBe(exitInfo.balance)
  expect(tokenERC20.id).toBe(exitInfo.token.id)
  expect(tokenERC20.name).toBe(exitInfo.token.name)

  await hermez.Tx.withdraw(amountExit,
    dstAccount.accountIndex,
    tokenERC20,
    hermezWallet2.publicKeyCompressedHex,
    exitInfo.batchNum,
    exitInfo.merkleProof.siblings,
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
