import { jest } from '@jest/globals'
import axios from 'axios'
import { Scalar } from 'ffjavascript'

import * as TransactionPool from '../../src/tx-pool.js'
import * as TxUtils from '../../src/tx-utils.js'
import { HermezCompressedAmount } from '../../src/hermez-compressed-amount.js'

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
  requestNonce: null,
  maxNumBatch: 0
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
  requestNonce: null,
  maxNumBatch: 0
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

test('#getL1TxId', () => {
  const txId = TxUtils.getL1UserTxId(123456, 71)

  expect(txId).toBe('0x00a6cbae3b8661fb75b0919ca6605a02cfb04d9c6dd16870fa0fcdf01befa32768')
})

test('#getL2TxId', () => {
  // test vectors checked with hermez-node Go implementation
  let txId = TxUtils.getL2TxId(87654, 5, 4, 144, 0)
  expect(txId).toBe('0x022669acda59b827d20ef5354a3eebd1dffb3972b0a6bf89d18bfd2efa0ab9f41e')

  txId = TxUtils.getL2TxId(87654, 5, 4, 1, 0)
  expect(txId).toBe('0x029e7499a830f8f5eb17c07da48cf91415710f1bcbe0169d363ff91e81faf92fc2')

  txId = TxUtils.getL2TxId(87654, 5, 4, 3, 126)
  expect(txId).toBe('0x0255c70ed20e1b8935232e1b9c5884dbcc88a6e1a3454d24f2d77252eb2bb0b64e')

  txId = TxUtils.getL2TxId(87654, 5, 4, 1003, 144)
  expect(txId).toBe('0x0206b372f967061d1148bbcff679de38120e075141a80a07326d0f514c2efc6ca9')

  txId = TxUtils.getL2TxId(1, 1, 1, 1, 1)
  expect(txId).toBe('0x0236f7ea5bccf78ba60baf56c058d235a844f9b09259fd0efa4f5f72a7d4a26618')

  txId = TxUtils.getL2TxId(999, 999, 999, 999, 255)
  expect(txId).toBe('0x02ac122f5b709ce190129fecbbe35bfd30c70e6433dbd85a8eb743d110906a1dc1')

  txId = TxUtils.getL2TxId(transferTransactionEncoded.fromAccountIndex, transferTransactionEncoded.tokenId, transferTransactionEncoded.amount, transferTransactionEncoded.nonce, transferTransactionEncoded.fee)
  expect(txId).toBe('0x02c674951a81881b7bc50db3b9e5efd97ac88550c7426ac548720e5057cfba515a')
})

test('#getFeeIndex', () => {
  const fee = TxUtils.getFeeIndex('35598708204417712', '123947159100000000000000000')
  expect(fee).toBe(18)

  const noFee = TxUtils.getFeeIndex('0', '1531370348000000000')
  expect(noFee).toBe(0)
})

test('#getFeeValue', () => {
  const fee = TxUtils.getFeeValue(30, Scalar.fromString('1531370348000000000'))
  expect(fee).toBe(Scalar.fromString('628771404325698'))
})

test('#getMaxAmountFromMinimumFee', () => {
  const fee = TxUtils.getMaxAmountFromMinimumFee(Scalar.fromString('32459016393442626'), Scalar.fromString('666000000000000000000'))
  expect(fee).toBe(Scalar.fromString('665911354799599785458'))
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

  test('Returns TransferToBJJ', () => {
    const transferToBJJ = {
      to: 'hez:CCBCP-a9lp7jCTYWOlioJyuStfkAT-OxQXZ-OkC7KIF6'
    }
    expect(TxUtils.getTransactionType(transferToBJJ)).toBe('TransferToBJJ')
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

test('#buildTxCompressedDataV2', () => {
  const testVectors = [
    {
      tx: {
        fromAccountIndex: Scalar.sub(Scalar.shl(1, 48), 1),
        toAccountIndex: Scalar.sub(Scalar.shl(1, 48), 1),
        amount: Scalar.fromString('343597383670000000000000000000000000000000'), // 0xFFFFFFFFFF in float40
        tokenId: Scalar.sub(Scalar.shl(1, 32), 1),
        nonce: Scalar.sub(Scalar.shl(1, 40), 1),
        fee: Scalar.sub(Scalar.shl(1, 3), 1),
        toBjjSign: true
      },
      txCompressedDataV2: '107ffffffffffffffffffffffffffffffffffffffffffffffffffff'
    },
    {
      tx: {
        fromAccountIndex: 0,
        toAccountIndex: 0,
        amount: 0,
        tokenId: 0,
        nonce: 0,
        fee: 0,
        toBjjSign: false
      },
      txCompressedDataV2: '0'
    },
    {
      tx: {
        fromAccountIndex: 324,
        toAccountIndex: 256,
        amount: 10000000000000000000,
        tokenId: 1,
        nonce: 76,
        fee: 214,
        toBjjSign: false
      },
      txCompressedDataV2: 'd6000000004c000000014a540be400000000000100000000000144'
    },
    {
      tx: {
        fromAccountIndex: 1,
        toAccountIndex: 2,
        amount: 3,
        tokenId: 4,
        nonce: 5,
        fee: 6,
        toBjjSign: false
      },
      txCompressedDataV2: '60000000005000000040000000003000000000002000000000001'
    }
  ]

  for (let i = 0; i < testVectors.length; i++) {
    const { tx, txCompressedDataV2 } = testVectors[i]

    const computeTxCompressedData = TxUtils.buildTxCompressedDataV2(tx)
    expect(computeTxCompressedData.toString(16)).toBe(txCompressedDataV2)
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
      hashSignature: 'b8abaf6b7933464e4450df2514da8b72606c02bf7f89bf6e54816fbda9d9d57'
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
        rqToEthereumAddress: '0x90ad476d5877c05262a74485393df18869965405',
        rqToBjjAy: '2d80c8e0a35c065ba5f8ec53d59282ca7664231704866d3875c338055b05dc39'
      },
      hashSignature: '2ed59795dac2758098e09cfd93c09936a5a7d9ca5ffdb5e0f71d77ef036d4d5a'
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
        rqToEthereumAddress: '0xe7c6d376022ab8d70727f06276a4fead435a0a4d',
        rqToBjjAy: '2d4a25612fb2fd322ff0483627eb04cc6e81dde3d9c8cb654f9d16d5a347de64'
      },
      hashSignature: '5768de86d708006a4695dee75d1ae1b56ae100480e8b3a5179c7ec67717323f'
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
        rqToEthereumAddress: '0x4a4547136a017c665fcedcdddca9dfd6d7dbc77f',
        rqToBjjAy: 'bc9e50b1e61510b2ad6f9c0784f4c028cde7f3581d2b9c8c365b90c96cb3426'
      },
      hashSignature: '6226f6b16dc853fa8225e82e5fd675f51858e7cd6b3a951c169ac01d7125c71'
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
    transferTransaction.id = '0x02c674951a81881b7bc50db3b9e5efd97ac88550c7426ac548720e5057cfba515a'
    exitTransaction.id = '0x02c674951a81881b7bc50db3b9e5efd97ac88550c7426ac548720e5057cfba515a'
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

  test('Check maxNumBatch', async () => {
    // expected transaction with maxNumBatch
    const expectedTx = Object.assign({}, transferTransaction, { maxNumBatch: 3 })
    // transaction with maxNumBatch
    const tx = Object.assign({}, transferTx, { maxNumBatch: 3 })

    const txEncoded = Object.assign({}, transferTransactionEncoded, {
      maxNumBatch: 3,
      chainId: 1337,
      fromAccountIndex: 4444,
      toAccountIndex: 1234
    })

    const { transaction, encodedTransaction } = await TxUtils.generateL2Transaction(tx, bjj, token)

    expect(transaction).toEqual(expectedTx)
    expect(encodedTransaction).toEqual(txEncoded)
  })
})

describe('#generateAtomicTransaction', () => {
  beforeEach(() => {
    TransactionPool.initializeTransactionPool()
  })

  afterEach(() => {
    TransactionPool._storage.clear()
  })

  test('Link transferToIdx transaction', async () => {
    const txA = {
      from: 'hez:HEZ:4141',
      to: 'hez:HEZ:4242',
      amount: HermezCompressedAmount.compressAmount('42000000000000000000'),
      fee: 0.02,
      nonce: 1
    }

    const txB = {
      from: 'hez:HEZ:2121',
      to: 'hez:HEZ:2222',
      amount: HermezCompressedAmount.compressAmount('21000000000000000000'),
      fee: 0.12,
      nonce: 6
    }

    const bjjA = 1
    const tokenA = {
      id: 0,
      decimals: 9
    }

    const bjjB = 2
    const tokenB = {
      id: 1,
      decimals: 10
    }

    const genTxA = await TxUtils.computeL2Transaction(txA, bjjA, tokenA)
    const genTxB = await TxUtils.computeL2Transaction(txB, bjjB, tokenB)

    const atomicTxB = await TxUtils.generateAtomicTransaction(genTxB, genTxA)
    const finalTxB = atomicTxB.transaction

    expect(finalTxB.requestFromAccountIndex).toBe(genTxA.fromAccountIndex)
    expect(finalTxB.requestToAccountIndex).toBe(genTxA.toAccountIndex)
    expect(finalTxB.requestToHezEthereumAddress).toBe(genTxA.toHezEthereumAddress)
    expect(finalTxB.requestToBjj).toBe(genTxA.toBjj)
    expect(finalTxB.requestTokenId).toBe(genTxA.tokenId)
    expect(finalTxB.requestAmount).toBe(genTxA.amount)
    expect(finalTxB.requestFee).toBe(genTxA.fee)
    expect(finalTxB.requestNonce).toBe(genTxA.nonce)
  })

  test('Link exit transaction', async () => {
    const exitTx = {
      type: 'Exit',
      from: 'hez:DAI:5252',
      amount: HermezCompressedAmount.compressAmount('3400000000'),
      fee: 0.000003,
      nonce: 2
    }

    const txB = {
      from: 'hez:HEZ:2121',
      to: 'hez:HEZ:2222',
      amount: HermezCompressedAmount.compressAmount('21000000000000000000'),
      fee: 0.12,
      nonce: 6
    }

    const bjjExit = 1
    const tokenExit = {
      id: 0,
      decimals: 9
    }

    const bjjB = 2
    const tokenB = {
      id: 1,
      decimals: 10
    }

    const genTxA = await TxUtils.computeL2Transaction(exitTx, bjjExit, tokenExit)
    const genTxB = await TxUtils.computeL2Transaction(txB, bjjB, tokenB)

    const atomicTxB = await TxUtils.generateAtomicTransaction(genTxB, genTxA)
    const finalTxB = atomicTxB.transaction

    expect(finalTxB.requestFromAccountIndex).toBe(genTxA.fromAccountIndex)
    expect(finalTxB.requestToAccountIndex).toBe(genTxA.toAccountIndex)
    expect(finalTxB.requestToHezEthereumAddress).toBe(genTxA.toHezEthereumAddress)
    expect(finalTxB.requestToBjj).toBe(genTxA.toBjj)
    expect(finalTxB.requestTokenId).toBe(genTxA.tokenId)
    expect(finalTxB.requestAmount).toBe(genTxA.amount)
    expect(finalTxB.requestFee).toBe(genTxA.fee)
    expect(finalTxB.requestNonce).toBe(genTxA.nonce)
  })

  test('Link transferToEthAddr transaction', async () => {
    const txA = {
      type: 'TransferToEthAddr',
      from: 'hez:HEZ:3231',
      to: 'hez:0xbDDa1cb2a03b625024E7a0030d787F326f7F31A2',
      amount: HermezCompressedAmount.compressAmount('42420000000000000000'),
      fee: 0.2,
      nonce: 8
    }

    const txB = {
      from: 'hez:HEZ:2121',
      to: 'hez:HEZ:2222',
      amount: HermezCompressedAmount.compressAmount('21000000000000000000'),
      fee: 0.12,
      nonce: 6
    }

    const bjjA = 5
    const tokenA = {
      id: 2,
      decimals: 18
    }

    const bjjB = 3
    const tokenB = {
      id: 9,
      decimals: 18
    }

    const genTxA = await TxUtils.computeL2Transaction(txA, bjjA, tokenA)
    const genTxB = await TxUtils.computeL2Transaction(txB, bjjB, tokenB)

    const atomicTxB = await TxUtils.generateAtomicTransaction(genTxB, genTxA)
    const finalTxB = atomicTxB.transaction

    expect(finalTxB.requestFromAccountIndex).toBe(genTxA.fromAccountIndex)
    expect(finalTxB.requestToAccountIndex).toBe(genTxA.toAccountIndex)
    expect(finalTxB.requestToHezEthereumAddress).toBe(genTxA.toHezEthereumAddress)
    expect(finalTxB.requestToBjj).toBe(genTxA.toBjj)
    expect(finalTxB.requestTokenId).toBe(genTxA.tokenId)
    expect(finalTxB.requestAmount).toBe(genTxA.amount)
    expect(finalTxB.requestFee).toBe(genTxA.fee)
    expect(finalTxB.requestNonce).toBe(genTxA.nonce)
  })

  test('Link transferToBjj transaction', async () => {
    const txA = {
      type: 'TransferToBJJ',
      from: 'hez:HEZ:1234',
      to: 'hez:evVpw-0DO8z7iJE6yqloI6hGLahHOiujS4uyjrDJHxSy',
      amount: HermezCompressedAmount.compressAmount('12340000000000000000'),
      fee: 0.1234,
      nonce: 1234
    }

    const txB = {
      from: 'hez:HEZ:2121',
      to: 'hez:HEZ:2222',
      amount: HermezCompressedAmount.compressAmount('21000000000000000000'),
      fee: 0.12,
      nonce: 6
    }

    const bjjA = 5
    const tokenA = {
      id: 2,
      decimals: 18
    }

    const bjjB = 3
    const tokenB = {
      id: 9,
      decimals: 18
    }

    const genTxA = await TxUtils.computeL2Transaction(txA, bjjA, tokenA)
    const genTxB = await TxUtils.computeL2Transaction(txB, bjjB, tokenB)

    const atomicTxB = await TxUtils.generateAtomicTransaction(genTxB, genTxA)
    const finalTxB = atomicTxB.transaction

    expect(finalTxB.requestFromAccountIndex).toBe(genTxA.fromAccountIndex)
    expect(finalTxB.requestToAccountIndex).toBe(genTxA.toAccountIndex)
    expect(finalTxB.requestToHezEthereumAddress).toBe(genTxA.toHezEthereumAddress)
    expect(finalTxB.requestToBjj).toBe(genTxA.toBjj)
    expect(finalTxB.requestTokenId).toBe(genTxA.tokenId)
    expect(finalTxB.requestAmount).toBe(genTxA.amount)
    expect(finalTxB.requestFee).toBe(genTxA.fee)
    expect(finalTxB.requestNonce).toBe(genTxA.nonce)
  })
})

test('#beautifyTransactionState', () => {
  expect(TxUtils.beautifyTransactionState('fged')).toBe('Forged')
  expect(TxUtils.beautifyTransactionState('fing')).toBe('Forging')
  expect(TxUtils.beautifyTransactionState('pend')).toBe('Pending')
  expect(TxUtils.beautifyTransactionState('invl')).toBe('Invalid')
})
