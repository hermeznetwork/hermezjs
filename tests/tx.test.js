import { jest } from '@jest/globals'
import axios from 'axios'
import { BigNumber } from 'ethers'

import { advanceTime, waitNBatches } from './helpers/helpers.js'
import * as Tx from '../src/tx.js'
import * as TransactionPool from '../src/tx-pool.js'
import * as CoordinatorAPI from '../src/api.js'
import { TRANSACTION_POOL_KEY, CONTRACT_ADDRESSES, ContractNames } from '../src/constants.js'
import { getEthereumAddress } from '../src/addresses.js'
import { createWalletFromEtherAccount } from '../src/hermez-wallet.js'
import { HermezCompressedAmount } from '../src/hermez-compressed-amount.js'
import { getTokenAmountBigInt } from '../src/utils.js'

describe('Full flow', () => {
  test('Works with ERC20 tokens', async () => {
    const account = await createWalletFromEtherAccount('http://localhost:8545', { addressOrIndex: 1 })
    const accountEthereumAddress = getEthereumAddress(account.hermezEthereumAddress)

    const tokensResponse = await CoordinatorAPI.getTokens()
    const tokens = tokensResponse.tokens

    const depositAmount = getTokenAmountBigInt('0.000001', tokens[1].decimals)
    const depositEthAmount = getTokenAmountBigInt('0.1', tokens[0].decimals)
    const exitAmount = getTokenAmountBigInt('0.0000001', tokens[1].decimals)
    const compressedDepositAmount = HermezCompressedAmount.compressAmount(depositAmount)
    const compressedDepositEthAmount = HermezCompressedAmount.compressAmount(depositEthAmount)
    const compressedExitAmount = HermezCompressedAmount.compressAmount(exitAmount)

    // Deposit. tokens[0] is Eth, tokens[1] is an ERC20
    const depositEthTxData = await Tx.deposit(compressedDepositEthAmount, account.hermezEthereumAddress,
      tokens[0], account.hermezWallet.publicKeyCompressedHex, 'http://localhost:8545')
    const depositTokenTxData = await Tx.deposit(compressedDepositAmount, account.hermezEthereumAddress,
      tokens[1], account.hermezWallet.publicKeyCompressedHex, 'http://localhost:8545')

    expect(depositTokenTxData).toMatchObject({
      from: accountEthereumAddress,
      to: CONTRACT_ADDRESSES[ContractNames.Hermez],
      value: BigNumber.from(0)
    })

    expect(depositEthTxData).toMatchObject({
      from: accountEthereumAddress,
      to: CONTRACT_ADDRESSES[ContractNames.Hermez],
      value: depositEthAmount
    })

    await waitNBatches(3)

    const tokenAccount = (await CoordinatorAPI.getAccounts(account.hermezEthereumAddress, [tokens[1].id]))
      .accounts[0]
    const hezAccountIndex = tokenAccount.accountIndex

    // Force Exit
    const forceExitTxData = await Tx.forceExit(compressedExitAmount, hezAccountIndex, tokens[1])

    expect(forceExitTxData).toMatchObject({
      from: accountEthereumAddress,
      to: CONTRACT_ADDRESSES[ContractNames.Hermez],
      value: BigNumber.from(0)
    })

    await waitNBatches(2)

    const forceExitTxData2 = await Tx.forceExit(compressedExitAmount, hezAccountIndex, tokens[1])

    expect(forceExitTxData2).toMatchObject({
      from: accountEthereumAddress,
      to: CONTRACT_ADDRESSES[ContractNames.Hermez],
      value: BigNumber.from(0)
    })

    await waitNBatches(3)

    // Withdraw
    const exitsResponse = await CoordinatorAPI.getExits(account.hermezEthereumAddress, true).catch(() => { throw new Error('Exit 1 not found') })
    const exits = exitsResponse.exits
    const withdrawAmount = HermezCompressedAmount.decompressAmount(compressedExitAmount)

    const instantWithdrawTxData = await Tx.withdraw(withdrawAmount, hezAccountIndex, tokens[1],
      account.hermezWallet.publicKeyCompressedHex, exits[0].batchNum, exits[0].merkleProof.siblings)

    expect(instantWithdrawTxData).toMatchObject({
      from: accountEthereumAddress,
      to: CONTRACT_ADDRESSES[ContractNames.Hermez],
      value: BigNumber.from(0)
    })

    // WithdrawalDelayer
    const isInstant = await Tx.isInstantWithdrawalAllowed(
      withdrawAmount,
      hezAccountIndex,
      tokens[1],
      account.hermezWallet.publicKeyCompressedHex,
      exits[1].batchNum,
      exits[1].merkleProof.siblings
    )
    expect(isInstant).toBe([])

    const nonInstantWithdrawTxData = await Tx.withdraw(withdrawAmount, hezAccountIndex, tokens[1],
      account.hermezWallet.publicKeyCompressedHex, exits[1].batchNum, exits[1].merkleProof.siblings, false)

    expect(nonInstantWithdrawTxData).toMatchObject({
      from: accountEthereumAddress,
      to: CONTRACT_ADDRESSES[ContractNames.Hermez],
      value: BigNumber.from(0)
    })

    await advanceTime()

    const delayedWithdrawTxData = await Tx.delayedWithdraw(account.hermezEthereumAddress, tokens[1])

    expect(delayedWithdrawTxData).toMatchObject({
      from: accountEthereumAddress,
      to: CONTRACT_ADDRESSES[ContractNames.WithdrawalDelayer],
      value: BigNumber.from(0)
    })
  })
})

test('#sendL2Transaction', async () => {
  jest.mock('axios')

  const txId = '0x000000000000000007000300'
  const bjj = ''
  const tx = {
    id: txId,
    bJJ: bjj,
    nonce: 2
  }
  axios.post = jest.fn().mockResolvedValue({
    status: 200,
    data: txId
  })
  TransactionPool.initializeTransactionPool()

  const txResult = await Tx.sendL2Transaction(tx, bjj)
  expect(txResult).toEqual({
    status: 200,
    id: txId,
    nonce: 2
  })

  const transactionPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
  expect(transactionPool[bjj]).toEqual([tx])

  axios.post.mockRestore()
  TransactionPool._storage.clear()
})
