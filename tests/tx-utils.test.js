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
  fee: 25,
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
  fee: 25,
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
  expect(txId).toBe('0x022669acda59b827d20ef5354a3eebd1dffb3972b0a6bf89d18bfd2efa0ab9f41e')

  txId = TxUtils.getTxId(87654, 5, 4, 1, 0)
  expect(txId).toBe('0x029e7499a830f8f5eb17c07da48cf91415710f1bcbe0169d363ff91e81faf92fc2')

  txId = TxUtils.getTxId(87654, 5, 4, 3, 126)
  expect(txId).toBe('0x0255c70ed20e1b8935232e1b9c5884dbcc88a6e1a3454d24f2d77252eb2bb0b64e')

  txId = TxUtils.getTxId(87654, 5, 4, 1003, 144)
  expect(txId).toBe('0x0206b372f967061d1148bbcff679de38120e075141a80a07326d0f514c2efc6ca9')

  txId = TxUtils.getTxId(1, 1, 1, 1, 1)
  expect(txId).toBe('0x0236f7ea5bccf78ba60baf56c058d235a844f9b09259fd0efa4f5f72a7d4a26618')

  txId = TxUtils.getTxId(999, 999, 999, 999, 255)
  expect(txId).toBe('0x02ac122f5b709ce190129fecbbe35bfd30c70e6433dbd85a8eb743d110906a1dc1')

  txId = TxUtils.getTxId(transferTransactionEncoded.fromAccountIndex, transferTransactionEncoded.tokenId, transferTransactionEncoded.amount, transferTransactionEncoded.nonce, transferTransactionEncoded.fee)
  expect(txId).toBe('0x02c674951a81881b7bc50db3b9e5efd97ac88550c7426ac548720e5057cfba515a')
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
        tokenId: Scalar.sub(Scalar.shl(1, 32), 1),
        nonce: Scalar.sub(Scalar.shl(1, 40), 1),
        fee: Scalar.sub(Scalar.shl(1, 3), 1),
        toBjjSign: true
      },
      txCompressedData: '107ffffffffffffffffffffffffffffffffffffffffffffffc60be60f'
    },
    {
      tx: {
        chainId: 0,
        fromAccountIndex: 0,
        toAccountIndex: 0,
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
        tokenId: 1,
        nonce: 76,
        fee: 214,
        toBjjSign: false
      },
      txCompressedData: 'd6000000004c000000010000000001000000000001440001c60be60f'
    },
    {
      tx: {
        chainId: 0,
        fromAccountIndex: 1,
        toAccountIndex: 2,
        tokenId: 3,
        nonce: 4,
        fee: 5,
        toBjjSign: false
      },
      txCompressedData: '50000000004000000030000000000020000000000010000c60be60f'
    },
    {
      tx: {
        chainId: 0,
        fromAccountIndex: 2,
        toAccountIndex: 3,
        tokenId: 4,
        nonce: 5,
        fee: 6,
        toBjjAy: 'c433f7a696b7aa3a5224efb3993baf0ccd9e92eecee0c29a3f6c8208a9e81d1e',
        toBjjSign: true
      },
      txCompressedData: '1060000000005000000040000000000030000000000020000c60be60f'
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
        toEthereumAddress: '0xc58d29fA6e86E4FAe04DDcEd660d45BCf3Cb2370'
      },
      hashSignature: '2d49ce1d4136e06f64e3eb1f79a346e6ee3e93ceeac909a57806a8d87005c263'
    },
    {
      tx: {
        chainId: Scalar.sub(Scalar.shl(1, 16), 1),
        fromAccountIndex: Scalar.sub(Scalar.shl(1, 48), 1),
        toAccountIndex: Scalar.sub(Scalar.shl(1, 48), 1),
        amount: Scalar.fromString('343597383670000000000000000000000000000000'), // 0xFFFFFFFFFF in float40
        tokenId: Scalar.sub(Scalar.shl(1, 32), 1),
        nonce: Scalar.sub(Scalar.shl(1, 40), 1),
        fee: Scalar.sub(Scalar.shl(1, 3), 1),
        maxNumBatch: Scalar.sub(Scalar.shl(1, 32), 1),
        toBjjSign: true,
        toEthereumAddress: '0x925a82559d756f06930e7686eda18f0928d06633',
        toBjjAy: 'ee073100c0b25c40524317bd011ce832b10633810a7c3cd3c9f59aaa02e9b9d',
        rqTxCompressedDataV2: Scalar.sub(Scalar.shl(1, 193), 1),
        rqToEthAddr: '0x90ad476d5877c05262a74485393df18869965405',
        rqToBjjAy: '2d80c8e0a35c065ba5f8ec53d59282ca7664231704866d3875c338055b05dc39'
      },
      hashSignature: '14d2991a0e4826edc31639877f4b2bc2ab4926a27c457f85a77964755e787a3e'
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
        toEthereumAddress: '0x56136932bebca80ff636da32b6f3531dc95c78f4',
        toBjjAy: '1e957ec86f3fd2fdc0779701059b43651bee5795599700fb80cdf2fd6be5b695',
        rqTxCompressedDataV2: 0,
        rqToEthAddr: '0xe7c6d376022ab8d70727f06276a4fead435a0a4d',
        rqToBjjAy: '2d4a25612fb2fd322ff0483627eb04cc6e81dde3d9c8cb654f9d16d5a347de64'
      },
      hashSignature: '1e309632428a50370a148e59f3b9395732b54047100a8a06b6d459c2132357a2'
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
        toEthereumAddress: '0xf4e2b0fcbd0dc4b326d8a52b718a7bb43bdbd072',
        toBjjAy: '1f510abec21e82db99da4fb99ffee33e6de708df9fab9acb1f859267ba76ebc6',
        rqTxCompressedDataV2: Scalar.fromString('98743293726037486'),
        rqToEthAddr: '0x4a4547136a017c665fcedcdddca9dfd6d7dbc77f',
        rqToBjjAy: 'bc9e50b1e61510b2ad6f9c0784f4c028cde7f3581d2b9c8c365b90c96cb3426'
      },
      hashSignature: '5f353b964b53850c90aa7ae6b9ad112553b7c1091b6de26e89db0a125b264d0'
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
    transferTransaction.id = '0x029c8aef9ef24531e4cf84e78cbab1018ba1626a5a10afb6b7c356be1b5c28e92c'
    exitTransaction.id = '0x029c8aef9ef24531e4cf84e78cbab1018ba1626a5a10afb6b7c356be1b5c28e92c'
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
