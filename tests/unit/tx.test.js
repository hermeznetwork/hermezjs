import { jest } from '@jest/globals'
import axios from 'axios'

import * as Tx from '../../src/tx.js'
import * as TransactionPool from '../../src/tx-pool.js'
import { TRANSACTION_POOL_KEY } from '../../src/constants.js'
import { setProvider, getProvider } from '../../src/providers.js'

describe('Txs', () => {
  jest.mock('axios')
  const txId = '0x000000000000000007000300'
  const bjj = ''
  const tx = {
    id: txId,
    bJJ: bjj,
    nonce: 2
  }
  const providerUrl = 'http://localhost:8545'
  let chainId

  beforeAll(async () => {
    setProvider(providerUrl)
    chainId = (await getProvider().getNetwork()).chainId

    axios.post = jest.fn().mockResolvedValue({
      status: 200,
      data: txId
    })
  })

  afterAll(async () => {
    axios.post.mockRestore()
    TransactionPool._storage.clear()
  })

  test('#sendL2Transaction mock', async () => {
    TransactionPool.initializeTransactionPool()
    const txResult = await Tx.sendL2Transaction(tx, bjj, ['http://127.0.0.1:8086'], true)

    expect(txResult).toEqual({
      status: 200,
      id: txId,
      nonce: 2
    })

    const transactionPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
    expect(transactionPool[chainId][bjj]).toEqual([tx])
  })
})
