import * as CoordinatorAPI from '../src/api'
import { createWalletFromEtherAccount } from '../src/hermez-wallet'

// All API tests are skipped until we transition to testnet
// They can be activated to test with Swagger endpoints

test('#_getPageData', () => {
  const pageData = CoordinatorAPI._getPageData(32, CoordinatorAPI.PaginationOrder.ASC, 20)
  expect(pageData).toEqual({ fromItem: 32, order: CoordinatorAPI.PaginationOrder.ASC, limit: 20 })
})

test('#getBaseApiUrl & #setBaseApiUrl', () => {
  const url = 'http://localhost:8086'
  expect(CoordinatorAPI.getBaseApiUrl()).toBe(url)
  CoordinatorAPI.setBaseApiUrl(url)
  expect(CoordinatorAPI.getBaseApiUrl()).toBe(url)
})

describe.skip('#getAccounts', () => {
  const hermezEthereumAddress = 'hez:0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf'
  const hermezBjjAddress = 'hez:W6x4TZOAZ9mAqdOb3Xm_hKDLspaXfEfMMN4tXOkinS-W'
  const tokenIds = [0, 1]

  test('successful request', async () => {
    const res = await CoordinatorAPI.getAccounts()
    expect(res.accounts.length).toBe(2)
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

// Skipping for now due to a bug in swagger
test.skip('#getAccount', async () => {
  const accountIndex = 'hez:SCC:256'
  const res = await CoordinatorAPI.getAccount(accountIndex)
  expect(res.accountIndex).toBe(accountIndex)
})

describe.skip('#getTransactions', () => {
  const hermezEthereumAddress = 'hez:0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF'
  const hermezBjjAddress = 'hez:Mj_xDCjfN-y3h_4hbhEdtkqnz6LFF1Cf4AV_8IoQswwh'
  const tokenIds = [0, 1]
  const batchNum = 9
  const accountIndex = 'hez:ETH:262'

  test('successful request', async () => {
    const res = await CoordinatorAPI.getTransactions()
    expect(res.transactions.length).toBe(5)
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
    expect(res.transactions[0].token.id).toBe(tokenIds[0])
    expect(res.transactions[1].token.id).toBe(tokenIds[1])
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

test.skip('#getHistoryTransaction', async () => {
  const transactionId = '0x00000000000000000a000400'
  const res = await CoordinatorAPI.getHistoryTransaction(transactionId)
  expect(res.id).toBe(transactionId)
})

test.skip('#getPoolTransaction', async () => {
  const transactionId = '0x020000000001000000000006'
  const res = await CoordinatorAPI.getPoolTransaction(transactionId)
  expect(res.id).toBe(transactionId)
})

test.skip('#postPoolTransaction', async () => {
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

describe.skip('getExits', () => {
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

test.skip('#getExit', async () => {
  const batchNum = 7394
  const accountIndex = 'hez:DAI:4444'
  const res = await CoordinatorAPI.getExit(batchNum, accountIndex)
  expect(res.batchNum).toBe(batchNum)
  expect(res.accountIndex).toBe(accountIndex)
})

describe.skip('#getTokens', () => {
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

test.skip('#getState', async () => {
  const res = await CoordinatorAPI.getState()
  expect(res).toBeDefined()
})

describe.skip('#getBatches', () => {
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

test.skip('#getBatch', async () => {
  const slotNum = 784
  const res = await CoordinatorAPI.getBatch(slotNum)
  expect(res.slotNum).toBe(slotNum)
})

test.skip('#getCoordinators', async () => {
  const bidderAddr = '0xaa942cfcd25ad4d90a62358b0dd84f33b398262a'
  const res = await CoordinatorAPI.getCoordinators()
  expect(res.coordinators[0].bidderAddr).toBe(bidderAddr)
})

test.skip('#getSlot', async () => {
  const slotNum = 784
  const res = await CoordinatorAPI.getSlot(slotNum)
  expect(res.slotNum).toBe(slotNum)
})

describe.skip('#getBids', () => {
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
  const privateKeyEth = '0x0000000000000000000000000000000000000000000000000000000000000001'
  const signer = { type: 'WALLET', privateKey: privateKeyEth }
  const { hermezWallet } = await createWalletFromEtherAccount('http://localhost:8545', signer)

  const signature = await hermezWallet.signCreateAccountAuthorization('http://localhost:8545', signer)
  const res = await CoordinatorAPI.postCreateAccountAuthorization(
    hermezWallet.hermezEthereumAddress,
    hermezWallet.publicKeyBase64,
    signature
  )
  expect(res.status).toBe(200)
})

test.skip('#getCreateAccountAuthorization', async () => {
  const hermezEthereumAddress = 'hez:0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf'
  const res = await CoordinatorAPI.getCreateAccountAuthorization(hermezEthereumAddress)
  expect(res.status).toBe(200)
})
