import { jest } from '@jest/globals'
import axios from 'axios'

import * as TransactionPool from '../src/tx-pool.js'
import { TRANSACTION_POOL_KEY } from '../src/constants.js'
import { HttpStatusCode } from '../src/http.js'

test('#initializeTransactionPool', () => {
  TransactionPool.initializeTransactionPool()
  expect(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY)).toBe('{}')
})

describe('#addPoolTransaction', () => {
  const bjj1 = 'bjj1'
  const tx1 = {
    test: 1
  }
  const tx2 = {
    test: 2
  }

  const bjj2 = 'bjj2'
  const tx3 = {
    test: 3
  }

  beforeEach(() => {
    TransactionPool.initializeTransactionPool()
  })

  afterEach(() => {
    TransactionPool._storage.clear()
  })

  test('Adds a transaction to the pool', () => {
    TransactionPool.addPoolTransaction(tx1, bjj1)
    const transactionPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
    expect(transactionPool[bjj1]).toEqual([tx1])
  })

  test('Adds a second transaction to the same BJJ account', () => {
    TransactionPool.addPoolTransaction(tx1, bjj1)
    TransactionPool.addPoolTransaction(tx2, bjj1)
    const transactionPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
    expect(transactionPool[bjj1]).toEqual([tx1, tx2])
  })

  test('Adds a transaction to a second BJJ account', () => {
    TransactionPool.addPoolTransaction(tx1, bjj1)
    TransactionPool.addPoolTransaction(tx3, bjj2)
    const transactionPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
    expect(transactionPool[bjj1]).toEqual([tx1])
    expect(transactionPool[bjj2]).toEqual([tx3])
  })
})

describe('#removePoolTransaction', () => {
  const bjj1 = 'bjj1'
  const id1 = 1
  const tx1 = {
    id: id1
  }
  const id2 = 2
  const tx2 = {
    id: id2
  }

  const bjj2 = 'bjj2'
  const id3 = 3
  const tx3 = {
    id: id3
  }

  beforeEach(() => {
    TransactionPool.initializeTransactionPool()
  })

  afterEach(() => {
    TransactionPool._storage.clear()
  })

  test('Removes a transaction from the pool', () => {
    TransactionPool.addPoolTransaction(tx1, bjj1)
    const initialPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
    expect(initialPool[bjj1]).toEqual([tx1])

    TransactionPool.removePoolTransaction(bjj1, id1)
    const finalPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
    expect(finalPool[bjj1]).toEqual([])
  })

  test('Removes correct transaction when there are multiple with the same BJJ account', () => {
    TransactionPool.addPoolTransaction(tx1, bjj1)
    TransactionPool.addPoolTransaction(tx2, bjj1)
    const initialPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
    expect(initialPool[bjj1]).toEqual([tx1, tx2])

    TransactionPool.removePoolTransaction(bjj1, id1)
    const finalPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
    expect(finalPool[bjj1]).toEqual([tx2])
  })

  test('Removes a transaction from the correct BJJ account', () => {
    TransactionPool.addPoolTransaction(tx1, bjj1)
    TransactionPool.addPoolTransaction(tx3, bjj2)
    const initialPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
    expect(initialPool[bjj1]).toEqual([tx1])
    expect(initialPool[bjj2]).toEqual([tx3])

    TransactionPool.removePoolTransaction(bjj1, id1)
    const finalPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
    expect(finalPool[bjj1]).toEqual([])
    expect(finalPool[bjj2]).toEqual([tx3])
  })
})

describe('#getPoolTransactions', () => {
  const bjj1 = 'bjj1'
  const accountIndex1 = 1
  const id1 = 1
  const tx1 = {
    id: id1,
    fromAccountIndex: accountIndex1
  }
  const id2 = 2
  const tx2 = {
    id: id2,
    fromAccountIndex: accountIndex1
  }

  const bjj2 = 'bjj2'
  const accountIndex2 = 2
  const id3 = 3
  const tx3 = {
    id: id3,
    fromAccountIndex: accountIndex2
  }

  beforeEach(() => {
    jest.mock('axios')
    axios.get = jest.fn().mockResolvedValue({ data: tx1 })
    TransactionPool.initializeTransactionPool()
  })

  afterEach(() => {
    axios.get.mockRestore()
    TransactionPool._storage.clear()
  })

  test('Fetches transaction from the pool', async () => {
    TransactionPool.addPoolTransaction(tx1, bjj1)
    TransactionPool.addPoolTransaction(tx2, bjj1)
    const txs = await TransactionPool.getPoolTransactions(accountIndex1, bjj1)

    expect(txs).toEqual([tx1, tx1])
  })

  test('Fetches transaction from the pool, only from the correct account index', async () => {
    TransactionPool.addPoolTransaction(tx1, bjj1)
    TransactionPool.addPoolTransaction(tx2, bjj1)
    TransactionPool.addPoolTransaction(tx3, bjj2)
    const txs = await TransactionPool.getPoolTransactions(accountIndex1, bjj1)

    expect(txs).toEqual([tx1, tx1])
  })

  test('Return empty transaction if there are no transactions', async () => {
    const txs = await TransactionPool.getPoolTransactions(accountIndex1, bjj1)

    expect(txs).toEqual([])
  })

  test('Removes transaction from storage if not available in the coordinator', async () => {
    axios.get.mockRejectedValueOnce({
      response: {
        status: HttpStatusCode.NOT_FOUND
      }
    })

    TransactionPool.addPoolTransaction(tx1, bjj1)
    TransactionPool.addPoolTransaction(tx2, bjj1)
    const initialPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
    expect(initialPool[bjj1]).toEqual([tx1, tx2])

    const txs = await TransactionPool.getPoolTransactions(accountIndex1, bjj1)
    expect(txs).toEqual([tx1])

    const finalPool = JSON.parse(TransactionPool._storage.getItem(TRANSACTION_POOL_KEY))
    expect(finalPool[bjj1]).toEqual([tx2])
  })
})
