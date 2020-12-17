import * as CoordinatorAPI from '../src/api'

test('#_getPageData', () => {
  const pageData = CoordinatorAPI._getPageData(32)
  expect(pageData).toEqual({ fromItem: 32, limit: 20 })
})

describe('#getAccounts', () => {
  const hermezEthereumAddress = 'hez:0x00000000000000000000000000000000004Ab84F'
  const hermezBjjAddress = 'hez:m9UXbJElX5OzHMM0IxgD3Qzhx2RJw18o-tiw8s1lnwx4'
  const tokenIds = [6, 7]

  test('successful request', async () => {
    const res = await CoordinatorAPI.getAccounts()
    expect(res.accounts.length).toBe(3)
    expect(res.pendingItems).toBeDefined()
  })

  test('fetches accounts based on Hermez Ethereum address', async () => {
    const res = await CoordinatorAPI.getAccounts(hermezEthereumAddress)
    expect(res.accounts[0].hezEthereumAddress).toBe(hermezEthereumAddress)
  })

  test('fetches accounts based on Hermez BabyJubJub address', async () => {
    const res = await CoordinatorAPI.getAccounts(hermezBjjAddress)
    expect(res.accounts[0].bjj).toBe(hermezBjjAddress)
  })

  test('fetches accounts based on token IDs', async () => {
    const res = await CoordinatorAPI.getAccounts(null, tokenIds)
    expect(res.accounts[0].token.id).toBe(tokenIds[0])
    expect(res.accounts[1].token.id).toBe(tokenIds[1])
  })
})

test('#getAccount', async () => {
  const accountIndex = 'hez:SCC:256'
  const res = await CoordinatorAPI.getAccount(accountIndex)
  expect(res.accountIndex).toBe(accountIndex)
})

describe('#getTransactions', () => {
  const hermezEthereumAddress = 'hez:0x0000000000000000000000000000000000000114'
  const hermezBjjAddress = 'hez:p_OohTzjzZnD3Sw93HQlK13DSxfD6lyvbfhh2kBsV6Z4'
  const tokenIds = [0, 6]
  const batchNum = 1
  const accountIndex = 'hez:SCC:276'

  test('successful request', async () => {
    const res = await CoordinatorAPI.getTransactions()
    expect(res.transactions.length).toBe(2)
    expect(res.pendingItems).toBeDefined()
  })

  test('should filter by Hermez Ethereum address', async () => {
    const res = await CoordinatorAPI.getTransactions(hermezEthereumAddress)
    expect(res.transactions[0].fromHezEthereumAddress).toBe(hermezEthereumAddress)
  })

  test('should filter by Hermez BabyJubJub address', async () => {
    const res = await CoordinatorAPI.getTransactions(hermezBjjAddress)
    expect(res.transactions[0].fromBJJ).toBe(hermezBjjAddress)
  })

  test('should filter by token IDs', async () => {
    const res = await CoordinatorAPI.getTransactions(tokenIds)
    expect(res.transactions[0].token.id).toBe(tokenIds[1])
    expect(res.transactions[1].token.id).toBe(tokenIds[0])
  })

  test('should filter by batch number', async () => {
    const res = await CoordinatorAPI.getTransactions(batchNum)
    expect(res.transactions[0].batchNum).toBe(batchNum)
  })

  test('should filter by account index', async () => {
    const res = await CoordinatorAPI.getTransactions(accountIndex)
    expect(res.transactions[0].fromAccountIndex).toBe(accountIndex)
  })
})

test('#getHistoryTransaction', async () => {
  const transactionId = '0x00000000000000000a000400'
  const res = await CoordinatorAPI.getHistoryTransaction(transactionId)
  expect(res.id).toBe(transactionId)
})

test('#getPoolTransaction', async () => {
  const transactionId = '0x020000000001000000000006'
  const res = await CoordinatorAPI.getPoolTransaction(transactionId)
  expect(res.id).toBe(transactionId)
})

test('#postPoolTransaction', async () => {
  const transactionId = '0x020000000001000000000006'
  const exampleTx = {
    id: transactionId,
    type: 'Transfer',
    tokenId: 6,
    fromAccountIndex: 'hez:DAI:256',
    toAccountIndex: 'hez:DAI:257',
    toHezEthereumAddress: null,
    toBjj: null,
    amount: '100000000000000',
    fee: 0,
    nonce: 6,
    signature: '1a79dd5e661d58266901a0de8afb046b466c4c1af937100f627a421771f2911fa3fde8ea2e272b4802a8b1f1229689292acd6f7e8ab4cadc4ab37b6b9e13a101'
  }
  const resPost = await CoordinatorAPI.postPoolTransaction(exampleTx)
  expect(resPost.data).toBe('0x00000000000001e240004700')
  expect(resPost.status).toBe(200)
  const resGet = await CoordinatorAPI.getPoolTransaction(transactionId)
  expect(resGet.id).toBe(transactionId)
})

describe('getExits', () => {
  // const hermezEthereumAddress = 'hez:0x0000000000000000000000000000000000000114'
  // const hermezBjjAddress = 'hez:p_OohTzjzZnD3Sw93HQlK13DSxfD6lyvbfhh2kBsV6Z4'

  test('successful request', async () => {
    const res = await CoordinatorAPI.getExits()
    expect(res.exits.length).toBe(1)
    expect(res.pendingItems).toBeDefined()
  })

  // test('should filter by Hermez Ethereum address', async () => {
  //   const res = await CoordinatorAPI.getExits(hermezEthereumAddress)
  //   expect(res.exits[0].fromHezEthereumAddress).toBe(hermezEthereumAddress)
  // })

  // test('should filter by Hermez BabyJubJub address', async () => {
  //   const res = await CoordinatorAPI.getExits(hermezBjjAddress)
  //   expect(res.exits[0].fromBJJ).toBe(hermezBjjAddress)
  // })

  test('should filter by pending withdraws', async () => {
    const res = await CoordinatorAPI.getExits(true)
    // expect(res.exits[0].instantWithdrawn).toBeNull()
    expect(res.exits[0].delayedWithdrawRequest).toBeNull()
    expect(res.exits[0].delayedWithdrawn).toBeNull()
  })
})

test('#getExit', async () => {
  const batchNum = 7394
  const accountIndex = 'hez:DAI:4444'
  const res = await CoordinatorAPI.getExit(batchNum, accountIndex)
  expect(res.batchNum).toBe(batchNum)
  expect(res.accountIndex).toBe(accountIndex)
})

describe('#getTokens', () => {
  const tokenIds = [98765]

  test('successful request', async () => {
    const res = await CoordinatorAPI.getTokens()
    expect(res.tokens.length).toBe(1)
    expect(res.pendingItems).toBeDefined()
  })

  test('should filter by token ids', async () => {
    const res = await CoordinatorAPI.getTokens(tokenIds)
    expect(res.tokens[0].id).toBe(tokenIds[0])
  })
})

test('#getState', async () => {
  const res = await CoordinatorAPI.getState()
  expect(res).toBeDefined()
})

describe('#getBatches', () => {
  const forgerAddr = '0xaa942cfcd25ad4d90a62358b0dd84f33b398262a'
  const slotNum = 784

  test('successful request', async () => {
    const res = await CoordinatorAPI.getBatches()
    expect(res.batches.length).toBe(1)
    expect(res.pendingItems).toBeDefined()
  })

  test('should filter by forgerAddr', async () => {
    const res = await CoordinatorAPI.getBatches(forgerAddr)
    expect(res.batches[0].forgerAddr).toBe(forgerAddr)
  })

  test('should filter by slotNum', async () => {
    const res = await CoordinatorAPI.getBatches(null, slotNum)
    expect(res.batches[0].slotNum).toBe(slotNum)
  })
})

test('#getBatch', async () => {
  const slotNum = 784
  const res = await CoordinatorAPI.getBatch(slotNum)
  expect(res.slotNum).toBe(slotNum)
})

test('#getCoordinator', async () => {
  const bidderAddr = '0xaa942cfcd25ad4d90a62358b0dd84f33b398262a'
  const res = await CoordinatorAPI.getCoordinator(bidderAddr)
  expect(res.bidderAddr).toBe(bidderAddr)
})

test('#getSlot', async () => {
  const slotNum = 784
  const res = await CoordinatorAPI.getSlot(slotNum)
  expect(res.slotNum).toBe(slotNum)
})

describe('#getBids', () => {
  const slotNum = 784
  const bidderAddr = '0xaa942cfcd25ad4d90a62358b0dd84f33b398262a'

  test('successful request', async () => {
    const res = await CoordinatorAPI.getBids()
    expect(res.bids.length).toBe(1)
    expect(res.pendingItems).toBeDefined()
  })

  test('should filter by slotNum', async () => {
    const res = await CoordinatorAPI.getBids(slotNum)
    expect(res.bids[0].slotNum).toBe(slotNum)
  })

  test('should filter by bidderAddr', async () => {
    const res = await CoordinatorAPI.getBids(null, bidderAddr)
    expect(res.bids[0].bidderAddr).toBe(bidderAddr)
  })
})

test('#postCreateAccountAuthorization', async () => {
  const res = await CoordinatorAPI.postCreateAccountAuthorization(
    'hez:0xb5270eB4ae11c6fAAff6F5fa0A5202B8d963634C',
    'hez:hg2Ydsb8O66H-steBR3cnHl944ua7E-PkTJ_SbPBBg5r',
    '0xf9161cd688394772d93aa3e7b3f8f9553ca4f94f65b7cece93ed4a239d5c0b4677dca6d1d459e3a5c271a34de735d4664a43e5a8960a9a6e027d12c562dd448e1c'
  )
  expect(res.status).toBe(200)
})
