import { jest } from '@jest/globals'
import axios from 'axios'

import { advanceTime, waitNBatches } from './helpers/helpers.js'
import * as Tx from '../src/tx.js'
import * as TransactionPool from '../src/tx-pool.js'
import * as CoordinatorAPI from '../src/api.js'
import { TRANSACTION_POOL_KEY } from '../src/constants.js'
import { getTokenAmountBigInt } from '../src/utils.js'
import { getAccountIndex, getEthereumAddress } from '../src/addresses.js'
import { createWalletFromEtherAccount } from '../src/hermez-wallet.js'
import { floorFix2Float, float2Fix } from '../src/float16.js'

describe('Full flow', () => {
  test('Works with ERC20 tokens', async () => {
    const depositAmount = floorFix2Float(getTokenAmountBigInt('1000', 18))
    const depositEthAmount = floorFix2Float(getTokenAmountBigInt('10', 18))
    const exitAmount = floorFix2Float(getTokenAmountBigInt('10', 18))

    const account = await createWalletFromEtherAccount('http://localhost:8545', { addressOrIndex: 1 })
    const tokensResponse = await CoordinatorAPI.getTokens()
    const tokens = tokensResponse.tokens

    // Deposit. tokens[0] is Eth, tokens[1] is an ERC20
    const depositTokenParams = await Tx.deposit(depositAmount, account.hermezEthereumAddress,
      tokens[1], account.hermezWallet.publicKeyCompressedHex, 'http://localhost:8545')
    expect(depositTokenParams).toEqual([`0x${account.hermezWallet.publicKeyCompressedHex}`, 0, 37864,
      0, tokens[1].id, 0, '0x'])
    const depositEthParams = await Tx.deposit(depositEthAmount, account.hermezEthereumAddress,
      tokens[0], account.hermezWallet.publicKeyCompressedHex, 'http://localhost:8545')
    expect(depositEthParams).toEqual([`0x${account.hermezWallet.publicKeyCompressedHex}`, 0, 33768,
      0, tokens[0].id, 0, '0x'])

    await waitNBatches(3)

    const tokenAccount = (await CoordinatorAPI.getAccounts(account.hermezEthereumAddress, [tokens[1].id]))
      .accounts[0]
    const hezAccountIndex = tokenAccount.accountIndex
    const accountIndex = getAccountIndex(hezAccountIndex)

    // Force Exit
    const forceExitTokenParams = await Tx.forceExit(exitAmount, hezAccountIndex, tokens[1])
    expect(forceExitTokenParams).toEqual([0, accountIndex, 0, 33768, tokens[1].id, 1, '0x'])

    await waitNBatches(2)

    const forceExitTokenParams2 = await Tx.forceExit(exitAmount, hezAccountIndex, tokens[1])
    expect(forceExitTokenParams2).toEqual([0, accountIndex, 0, 33768, tokens[1].id, 1, '0x'])

    await waitNBatches(3)

    // Withdraw
    const exitsResponse = await CoordinatorAPI.getExits(account.hermezEthereumAddress, true).catch(() => { throw new Error('Exit 1 not found') })
    const exits = exitsResponse.exits
    const withdrawAmount = float2Fix(exitAmount)

    const instantWithdrawParams = await Tx.withdraw(withdrawAmount, hezAccountIndex, tokens[1],
      account.hermezWallet.publicKeyCompressedHex, exits[0].batchNum, exits[0].merkleProof.siblings)
    expect(instantWithdrawParams).toEqual([tokens[1].id, withdrawAmount,
      `0x${account.hermezWallet.publicKeyCompressedHex}`, exits[0].batchNum,
      exits[0].merkleProof.siblings, accountIndex, true])

    // WithdrawalDelayer
    const nonInstantWithdrawParams = await Tx.withdraw(withdrawAmount, hezAccountIndex, tokens[1],
      account.hermezWallet.publicKeyCompressedHex, exits[1].batchNum, exits[1].merkleProof.siblings, false)
    expect(nonInstantWithdrawParams).toEqual([tokens[1].id, withdrawAmount,
      `0x${account.hermezWallet.publicKeyCompressedHex}`, exits[1].batchNum,
      exits[1].merkleProof.siblings, accountIndex, false])

    await advanceTime()

    const delayedWithdrawParams = await Tx.delayedWithdraw(account.hermezEthereumAddress, tokens[1])
    expect(delayedWithdrawParams).toEqual([getEthereumAddress(account.hermezEthereumAddress), tokens[1].ethereumAddress])
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
