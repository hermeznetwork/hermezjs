import { jest } from '@jest/globals'
import axios from 'axios'
import { Scalar } from 'ffjavascript'

import * as TransactionPool from '../src/tx-pool.js'
import * as TxUtils from '../src/tx-utils.js'
import { HermezCompressedAmount } from '../src/hermez-compressed-amount.js'

const transferTransaction = {
  type: 'Transfer',
  tokenId: 0,
  fromAccountIndex: 'hez:DAI:4444',
  toAccountIndex: 'hez:DAI:1234',
  toHezEthereumAddress: null,
  toBjj: null,
  amount: '3400000000',
  fee: 147,
  nonce: 2,
  requestFromAccountIndex: null,
  requestToAccountIndex: null,
  requestToHezEthereumAddress: null,
  requestToBjj: null,
  requestTokenId: null,
  requestAmount: null,
  requestFee: null,
  requestNonce: null
}

const transferTransactionEncoded = Object.assign({}, transferTransaction, {
  chainId: 1337,
  fromAccountIndex: 4444,
  toAccountIndex: 1234
})

const exitTransaction = {
  type: 'Exit',
  tokenId: 0,
  fromAccountIndex: 'hez:DAI:4444',
  toAccountIndex: 'hez:DAI:1',
  toHezEthereumAddress: null,
  toBjj: null,
  amount: '3400000000',
  fee: 147,
  nonce: 2,
  requestFromAccountIndex: null,
  requestToAccountIndex: null,
  requestToHezEthereumAddress: null,
  requestToBjj: null,
  requestTokenId: null,
  requestAmount: null,
  requestFee: null,
  requestNonce: null
}

const exitTransactionEncoded = Object.assign({}, exitTransaction, {
  chainId: 1337,
  fromAccountIndex: 4444,
  toAccountIndex: 1
})

// Requires a local blockchain running
describe('#encodeTransaction', () => {
  test('Works correctly for transfers', async () => {
    const encodedTx = await TxUtils._encodeTransaction(transferTransaction, 'http://localhost:8545')
    expect(encodedTx).toEqual(transferTransactionEncoded)
  })

  test('Works correctly for exits', async () => {
    const encodedTx = await TxUtils._encodeTransaction(exitTransaction, 'http://localhost:8545')
    expect(encodedTx).toEqual(exitTransactionEncoded)
  })
})

test('#getTxId', () => {
  // test vectors checked with hermez-node Go implementation
  let txId = TxUtils.getTxId(87654, 5, 4, 144, 0)
  expect(txId).toBe('0x02fb52b5d0b9ef2626c11701bb751b2720c76d59946b9a48146ac153bb6e63bf6a')

  txId = TxUtils.getTxId(87654, 5, 4, 1, 0)
  expect(txId).toBe('0x0276114a8f666fa1ff7dbf34b4a9da577808dc501e3b2760d01fe3ef5473f5737f')

  txId = TxUtils.getTxId(87654, 5, 4, 3, 126)
  expect(txId).toBe('0x025afb63126d3067f61f633d13e5a51da0551af3a4567a9af2db5321ed04214ff4')

  txId = TxUtils.getTxId(87654, 5, 4, 1003, 144)
  expect(txId).toBe('0x02cf390157041c3b1b59f0aaed4da464f0d0d48f1d026e46fd89c7fe1e5aed7fcf')

  txId = TxUtils.getTxId(1, 1, 1, 1, 1)
  expect(txId).toBe('0x020ec18eaae67fcd545998841a9c4be09ee3083e12db6ae5e5213a2ecaaa52d5cf')

  txId = TxUtils.getTxId(999, 999, 999, 999, 255)
  expect(txId).toBe('0x02f036223e79fac776de107f50822552cc964ee9fc4caa304613285f6976bcc940')

  txId = TxUtils.getTxId(transferTransactionEncoded.fromAccountIndex, transferTransactionEncoded.tokenId, transferTransactionEncoded.amount, transferTransactionEncoded.nonce, transferTransactionEncoded.fee)
  expect(txId).toBe('0x02e93cb7de4a67c690f022e863238283ede833c1824e50b62e8f7be6988ecd5758')
})

test('#getFee', () => {
  const fee = TxUtils.getFee(0.000143, transferTransaction.amount, 8)
  expect(fee).toBe(26)
})

describe('#getTransactionType', () => {
  test('Returns Transfer', () => {
    const transferTx = {
      to: 'hez:DAI:4444'
    }
    expect(TxUtils.getTransactionType(transferTx)).toBe('Transfer')
  })

  test('Returns TransferToEthAddr', () => {
    const transferTx = {
      to: 'hez:0x380ed8Bd696c78395Fb1961BDa42739D2f5242a1'
    }
    expect(TxUtils.getTransactionType(transferTx)).toBe('TransferToEthAddr')
  })

  test('Returns Exit', () => {
    const exitTx = {
      to: null
    }
    expect(TxUtils.getTransactionType(exitTx)).toBe('Exit')
  })
})

describe('#getNonce', () => {
  const bjj1 = 'bjj1'
  const accountIndex1 = 1
  const id1 = 1
  const tokenId1 = 1
  const localTx = {
    id: id1,
    fromAccountIndex: accountIndex1
  }
  const poolTx1 = {
    id: id1,
    fromAccountIndex: accountIndex1,
    nonce: 2,
    token: {
      id: tokenId1
    }
  }
  const poolTx2 = {
    id: id1,
    fromAccountIndex: accountIndex1,
    nonce: 3,
    token: {
      id: tokenId1
    }
  }

  const tokenId2 = 2
  const poolTx3 = {
    id: id1,
    fromAccountIndex: accountIndex1,
    nonce: 2,
    token: {
      id: tokenId2
    }
  }

  beforeEach(() => {
    jest.mock('axios')
    TransactionPool.initializeTransactionPool()
  })

  afterEach(() => {
    axios.get.mockRestore()
    TransactionPool._storage.clear()
  })

  test('calculates correct next nonce', async () => {
    axios.get = jest.fn()
      .mockResolvedValue({ data: poolTx1 })
      .mockResolvedValueOnce({ data: poolTx2 })

    TransactionPool.addPoolTransaction(localTx, bjj1)
    TransactionPool.addPoolTransaction(localTx, bjj1)
    TransactionPool.addPoolTransaction(localTx, bjj1)

    // return current nonce since it is still not used
    const nonce = await TxUtils.getNonce(1, accountIndex1, bjj1, tokenId1)
    expect(nonce).toBe(1)

    // return nonce + 1, since nonce 2 is in pending transactions
    const nonce2 = await TxUtils.getNonce(2, accountIndex1, bjj1, tokenId1)
    expect(nonce2).toBe(2)
  })

  test('ignores transactions for other account indexes', async () => {
    axios.get = jest.fn()
      .mockResolvedValue({ data: poolTx1 })
      .mockResolvedValueOnce({ data: poolTx3 })

    TransactionPool.addPoolTransaction(localTx, bjj1)
    TransactionPool.addPoolTransaction(localTx, bjj1)

    const nonce = await TxUtils.getNonce(2, accountIndex1, bjj1, tokenId1)
    expect(nonce).toBe(2)
  })

  test('returns current nonce if no transactions for account index', async () => {
    axios.get = jest.fn()
      .mockResolvedValue({ data: poolTx3 })

    TransactionPool.addPoolTransaction(localTx, bjj1)
    TransactionPool.addPoolTransaction(localTx, bjj1)

    const nonce = await TxUtils.getNonce(1, accountIndex1, bjj1, tokenId1)
    expect(nonce).toBe(1)
  })
})

test('#_buildTxCompressedData', () => {
  const testVectors = [
    {
      tx: {
        chainId: Scalar.sub(Scalar.shl(1, 16), 1),
        fromAccountIndex: Scalar.sub(Scalar.shl(1, 48), 1),
        toAccountIndex: Scalar.sub(Scalar.shl(1, 48), 1),
        amount: Scalar.fromString('10235000000000000000000000000000000'), // 0xFFFF in float16
        tokenId: Scalar.sub(Scalar.shl(1, 32), 1),
        nonce: Scalar.sub(Scalar.shl(1, 40), 1),
        fee: Scalar.sub(Scalar.shl(1, 3), 1),
        toBjjSign: true
      },
      txCompressedData: '107ffffffffffffffffffffffffffffffffffffffffffffffffffc60be60f'
    },
    {
      tx: {
        chainId: 0,
        fromAccountIndex: 0,
        toAccountIndex: 0,
        amount: 0,
        tokenId: 0,
        nonce: 0,
        fee: 0,
        toBjjSign: false
      },
      txCompressedData: 'c60be60f'
    },
    {
      tx: {
        chainId: 1,
        fromAccountIndex: 324,
        toAccountIndex: 256,
        amount: Scalar.fromString('39000000000000000000'),
        tokenId: 1,
        nonce: 76,
        fee: 214,
        toBjjSign: false
      },
      txCompressedData: 'd6000000004c0000000189860000000001000000000001440001c60be60f'
    },
    {
      tx: {
        chainId: 0,
        fromAccountIndex: 2,
        toAccountIndex: 3,
        amount: 4,
        tokenId: 5,
        nonce: 0,
        fee: 0,
        toBjjSign: false
      },
      txCompressedData: '500040000000000030000000000020000c60be60f'
    },
    {
      tx: {
        chainId: 0,
        fromAccountIndex: 2,
        toAccountIndex: 3,
        amount: 4,
        tokenId: 5,
        nonce: 6,
        fee: 0,
        toBjjAy: 'c433f7a696b7aa3a5224efb3993baf0ccd9e92eecee0c29a3f6c8208a9e81d1e',
        toBjjSign: true
      },
      txCompressedData: '10000000000060000000500040000000000030000000000020000c60be60f'
    }
  ]

  for (let i = 0; i < testVectors.length; i++) {
    const { tx, txCompressedData } = testVectors[i]

    const computeTxCompressedData = TxUtils._buildTxCompressedData(tx)
    expect(computeTxCompressedData.toString(16)).toBe(txCompressedData)
  }
})

test('#buildTransactionHashMessage', () => {
  const testVectors = [
    {
      tx: {
        fromAccountIndex: 2,
        toAccountIndex: 3,
        amount: 4,
        tokenId: 5,
        nonce: 6,
        toEthAddr: '0xc58d29fA6e86E4FAe04DDcEd660d45BCf3Cb2370'
      },
      hashSignature: '15e95fbf3ebf4f7f25717bb8d349742c1c8157ef6787e00b4174ef262af31c0e'
    },
    {
      tx: {
        chainId: Scalar.sub(Scalar.shl(1, 16), 1),
        fromAccountIndex: Scalar.sub(Scalar.shl(1, 48), 1),
        toAccountIndex: Scalar.sub(Scalar.shl(1, 48), 1),
        amount: Scalar.fromString('10235000000000000000000000000000000'), // 0xFFFF in float16
        tokenId: Scalar.sub(Scalar.shl(1, 32), 1),
        nonce: Scalar.sub(Scalar.shl(1, 40), 1),
        fee: Scalar.sub(Scalar.shl(1, 3), 1),
        maxNumBatch: Scalar.sub(Scalar.shl(1, 32), 1),
        toBjjSign: true,
        toEthAddr: '0x925a82559d756f06930e7686eda18f0928d06633',
        toBjjAy: 'ee073100c0b25c40524317bd011ce832b10633810a7c3cd3c9f59aaa02e9b9d',
        rqTxCompressedDataV2: Scalar.sub(Scalar.shl(1, 193), 1),
        rqToEthAddr: '0x90ad476d5877c05262a74485393df18869965405',
        rqToBjjAy: '2d80c8e0a35c065ba5f8ec53d59282ca7664231704866d3875c338055b05dc39'
      },
      hashSignature: '24811b2482fbbac92f61118fbd8946c9bca6a97d037d0250d22ccc453d76864c'
    },
    {
      tx: {
        chainId: 0,
        fromAccountIndex: 0,
        toAccountIndex: 0,
        amount: 0,
        tokenId: 0,
        nonce: 0,
        fee: 0,
        maxNumBatch: 0,
        toBjjSign: false,
        toEthAddr: '0x56136932bebca80ff636da32b6f3531dc95c78f4',
        toBjjAy: '1e957ec86f3fd2fdc0779701059b43651bee5795599700fb80cdf2fd6be5b695',
        rqTxCompressedDataV2: 0,
        rqToEthAddr: '0xe7c6d376022ab8d70727f06276a4fead435a0a4d',
        rqToBjjAy: '2d4a25612fb2fd322ff0483627eb04cc6e81dde3d9c8cb654f9d16d5a347de64'
      },
      hashSignature: '30200ee98e5fb087d411bd2475700e20619f3ef6a2289acb22a8d251eac96556'
    },
    {
      tx: {
        chainId: 1,
        fromAccountIndex: 439,
        toAccountIndex: 825429,
        amount: Scalar.fromString('5300000000000000000'),
        tokenId: 1,
        nonce: 6,
        fee: 226,
        maxNumBatch: 16385,
        toBjjSign: false,
        toEthAddr: '0xf4e2b0fcbd0dc4b326d8a52b718a7bb43bdbd072',
        toBjjAy: '1f510abec21e82db99da4fb99ffee33e6de708df9fab9acb1f859267ba76ebc6',
        rqTxCompressedDataV2: Scalar.fromString('98743293726037486'),
        rqToEthAddr: '0x4a4547136a017c665fcedcdddca9dfd6d7dbc77f',
        rqToBjjAy: 'bc9e50b1e61510b2ad6f9c0784f4c028cde7f3581d2b9c8c365b90c96cb3426'
      },
      hashSignature: '2d594d31c173fc31217ee72d0e781c8c049c32fa073492d61de25b0d6d4bbb53'
    }
  ]

  for (let i = 0; i < testVectors.length; i++) {
    const { tx, hashSignature } = testVectors[i]

    const computeHashSignature = TxUtils.buildTransactionHashMessage(tx)
    expect(computeHashSignature.toString(16)).toBe(hashSignature)
  }
})

describe('#generateL2Transaction', () => {
  const transferTx = {
    from: 'hez:DAI:4444',
    to: 'hez:DAI:1234',
    toHezEthereumAddress: null,
    toBjj: null,
    amount: HermezCompressedAmount.compressAmount('3400000000'),
    fee: 0.000003,
    nonce: 2
  }

  const exitTx = {
    from: 'hez:DAI:4444',
    to: 'hez:DAI:1',
    toHezEthereumAddress: null,
    toBjj: null,
    amount: HermezCompressedAmount.compressAmount('3400000000'),
    fee: 0.000003,
    nonce: 2
  }

  const bjj = 1
  const token = {
    id: 0,
    decimals: 9
  }

  beforeEach(() => {
    transferTransaction.id = '0x02e93cb7de4a67c690f022e863238283ede833c1824e50b62e8f7be6988ecd5758'
    exitTransaction.id = '0x02e93cb7de4a67c690f022e863238283ede833c1824e50b62e8f7be6988ecd5758'
    TransactionPool.initializeTransactionPool()
  })

  afterEach(() => {
    delete transferTransaction.id
    delete exitTransaction.id
    TransactionPool._storage.clear()
  })

  test('Works for transfers', async () => {
    const { transaction, encodedTransaction } = await TxUtils.generateL2Transaction(transferTx, bjj, token)
    transaction.type = 'Transfer'
    encodedTransaction.type = 'Transfer'
    expect(transaction).toEqual(transferTransaction)
    expect(encodedTransaction).toEqual(transferTransactionEncoded)
  })

  test('Works for exits', async () => {
    const { transaction, encodedTransaction } = await TxUtils.generateL2Transaction(exitTx, bjj, token)
    transaction.type = 'Exit'
    encodedTransaction.type = 'Exit'
    expect(transaction).toEqual(exitTransaction)
    expect(encodedTransaction).toEqual(exitTransactionEncoded)
  })
})

test('#beautifyTransactionState', () => {
  expect(TxUtils.beautifyTransactionState('fged')).toBe('Forged')
  expect(TxUtils.beautifyTransactionState('fing')).toBe('Forging')
  expect(TxUtils.beautifyTransactionState('pend')).toBe('Pending')
  expect(TxUtils.beautifyTransactionState('invl')).toBe('Invalid')
})
