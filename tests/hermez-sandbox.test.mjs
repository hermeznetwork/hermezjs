import hermez from '../src/index.js'
import * as utilsSandbox from './helpers/utils-sandbox.js'

describe('Flow sandbox', () => {
  const accounts = []
  let allTokens
  let tokenERC20
  let fee

  let accountA
  let accountB

  let nProcessedTransactions
  let nExpectedProcessedTransactions

  const depositAmount = hermez.Utils.getTokenAmountBigInt('10000', 18)
  const exitAmount = hermez.Utils.getTokenAmountBigInt('10', 18)
  const transferAmount = hermez.Utils.getTokenAmountBigInt('20', 18)

  // Initialize Hermez Network
  test('Init variables', async () => {
    // Init network provider.
    hermez.Providers.setProvider('http://localhost:8545')

    // Initialize Transaction Pool
    hermez.TxPool.initializeTransactionPool()

    // add accounts
    accounts.push(await hermez.HermezWallet.createWalletFromEtherAccount(1))
    accounts.push(await hermez.HermezWallet.createWalletFromEtherAccount(2))

    // set token to transfer
    allTokens = await hermez.CoordinatorAPI.getTokens()
    tokenERC20 = allTokens.tokens[3]

    // fee computation
    const state = await hermez.CoordinatorAPI.getState()
    const usdTokenExchangeRate = tokenERC20.USD
    fee = usdTokenExchangeRate ? state.recommendedFee.existingAccount / usdTokenExchangeRate : 0
  }, 300000)

  // Check Hermez Network initialization
  test('Check tokens', async () => {
    const numTokens = 11

    expect(allTokens.tokens.length).toBe(numTokens)
    // first token is ether and represented as 0x00...000 address
    expect(allTokens.tokens[0].ethereumAddress).toBe('0x0000000000000000000000000000000000000000')

    for (let i = 1; i < 6; i++) {
      expect(allTokens.tokens[i].name).toBe('ERC20_'.concat(i - 1).toString())
    }
    for (let i = 6; i < 11; i++) {
      expect(allTokens.tokens[i].name).toBe('ERC20P_'.concat(i - 6).toString())
    }
  }, 300000)

  // Make two deposits to two different accounts and check account status
  test('Check deposit', async () => {
    nExpectedProcessedTransactions = 2

    // perform deposit for accounts[0]
    await hermez.Tx.deposit(
      depositAmount,
      accounts[0].hermezEthereumAddress,
      tokenERC20,
      accounts[0].hermezWallet.publicKeyCompressedHex
    )

    // perform deposit for accounts[1]
    await hermez.Tx.deposit(
      depositAmount,
      accounts[1].hermezEthereumAddress,
      tokenERC20,
      accounts[1].hermezWallet.publicKeyCompressedHex
    )

    // Wait until transaction is forged
    await utilsSandbox.waitNBatches(3)

    const txProcessed = await hermez.CoordinatorAPI.getTransactions()
    nProcessedTransactions = txProcessed.transactions.length
    expect(nProcessedTransactions).toBe(nExpectedProcessedTransactions)
    nExpectedProcessedTransactions = nProcessedTransactions

    // check accounts[0] status
    const accountsInfo0 = await hermez.CoordinatorAPI.getAccounts(accounts[0].hermezEthereumAddress, [tokenERC20.id])

    expect(`hez:${tokenERC20.symbol}:256`).toBe(accountsInfo0.accounts[0].accountIndex)
    expect(depositAmount.toString()).toBe(accountsInfo0.accounts[0].balance)
    expect(accounts[0].hermezEthereumAddress).toBe(accountsInfo0.accounts[0].hezEthereumAddress)

    const accountInfo0 = await hermez.CoordinatorAPI.getAccount(`hez:${tokenERC20.symbol}:256`)
    expect(`hez:${tokenERC20.symbol}:256`).toBe(accountInfo0.accountIndex)
    expect(depositAmount.toString()).toBe(accountInfo0.balance)
    expect(accounts[0].hermezEthereumAddress).toBe(accountInfo0.hezEthereumAddress)

    // check accounts[1] status
    const accountsInfo1 = await hermez.CoordinatorAPI.getAccounts(accounts[1].hermezEthereumAddress, [tokenERC20.id])

    expect(`hez:${tokenERC20.symbol}:257`).toBe(accountsInfo1.accounts[0].accountIndex)
    expect(accounts[1].hermezEthereumAddress).toBe(accountsInfo1.accounts[0].hezEthereumAddress)
    expect(depositAmount.toString()).toBe(accountsInfo1.accounts[0].balance)

    const accountInfo1 = await hermez.CoordinatorAPI.getAccount(`hez:${tokenERC20.symbol}:257`)
    expect(`hez:${tokenERC20.symbol}:257`).toBe(accountInfo1.accountIndex)
    expect(depositAmount.toString()).toBe(accountInfo1.balance)
    expect(accounts[1].hermezEthereumAddress).toBe(accountInfo1.hezEthereumAddress)

    // sender accounts is accounts[0]
    accountA = (await hermez.CoordinatorAPI.getAccounts(accounts[0].hermezEthereumAddress, [tokenERC20.id]))
      .accounts[0]

    // receiver accounts is accounts[1]
    accountB = (await hermez.CoordinatorAPI.getAccounts(accounts[1].hermezEthereumAddress, [tokenERC20.id]))
      .accounts[0]
  }, 300000)

  // Test Force exit transaction
  test('Check force exit', async () => {
    nExpectedProcessedTransactions += 2

    // perform force exut for accounts[0]
    await hermez.Tx.forceExit(exitAmount, accountA.accountIndex, tokenERC20)
    // perform force exut for accounts[1]
    await hermez.Tx.forceExit(exitAmount, accountB.accountIndex, tokenERC20)

    // Wait until transaction is forged
    await utilsSandbox.waitNBatches(3)

    const txProcessed = await hermez.CoordinatorAPI.getTransactions()
    nProcessedTransactions = txProcessed.transactions.length
    expect(nProcessedTransactions).toBe(nExpectedProcessedTransactions)
    nExpectedProcessedTransactions = nProcessedTransactions

    // check balances
    const finalBalanceSender = (await hermez.CoordinatorAPI.getAccounts(accounts[0].hermezEthereumAddress, [tokenERC20.id]))
      .accounts[0]
      .balance

    const finalBalanceReceiver = (await hermez.CoordinatorAPI.getAccounts(accounts[1].hermezEthereumAddress, [tokenERC20.id]))
      .accounts[0]
      .balance

    // check balance sender
    const expectedBalance = utilsSandbox.normalizaBigIntString(depositAmount - exitAmount)
    expect(finalBalanceReceiver.toString()).toBe(expectedBalance)
  }, 300000)

  // Test Withdrawal transaction
  test('Check withdrawal', async () => {
    // get exit information sender & receiver accounts
    const exitInfoSender = (await hermez.CoordinatorAPI.getExits(accountA.hezEthereumAddress, true)).exits[0]
    const exitInfoReceiver = (await hermez.CoordinatorAPI.getExits(accountB.hezEthereumAddress, true)).exits[0]

    // perform withdraw sender & receiver accounts
    await hermez.Tx.withdraw(
      exitAmount,
      accountA.accountIndex,
      tokenERC20,
      accounts[0].hermezWallet.publicKeyCompressedHex,
      exitInfoSender.batchNum,
      exitInfoSender.merkleProof.siblings,
      true
    )

    await hermez.Tx.withdraw(
      exitAmount,
      accountB.accountIndex,
      tokenERC20,
      accounts[1].hermezWallet.publicKeyCompressedHex,
      exitInfoReceiver.batchNum,
      exitInfoReceiver.merkleProof.siblings,
      true
    )

    // check withdraw
    expect(`hez:${tokenERC20.symbol}:256`).toBe(exitInfoSender.accountIndex)
    expect(exitAmount.toString()).toBe(exitInfoSender.balance)

    expect(`hez:${tokenERC20.symbol}:257`).toBe(exitInfoReceiver.accountIndex)
    expect(exitAmount.toString()).toBe(exitInfoReceiver.balance)
    // TODO: check L1 accounts balance
  }, 300000)

  // Test single transfer
  test('Check Single L2 transfer', async () => {
    nExpectedProcessedTransactions += 1

    // generate L2 transaction
    const transferParams = {
      type: 'Transfer',
      from: accountA.accountIndex,
      to: accountB.accountIndex,
      amount: transferAmount,
      fee
    }

    // send transaction to coordinator
    const transferResult = await hermez.Tx.generateAndSendL2Tx(transferParams, accounts[0].hermezWallet, accountA.token)
    expect(transferResult.status).toBe(200)

    // check transaction in coordinator's transaction pool
    const transferPool = await hermez.CoordinatorAPI.getPoolTransaction(transferResult.id)

    expect(tokenERC20.name).toBe(transferPool.token.name)
    expect(transferAmount.toString()).toBe(transferPool.amount)
    expect(`hez:${tokenERC20.symbol}:256`).toBe(transferPool.fromAccountIndex)
    expect('Transfer').toBe(transferPool.type)
    expect(transferResult.id).toBe(transferPool.id)
    expect(`hez:${tokenERC20.symbol}:257`).toBe(transferPool.toAccountIndex)
    expect(accounts[1].hermezEthereumAddress).toBe(transferPool.toHezEthereumAddress)
    expect(tokenERC20.id).toBe(transferPool.token.id)
    expect(tokenERC20.name).toBe(transferPool.token.name)

    // Wait until transaction is forged
    await utilsSandbox.waitNBatches(3)

    const txProcessed = await hermez.CoordinatorAPI.getTransactions()
    nProcessedTransactions = txProcessed.transactions.length
    expect(nProcessedTransactions).toBe(nExpectedProcessedTransactions)
    nExpectedProcessedTransactions = nProcessedTransactions

    // check transaction has been processed
    const transferProcessed = await hermez.CoordinatorAPI.getHistoryTransaction(transferPool.id)

    expect(null).toBe(transferProcessed.L1Info)
    expect('L2').toBe(transferProcessed.L1orL2)
    expect(transferAmount.toString()).toBe(transferProcessed.amount)
    expect(`hez:${tokenERC20.symbol}:256`).toBe(transferProcessed.fromAccountIndex)
    expect(accounts[0].hermezEthereumAddress).toBe(transferProcessed.fromHezEthereumAddress)
    expect(transferPool.id).toBe(transferProcessed.id)
    expect(`hez:${tokenERC20.symbol}:257`).toBe(transferProcessed.toAccountIndex)
    expect(accounts[1].hermezEthereumAddress).toBe(transferProcessed.toHezEthereumAddress)
    expect(tokenERC20.id).toBe(transferProcessed.token.id)
    expect(tokenERC20.name).toBe(transferProcessed.token.name)
    expect('Transfer').toBe(transferProcessed.type)
  }, 300000)

  // Test two transfers in the same batch. One from A to B and the other from B to A
  test('Check Two L2 transfers from different accounts in same batch', async () => {
    nExpectedProcessedTransactions += 2

    // generate L2 transaction
    const transferParams1 = {
      type: 'Transfer',
      from: accountA.accountIndex,
      to: accountB.accountIndex,
      amount: transferAmount,
      fee
    }
    const transferParams2 = {
      type: 'Transfer',
      from: accountB.accountIndex,
      to: accountA.accountIndex,
      amount: transferAmount,
      fee
    }

    // send transaction to coordinator
    const transferResult1 = await hermez.Tx.generateAndSendL2Tx(transferParams1, accounts[0].hermezWallet, accountA.token)
    expect(transferResult1.status).toBe(200)

    const transferResult2 = await hermez.Tx.generateAndSendL2Tx(transferParams2, accounts[1].hermezWallet, accountB.token)
    expect(transferResult2.status).toBe(200)

    // check transaction in coordinator's transaction pool
    const transferPool1 = await hermez.CoordinatorAPI.getPoolTransaction(transferResult1.id)
    const transferPool2 = await hermez.CoordinatorAPI.getPoolTransaction(transferResult2.id)

    expect(tokenERC20.name).toBe(transferPool1.token.name)
    expect(transferAmount.toString()).toBe(transferPool1.amount)
    expect(`hez:${tokenERC20.symbol}:256`).toBe(transferPool1.fromAccountIndex)
    expect('Transfer').toBe(transferPool1.type)
    expect(transferResult1.id).toBe(transferPool1.id)
    expect(`hez:${tokenERC20.symbol}:257`).toBe(transferPool1.toAccountIndex)
    expect(accounts[1].hermezEthereumAddress).toBe(transferPool1.toHezEthereumAddress)
    expect(tokenERC20.id).toBe(transferPool1.token.id)
    expect(tokenERC20.name).toBe(transferPool1.token.name)

    expect(tokenERC20.name).toBe(transferPool2.token.name)
    expect(transferAmount.toString()).toBe(transferPool2.amount)
    expect(`hez:${tokenERC20.symbol}:257`).toBe(transferPool2.fromAccountIndex)
    expect('Transfer').toBe(transferPool2.type)
    expect(transferResult2.id).toBe(transferPool2.id)
    expect(`hez:${tokenERC20.symbol}:256`).toBe(transferPool2.toAccountIndex)
    expect(accounts[0].hermezEthereumAddress).toBe(transferPool2.toHezEthereumAddress)
    expect(tokenERC20.id).toBe(transferPool2.token.id)
    expect(tokenERC20.name).toBe(transferPool2.token.name)

    // Wait until transaction is forged
    await utilsSandbox.waitNBatches(3)

    const txProcessed = await hermez.CoordinatorAPI.getTransactions()
    nProcessedTransactions = txProcessed.transactions.length
    expect(nProcessedTransactions).toBe(nExpectedProcessedTransactions)
    nExpectedProcessedTransactions = nProcessedTransactions

    // check transaction has been processed
    const transferProcessed1 = await hermez.CoordinatorAPI.getHistoryTransaction(updatedTxId1)
    const transferProcessed2 = await hermez.CoordinatorAPI.getHistoryTransaction(updatedTxId2)

    expect(null).toBe(transferProcessed1.L1Info)
    expect('L2').toBe(transferProcessed1.L1orL2)
    expect(transferAmount.toString()).toBe(transferProcessed1.amount)
    expect(`hez:${tokenERC20.symbol}:256`).toBe(transferProcessed1.fromAccountIndex)
    expect(accounts[0].hermezEthereumAddress).toBe(transferProcessed1.fromHezEthereumAddress)
    expect(updatedTxId1).toBe(transferProcessed1.id)
    expect(`hez:${tokenERC20.symbol}:257`).toBe(transferProcessed1.toAccountIndex)
    expect(accounts[1].hermezEthereumAddress).toBe(transferProcessed1.toHezEthereumAddress)
    expect(tokenERC20.id).toBe(transferProcessed1.token.id)
    expect(tokenERC20.name).toBe(transferProcessed1.token.name)
    expect('Transfer').toBe(transferProcessed1.type)

    expect(null).toBe(transferProcessed2.L1Info)
    expect('L2').toBe(transferProcessed2.L1orL2)
    expect(transferAmount.toString()).toBe(transferProcessed2.amount)
    expect(`hez:${tokenERC20.symbol}:257`).toBe(transferProcessed2.fromAccountIndex)
    expect(accounts[1].hermezEthereumAddress).toBe(transferProcessed2.fromHezEthereumAddress)
    expect(updatedTxId2).toBe(transferProcessed2.id)
    expect(`hez:${tokenERC20.symbol}:256`).toBe(transferProcessed2.toAccountIndex)
    expect(accounts[0].hermezEthereumAddress).toBe(transferProcessed2.toHezEthereumAddress)
    expect(tokenERC20.id).toBe(transferProcessed2.token.id)
    expect(tokenERC20.name).toBe(transferProcessed2.token.name)
    expect('Transfer').toBe(transferProcessed2.type)
  }, 300000)

  // Test NxTransfers in same batch
  test('Check multiple L2 transfer in same batch', async () => {
    const nTransfers = 10

    const transferPool = []

    nExpectedProcessedTransactions += nTransfers

    for (var i = 0; i < nTransfers; i++) {
      // Tx params
      const transferParams = {
        type: 'Transfer',
        from: accountA.accountIndex,
        to: accountB.accountIndex,
        amount: transferAmount,
        fee
      }

      // send transaction to coordinator
      const transferResult = await hermez.Tx.generateAndSendL2Tx(transferParams, accounts[0].hermezWallet, accountA.token)
      expect(transferResult.status).toBe(200)

      // check transaction in coordinator's transaction pool
      transferPool.push(await hermez.CoordinatorAPI.getPoolTransaction(transferResult.id))

      expect(tokenERC20.name).toBe(transferPool[i].token.name)
      expect(transferAmount.toString()).toBe(transferPool[i].amount)
      expect(`hez:${tokenERC20.symbol}:256`).toBe(transferPool[i].fromAccountIndex)
      expect('Transfer').toBe(transferPool[i].type)
      expect(transferResult.id).toBe(transferPool[i].id)
      expect(`hez:${tokenERC20.symbol}:257`).toBe(transferPool[i].toAccountIndex)
      expect(accounts[1].hermezEthereumAddress).toBe(transferPool[i].toHezEthereumAddress)
      expect(tokenERC20.id).toBe(transferPool[i].token.id)
      expect(tokenERC20.name).toBe(transferPool[i].token.name)
    }

    // Wait until transaction is forged
    await utilsSandbox.waitNBatches(3)

    const txProcessed = await hermez.CoordinatorAPI.getTransactions()
    nProcessedTransactions = txProcessed.transactions.length
    expect(nProcessedTransactions).toBe(nExpectedProcessedTransactions)
    nExpectedProcessedTransactions = nProcessedTransactions

    for (var i = 0; i < nTransfers; i++) {
      // check transaction has been processed
      const transferProcessed = await hermez.CoordinatorAPI.getHistoryTransaction(transferPool[i].id)

      expect(null).toBe(transferProcessed.L1Info)
      expect('L2').toBe(transferProcessed.L1orL2)
      expect(transferAmount.toString()).toBe(transferProcessed.amount)
      expect(`hez:${tokenERC20.symbol}:256`).toBe(transferProcessed.fromAccountIndex)
      expect(accounts[0].hermezEthereumAddress).toBe(transferProcessed.fromHezEthereumAddress)
      expect(transferPool[i].id).toBe(transferProcessed.id)
      expect(`hez:${tokenERC20.symbol}:257`).toBe(transferProcessed.toAccountIndex)
      expect(accounts[1].hermezEthereumAddress).toBe(transferProcessed.toHezEthereumAddress)
      expect(tokenERC20.id).toBe(transferProcessed.token.id)
      expect(tokenERC20.name).toBe(transferProcessed.token.name)
      expect('Transfer').toBe(transferProcessed.type)
    }
  }, 300000)

  // Test NxTransfers in different batches
  test('Check Multiple L2 transfer Different batches', async () => {
    const nTransfers = 4

    for (var i = 0; i < nTransfers; i++) {
      // Transfer Params
      const transferParams = {
        type: 'Transfer',
        from: accountA.accountIndex,
        to: accountB.accountIndex,
        amount: transferAmount,
        fee
      }

      // send transaction to coordinator
      const transferResult = await hermez.Tx.generateAndSendL2Tx(transferParams, accounts[0].hermezWallet, accountA.token)
      expect(transferResult.status).toBe(200)

      // check transaction in coordinator's transaction pool
      const transferPool = await hermez.CoordinatorAPI.getPoolTransaction(transferResult.id)

      expect(tokenERC20.name).toBe(transferPool.token.name)
      expect(transferAmount.toString()).toBe(transferPool.amount)
      expect(`hez:${tokenERC20.symbol}:256`).toBe(transferPool.fromAccountIndex)
      expect('Transfer').toBe(transferPool.type)
      expect(transferResult.id).toBe(transferPool.id)
      expect(`hez:${tokenERC20.symbol}:257`).toBe(transferPool.toAccountIndex)
      expect(accounts[1].hermezEthereumAddress).toBe(transferPool.toHezEthereumAddress)
      expect(tokenERC20.id).toBe(transferPool.token.id)
      expect(tokenERC20.name).toBe(transferPool.token.name)

      // Wait until transaction is forged
      await utilsSandbox.waitNBatches(3)

      nExpectedProcessedTransactions++
      const txProcessed = await hermez.CoordinatorAPI.getTransactions()
      nProcessedTransactions = txProcessed.transactions.length
      // expect(nProcessedTransactions).toBe(nExpectedProcessedTransactions)
      nExpectedProcessedTransactions = nProcessedTransactions

      // check transaction has been processed
      const transferProcessed = await hermez.CoordinatorAPI.getHistoryTransaction(transferPool.id)

      expect(null).toBe(transferProcessed.L1Info)
      expect('L2').toBe(transferProcessed.L1orL2)
      expect(transferAmount.toString()).toBe(transferProcessed.amount)
      expect(`hez:${tokenERC20.symbol}:256`).toBe(transferProcessed.fromAccountIndex)
      expect(accounts[0].hermezEthereumAddress).toBe(transferProcessed.fromHezEthereumAddress)
      expect(transferPool.id).toBe(transferProcessed.id)
      expect(`hez:${tokenERC20.symbol}:257`).toBe(transferProcessed.toAccountIndex)
      expect(accounts[1].hermezEthereumAddress).toBe(transferProcessed.toHezEthereumAddress)
      expect(tokenERC20.id).toBe(transferProcessed.token.id)
      expect(tokenERC20.name).toBe(transferProcessed.token.name)
      expect('Transfer').toBe(transferProcessed.type)
    }
  }, 3000000)

  test('Check L2 exit', async () => {
    nExpectedProcessedTransactions++

    // Exit Tx params
    const l2ExitTx = {
      type: 'Exit',
      from: accountB.accountIndex,
      amount: exitAmount,
      fee
    }

    // send transaction to coordinator
    const l2TxExitResult = await hermez.Tx.generateAndSendL2Tx(l2ExitTx, accounts[1].hermezWallet, accountB.token)
    expect(l2TxExitResult.status).toBe(200)

    // check transaction in coordinator's transaction pool
    const txExitPool = await hermez.CoordinatorAPI.getPoolTransaction(l2TxExitResult.id)

    expect(tokenERC20.name).toBe(txExitPool.token.name)
    expect(exitAmount.toString()).toBe(txExitPool.amount)
    expect(`hez:${tokenERC20.symbol}:257`).toBe(txExitPool.fromAccountIndex)
    expect('Exit').toBe(txExitPool.type)
    expect(l2TxExitResult.id).toBe(txExitPool.id)
    expect(accounts[1].hermezEthereumAddress).toBe(txExitPool.fromHezEthereumAddress)
    expect(tokenERC20.id).toBe(txExitPool.token.id)
    expect(tokenERC20.name).toBe(txExitPool.token.name)

    await utilsSandbox.waitNBatches(3)

    const txProcessed = await hermez.CoordinatorAPI.getTransactions()
    nProcessedTransactions = txProcessed.transactions.length
    // expect(nProcessedTransactions).toBe(nExpectedProcessedTransactions)
    nExpectedProcessedTransactions = nProcessedTransactions

    // check transaction has been processed
    const txExitProcessed = await hermez.CoordinatorAPI.getHistoryTransaction(txExitPool.id)

    expect(null).toBe(txExitProcessed.L1Info)
    expect('L2').toBe(txExitProcessed.L1orL2)
    expect(exitAmount.toString()).toBe(txExitProcessed.amount)
    expect(`hez:${tokenERC20.symbol}:257`).toBe(txExitProcessed.fromAccountIndex)
    expect(accounts[1].hermezEthereumAddress).toBe(txExitProcessed.fromHezEthereumAddress)
    expect(txExitPool.id).toBe(txExitProcessed.id)
    expect(`hez:${tokenERC20.symbol}:1`).toBe(txExitProcessed.toAccountIndex)
    expect(null).toBe(txExitProcessed.toHezEthereumAddress)
    expect(tokenERC20.id).toBe(txExitProcessed.token.id)
    expect(tokenERC20.name).toBe(txExitProcessed.token.name)
    expect('Exit').toBe(txExitProcessed.type)
  }, 300000)

  test('Check withdrawal from L2 exit', async () => {
    // get exit information receiver accounts
    const exitInfo = (await hermez.CoordinatorAPI.getExits(accountB.hezEthereumAddress, true)).exits[0]

    // perform withdraw receiver accounts
    await hermez.Tx.withdraw(
      exitAmount,
      accountB.accountIndex,
      tokenERC20,
      accounts[1].hermezWallet.publicKeyCompressedHex,
      exitInfo.batchNum,
      exitInfo.merkleProof.siblings,
      true
    )

    // check exit
    expect(`hez:${tokenERC20.symbol}:257`).toBe(exitInfo.accountIndex)
    expect(exitAmount.toString()).toBe(exitInfo.balance)
    expect(tokenERC20.id).toBe(exitInfo.token.id)
    expect(tokenERC20.name).toBe(exitInfo.token.name)
  }, 300000)
})
