import { jest } from '@jest/globals'
import axios from 'axios'
import ethers from 'ethers'

import { forgeBatch, advanceTime } from './helpers/helpers.js'
import * as Tx from '../src/tx.js'
import * as TransactionPool from '../src/tx-pool.js'
import { TRANSACTION_POOL_KEY } from '../src/constants.js'
import { getTokenAmountBigInt } from '../src/utils.js'

jest.mock('axios')

describe('Full flow', () => {
  const amount = getTokenAmountBigInt('2.88', 18)
  const hezEthereumAddress = 'hez:0xc783df8a850f42e7f7e57013759c285caa701eb6'
  const bjj = 'bc440c1c501f3476c50f39ce1f872e6a13560ebddc10791e980813bea95134d'
  const accountIndex = 'hez:TKN:256'

  beforeEach(() => {
    axios.get = jest.fn().mockResolvedValue({ data: { accounts: [{}] } })
  })

  afterEach(() => {
    axios.get.mockRestore()
  })

  test('Works with ERC20 tokens', async () => {
    const token = {
      id: 1,
      ethereumAddress: '0xf4e77E5Da47AC3125140c470c71cBca77B5c638c'
    }

    const eth = {
      id: 0
    }

    // Deposit
    const depositTokenParams = await Tx.deposit(amount, hezEthereumAddress, token, bjj, 'http://localhost:8545')
    expect(depositTokenParams).toEqual([`0x${bjj}`, 0, 33056, 0, token.id, 0, '0x'])
    const depositEthParams = await Tx.deposit(amount, hezEthereumAddress, eth, bjj, 'http://localhost:8545')
    expect(depositEthParams).toEqual([`0x${bjj}`, 0, 33056, 0, eth.id, 0, '0x'])

    await forgeBatch()
    await forgeBatch()

    // Force Exit
    const exitAmount = getTokenAmountBigInt('0.8', 18)
    const forceExitTokenParams = await Tx.forceExit(exitAmount, accountIndex, token)
    expect(forceExitTokenParams).toEqual([0, 256, 0, 31520, token.id, 1, '0x'])

    await forgeBatch()
    const forgedBatch = await forgeBatch()

    const forceExitTokenParams2 = await Tx.forceExit(exitAmount, accountIndex, token)
    expect(forceExitTokenParams2).toEqual([0, 256, 0, 31520, token.id, 1, '0x'])

    await forgeBatch()
    const forgedBatch2 = await forgeBatch()

    // Withdraw
    const batchNumber1 = ethers.BigNumber.from(forgedBatch.batchForged.toString())
    const instantWithdrawParams = await Tx.withdraw(exitAmount, accountIndex, token, bjj, batchNumber1, forgedBatch.exits[0].siblings)
    expect(instantWithdrawParams).toEqual([token.id, exitAmount, `0x${bjj}`, batchNumber1, forgedBatch.exits[0].siblings, 256, true])

    // WithdrawalDelayer
    const batchNumber2 = ethers.BigNumber.from(forgedBatch2.batchForged.toString())
    const nonInstantWithdrawParams = await Tx.withdraw(exitAmount, accountIndex, token, bjj, batchNumber2, forgedBatch2.exits[0].siblings, false)
    expect(nonInstantWithdrawParams).toEqual([token.id, exitAmount, `0x${bjj}`, batchNumber2, forgedBatch2.exits[0].siblings, 256, false])

    await advanceTime()

    const delayedWithdrawParams = await Tx.delayedWithdraw(hezEthereumAddress, token)
    expect(delayedWithdrawParams).toEqual(['0xc783df8a850f42e7f7e57013759c285caa701eb6', token.ethereumAddress])
  })
})

test('#sendL2Transaction', async () => {
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
