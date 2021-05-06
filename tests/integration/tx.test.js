import path from 'path'
import { ethers } from 'ethers'

import { Scalar } from 'ffjavascript'

import * as Tx from '../../src/tx.js'
import * as TransactionPool from '../../src/tx-pool.js'
import * as CoordinatorAPI from '../../src/api.js'
import { getEthereumAddress } from '../../src/addresses.js'
import { createWalletFromEtherAccount, createWalletFromBjjPvtKey } from '../../src/hermez-wallet.js'
import { HermezCompressedAmount } from '../../src/hermez-compressed-amount.js'
import { getTokenAmountBigInt } from '../../src/utils.js'
import { getL1TxIdFromReceipt, assertTxForged, assertBalances } from '../helpers/helpers.js'

// Requires `integration-testing` environment running

describe('Full flow', () => {
  const urlEthNode = 'http://localhost:8545'
  // mnemonic should match with the one used in integration-testing repository
  const mnemonic = 'explain tackle mirror kit van hammer degree position ginger unfair soup bonus'

  const accounts = []
  const numAccounts = 2
  const numAccountsBjj = 1
  let provider
  let tokenEth
  let fee

  test('Setup accounts', async () => {
    // create accounts
    for (let i = 1; i <= numAccounts + numAccountsBjj; i++) {
      const pathWallet = `m/44'/60'/0'/0/${i}`
      const wallet = ethers.Wallet.fromMnemonic(mnemonic, pathWallet)

      if (i <= numAccounts) {
        const signer = { type: 'WALLET', privateKey: wallet.privateKey }
        accounts.push({
          hermezWallet: (await createWalletFromEtherAccount(urlEthNode, signer)).hermezWallet,
          signer,
          expectedBalance: null
        })
      } else {
        const pvtKeyBjj = Buffer.allocUnsafe(32).fill(`${i}`)
        accounts.push({
          hermezWallet: (await createWalletFromBjjPvtKey(pvtKeyBjj)).hermezWallet,
          signer: null,
          expectedBalance: null
        })
      }
    }

    // get registered tokens in hermez
    const tokensResponse = await CoordinatorAPI.getTokens()
    const tokens = tokensResponse.tokens
    tokenEth = tokens[0]

    // setup fee
    fee = 0

    // setup tx pool
    TransactionPool.initializeTransactionPool()

    // setup provider
    provider = new ethers.providers.JsonRpcProvider(urlEthNode)
  })

  test('Deposits', async () => {
    const depositAmount = getTokenAmountBigInt('1', tokenEth.decimals)
    const compressedDepositAmount = HermezCompressedAmount.compressAmount(depositAmount)
    // Deposit account 0
    let depositTokenTxData = await Tx.deposit(
      compressedDepositAmount,
      accounts[0].hermezWallet.hermezEthereumAddress,
      tokenEth,
      accounts[0].hermezWallet.publicKeyCompressedHex,
      accounts[0].signer,
      urlEthNode
    )
    let depositReceipt = await depositTokenTxData.wait()
    let txId = getL1TxIdFromReceipt(depositReceipt)
    await assertTxForged(txId)

    // Deposit account 1
    depositTokenTxData = await Tx.deposit(
      compressedDepositAmount,
      accounts[1].hermezWallet.hermezEthereumAddress,
      tokenEth,
      accounts[1].hermezWallet.publicKeyCompressedHex,
      accounts[1].signer,
      urlEthNode
    )
    depositReceipt = await depositTokenTxData.wait()
    txId = getL1TxIdFromReceipt(depositReceipt)
    await assertTxForged(txId)

    // set accounts indexes for account 0 and 1
    for (let i = 0; i < 2; i++) {
      const hezAddress = accounts[i].hermezWallet.hermezEthereumAddress
      const accountInfo = await CoordinatorAPI.getAccounts(hezAddress, [tokenEth.id])
      accounts[i].index = accountInfo.accounts[0].accountIndex
    }

    // update and assert balances
    accounts[0].expectedBalance = depositAmount
    accounts[1].expectedBalance = depositAmount
    await assertBalances(accounts, tokenEth)
  })

  test('Transfer to a non-existent Bjj address', async () => {
    // setup amounts
    const transferAmount = getTokenAmountBigInt('0.18', tokenEth.decimals)
    const compressedTransferAmount = HermezCompressedAmount.compressAmount(transferAmount)

    // transfer to internal account
    // this transfer should create a new account for accounts[2]
    // it also creates an operator fee account to receives fees
    const txTransfer = {
      from: accounts[0].index,
      to: accounts[2].hermezWallet.publicKeyBase64,
      amount: compressedTransferAmount,
      fee
    }

    // send transaction to coordinator
    const res = await Tx.generateAndSendL2Tx(txTransfer, accounts[0].hermezWallet, tokenEth)
    expect(res.status).toEqual(200)
    await assertTxForged(res.id)

    // set accounts indexes for account 0 and 1
    const bjjAddress = accounts[2].hermezWallet.publicKeyBase64
    const accountInfo = await CoordinatorAPI.getAccounts(bjjAddress, [tokenEth.id])
    accounts[2].index = accountInfo.accounts[0].accountIndex

    // update and assert balances
    accounts[0].expectedBalance = Scalar.sub(accounts[0].expectedBalance, transferAmount)
    accounts[2].expectedBalance = transferAmount
    await assertBalances(accounts, tokenEth)
  })

  test('Transfer to hermez ethereum address from internal account', async () => {
    // setup amounts
    const transferAmount = getTokenAmountBigInt('0.05', tokenEth.decimals)
    const compressedTransferAmount = HermezCompressedAmount.compressAmount(transferAmount)

    // transfer to ethereum address using internal account
    const txTransfer = {
      from: accounts[2].index,
      to: accounts[0].hermezWallet.hermezEthereumAddress,
      amount: compressedTransferAmount,
      fee
    }

    // send transaction to coordinator
    const res = await Tx.generateAndSendL2Tx(txTransfer, accounts[2].hermezWallet, tokenEth)
    expect(res.status).toEqual(200)
    await assertTxForged(res.id)

    // update and assert balances
    accounts[0].expectedBalance = Scalar.add(accounts[0].expectedBalance, transferAmount)
    accounts[2].expectedBalance = Scalar.sub(accounts[2].expectedBalance, transferAmount)
    await assertBalances(accounts, tokenEth)
  })

  test('Transfer to hermez ethereum address', async () => {
    // setup amounts
    const transferAmount = getTokenAmountBigInt('0.4', tokenEth.decimals)
    const compressedTransferAmount = HermezCompressedAmount.compressAmount(transferAmount)

    // transfer to ethereum address
    const txTransfer = {
      from: accounts[1].index,
      to: accounts[0].hermezWallet.hermezEthereumAddress,
      amount: compressedTransferAmount,
      fee
    }

    // send transaction to coordinator
    const res = await Tx.generateAndSendL2Tx(txTransfer, accounts[1].hermezWallet, tokenEth)
    expect(res.status).toEqual(200)
    await assertTxForged(res.id)

    // update and assert balances
    accounts[0].expectedBalance = Scalar.add(accounts[0].expectedBalance, transferAmount)
    accounts[1].expectedBalance = Scalar.sub(accounts[1].expectedBalance, transferAmount)
    await assertBalances(accounts, tokenEth)
  })

  test('Transfer to hermez index', async () => {
    // setup amounts
    const transferAmount = getTokenAmountBigInt('0.33', tokenEth.decimals)
    const compressedTransferAmount = HermezCompressedAmount.compressAmount(transferAmount)

    // transfer to index
    const txTransfer = {
      from: accounts[0].index,
      to: accounts[2].index,
      amount: compressedTransferAmount,
      fee
    }

    // send transaction to coordinator
    const res = await Tx.generateAndSendL2Tx(txTransfer, accounts[0].hermezWallet, tokenEth)
    expect(res.status).toEqual(200)
    await assertTxForged(res.id)

    // update and assert balances
    accounts[0].expectedBalance = Scalar.sub(accounts[0].expectedBalance, transferAmount)
    accounts[2].expectedBalance = Scalar.add(accounts[2].expectedBalance, transferAmount)
    await assertBalances(accounts, tokenEth)
  })

  test('L2 Exit', async () => {
    // setup amounts
    const exitAmount = getTokenAmountBigInt('0.16', tokenEth.decimals)
    const compressedExitAmount = HermezCompressedAmount.compressAmount(exitAmount)

    // exit transaction
    const txExit = {
      from: accounts[0].index,
      type: 'Exit',
      amount: compressedExitAmount,
      fee
    }

    // send transaction to coordinator
    const res = await Tx.generateAndSendL2Tx(txExit, accounts[0].hermezWallet, tokenEth)
    expect(res.status).toEqual(200)
    await assertTxForged(res.id)

    // update and assert balances
    accounts[0].expectedBalance = Scalar.sub(accounts[0].expectedBalance, exitAmount)
    await assertBalances(accounts, tokenEth)
  })

  test('Withdrawal from L2 exit', async () => {
    const hermezEthAddress = accounts[0].hermezWallet.hermezEthereumAddress
    const exitInfoAll = await CoordinatorAPI.getExits(hermezEthAddress, true)
    const exitInfo = exitInfoAll.exits[0]

    const oldBalance = Scalar.e(await provider.getBalance(getEthereumAddress(hermezEthAddress)))

    // WithdrawalDelayer
    const isInstant = await Tx.isInstantWithdrawalAllowed(
      exitInfo.balance,
      accounts[0].index,
      tokenEth,
      accounts[0].hermezWallet.publicKeyCompressedHex,
      exitInfo.batchNum,
      exitInfo.merkleProof.siblings,
      accounts[0].signer
    )

    expect(isInstant.length).toBe(0)

    const withdrawTxData = await Tx.withdraw(
      exitInfo.balance,
      accounts[0].index,
      tokenEth,
      accounts[0].hermezWallet.publicKeyCompressedHex,
      exitInfo.batchNum,
      exitInfo.merkleProof.siblings,
      true,
      accounts[0].signer
    )
    await withdrawTxData.wait()

    const newBalance = Scalar.e(await provider.getBalance(getEthereumAddress(hermezEthAddress)))

    expect(Scalar.gt(newBalance, oldBalance)).toBe(true)
  })

  test('Force exit', async () => {
    // setup amounts
    const forceExitAmount = getTokenAmountBigInt('0.29', tokenEth.decimals)
    const compressedForceExitAmount = HermezCompressedAmount.compressAmount(forceExitAmount)

    const forceExitData = await Tx.forceExit(
      compressedForceExitAmount,
      accounts[1].index,
      tokenEth,
      accounts[1].signer
    )
    const forceExitReceipt = await forceExitData.wait()
    const txId = getL1TxIdFromReceipt(forceExitReceipt)
    await assertTxForged(txId)

    // update and assert balances
    accounts[1].expectedBalance = Scalar.sub(accounts[1].expectedBalance, forceExitAmount)
    await assertBalances(accounts, tokenEth)
  })

  test('Withdrawal from force exit', async () => {
    const hermezEthAddress = accounts[1].hermezWallet.hermezEthereumAddress
    const exitInfoAll = await CoordinatorAPI.getExits(hermezEthAddress, true)
    const exitInfo = exitInfoAll.exits[0]

    const oldBalance = Scalar.e(await provider.getBalance(getEthereumAddress(hermezEthAddress)))

    const withdrawTxData = await Tx.withdraw(
      exitInfo.balance,
      accounts[1].index,
      tokenEth,
      accounts[1].hermezWallet.publicKeyCompressedHex,
      exitInfo.batchNum,
      exitInfo.merkleProof.siblings,
      true,
      accounts[1].signer
    )
    await withdrawTxData.wait()

    const newBalance = Scalar.e(await provider.getBalance(getEthereumAddress(hermezEthAddress)))

    expect(Scalar.gt(newBalance, oldBalance)).toEqual(true)
  })

  test('Exit and circuit withdrawal', async () => {
    const oldBalance = Scalar.e(await provider.getBalance(getEthereumAddress(
      accounts[0].hermezWallet.hermezEthereumAddress)
    ))

    // setup amounts
    const exitAmount = getTokenAmountBigInt('0.22', tokenEth.decimals)
    const compressedExitAmount = HermezCompressedAmount.compressAmount(exitAmount)

    // build exit tx
    const txExit = {
      from: accounts[0].index,
      type: 'Exit',
      amount: compressedExitAmount,
      fee
    }

    // send transaction to coordinator
    const res = await Tx.generateAndSendL2Tx(txExit, accounts[0].hermezWallet, tokenEth)
    expect(res.status).toEqual(200)
    await assertTxForged(res.id)

    // Perform circuit withdrawal
    const hermezEthAddress = accounts[0].hermezWallet.hermezEthereumAddress
    const exitInfoAll = await CoordinatorAPI.getExits(hermezEthAddress, true)
    const exitInfo = exitInfoAll.exits[0]

    // setup paths for wasm and zkey files
    const wasmFilePath = path.join(__dirname, '../withdraw-circuit-files/withdraw.wasm')
    const zkeyFilePath = path.join(__dirname, '../withdraw-circuit-files/withdraw_hez4_final.zkey')

    const withdrawCircuitTxData = await Tx.withdrawCircuit(
      exitInfo,
      true,
      wasmFilePath,
      zkeyFilePath,
      accounts[0].signer
    )
    await withdrawCircuitTxData.wait()

    const newBalance = Scalar.e(await provider.getBalance(getEthereumAddress(
      accounts[0].hermezWallet.hermezEthereumAddress)))

    expect(Scalar.gt(newBalance, oldBalance)).toEqual(true)
  })
})
