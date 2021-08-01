import * as AtomicUtils from '../../src/atomic-utils.js'

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

const transferTransaction2 = {
  type: 'Transfer',
  tokenId: 0,
  fromAccountIndex: 'hez:DAI:5555',
  toAccountIndex: 'hez:DAI:4321',
  toHezEthereumAddress: null,
  toBjj: null,
  amount: '3400000000',
  fee: 20,
  nonce: 4,
  requestFromAccountIndex: 'hez:DAI:4444',
  requestToAccountIndex: 'hez:DAI:1234',
  requestToHezEthereumAddress: null,
  requestToBjj: null,
  requestTokenId: 0,
  requestAmount: '3400000000',
  requestFee: 25,
  requestNonce: 2
}

describe('#hasLinkedTransaction', () => {
  test('Transaction without linkTx', () => {
    const hasLinkTx = AtomicUtils.hasLinkedTransaction(transferTransaction)
    expect(hasLinkTx).toEqual(false)
  })

  test('Transaction with linkTx', () => {
    const hasLinkTx = AtomicUtils.hasLinkedTransaction(transferTransaction2)
    expect(hasLinkTx).toEqual(true)
  })
})

describe('#addLinkedTransaction', () => {
  test('Add linked transaction', () => {
    AtomicUtils.addLinkedTransaction(transferTransaction, transferTransaction2)
    expect(transferTransaction.requestFromAccountIndex).toEqual(transferTransaction2.fromAccountIndex)
    expect(transferTransaction.requestToAccountIndex).toEqual(transferTransaction2.toAccountIndex)
    expect(transferTransaction.requestToHezEthereumAddress).toEqual(transferTransaction2.toHezEthereumAddress)
    expect(transferTransaction.requestToBjj).toEqual(transferTransaction2.toBjj)
    expect(transferTransaction.requestTokenId).toEqual(transferTransaction2.tokenId)
    expect(transferTransaction.requestAmount).toEqual(transferTransaction2.amount)
    expect(transferTransaction.requestFee).toEqual(transferTransaction2.fee)
    expect(transferTransaction.requestNonce).toEqual(transferTransaction2.nonce)
  })
})

describe('#generateAtomicID', () => {
  test('generate atomic ID', () => {
    const expectedValue = '0x713ee5adc082677e6b62343cfbd05a468bd74ad8b45a1c274e18c29f820fa3fd'

    const txs = [{ amount: '100000000000000000', fee: 126, fromAccountIndex: 'hez:HEZ:24290', fromBJJ: 'hez:XBo-i41JE1siNZfGPV9EyroWm1iESc8L0utpNvM1TaO_', fromHezEthereumAddress: 'hez:0x5db35CdA08c794E4B610f82c286d58D09B8eDFD3', id: '0x023b93814d852ffb0063a51317601e537c7dddccffd7f5e1cf6aba3fa9227440b5', info: null, itemId: 63, nonce: 0, requestAmount: '100000000000000000', requestFee: 126, requestFromAccountIndex: 'hez:HEZ:24291', requestNonce: 0, requestToAccountIndex: null, requestToBJJ: null, requestToHezEthereumAddress: 'hez:0x5db35CdA08c794E4B610f82c286d58D09B8eDFD3', requestTokenId: 1, signature: '1f51b7c31f87b0c83a9ff1478f4287520ff056b21ee5ac95ad49c99492ab8991fbabdebf6a1621e7994adbc5bd9093462f4ac1dc78234a43b3635f7e79d54605', state: 'fged', timestamp: '2021-07-16T08:28:35.297545Z', toAccountIndex: 'hez:HEZ:0', toBJJ: null, toHezEthereumAddress: 'hez:0x10272b5f04De4CE3aEBa30Be300303D058d0b117', token: { USD: 3.2114, decimals: 18, ethereumAddress: '0x55a1db90a5753e6ff50fd018d7e648d58a081486', ethereumBlockNum: 4417287, fiatUpdate: '2021-07-16T08:50:16.942908Z', id: 1, itemId: 2, name: 'Hermez Network Token', symbol: 'HEZ' }, type: 'TransferToEthAddr' }, { amount: '100000000000000000', fee: 126, fromAccountIndex: 'hez:HEZ:24291', fromBJJ: 'hez:vz2lLga_tN-B2ZDfdfBsi2XDv37r9jnuvAAgj545myG3', fromHezEthereumAddress: 'hez:0x10272b5f04De4CE3aEBa30Be300303D058d0b117', id: '0x0283401ea1e00a263d4e6bae5d7dc1ab97420f2a5fcde50fa86aa4870441c04921', info: null, itemId: 64, nonce: 0, requestAmount: '100000000000000000', requestFee: 126, requestFromAccountIndex: 'hez:HEZ:24290', requestNonce: 0, requestToAccountIndex: null, requestToBJJ: null, requestToHezEthereumAddress: 'hez:0x10272b5f04De4CE3aEBa30Be300303D058d0b117', requestTokenId: 1, signature: '10e53b5694eddacdae7e6bb6d6bb34940b58455fade46034fe5f50c261dde10acf083cd963d4c0320582bb98ac5f71d8c8ae1c09c3a83e2aa2ba92fcab3ac100', state: 'fged', timestamp: '2021-07-16T08:28:35.297545Z', toAccountIndex: 'hez:HEZ:0', toBJJ: null, toHezEthereumAddress: 'hez:0x5db35CdA08c794E4B610f82c286d58D09B8eDFD3', token: { USD: 3.2114, decimals: 18, ethereumAddress: '0x55a1db90a5753e6ff50fd018d7e648d58a081486', ethereumBlockNum: 4417287, fiatUpdate: '2021-07-16T08:50:16.942908Z', id: 1, itemId: 2, name: 'Hermez Network Token', symbol: 'HEZ' }, type: 'TransferToEthAddr' }]
    const res = AtomicUtils.generateAtomicID(txs)

    expect(res).toEqual(expectedValue)
  })
})

describe('#generateAtomicGroup', () => {
  test('generate atomic Group', () => {
    const expectedValueID = '0x877c987dfb98eb7f88037e6b76268654d4e20a4d0c02745cacc414c25426022a' // from go test

    const txs = [{ amount: '100000000000000000', fee: 126, fromAccountIndex: 'hez:HEZ:24290', fromBJJ: 'hez:XBo-i41JE1siNZfGPV9EyroWm1iESc8L0utpNvM1TaO_', fromHezEthereumAddress: 'hez:0x5db35CdA08c794E4B610f82c286d58D09B8eDFD3', id: '0x02fa99450ea0e18212a082dbe2b71cb1df3668e5bef2a417fbf275278535a85d67', info: 'BatchNum: 25385. Unselectable atomic group 0x877c987dfb98eb7f88037e6b76268654d4e20a4d0c02745cacc414c25426022a, tx 0x02fa99450ea0e18212a082dbe2b71cb1df3668e5bef2a417fbf275278535a85d67 failed due to: Tx not selected due to not current Nonce. Tx.Nonce: 2, Account.Nonce: 1', itemId: 65, nonce: 2, requestAmount: '100000000000000000', requestFee: 126, requestFromAccountIndex: 'hez:HEZ:24291', requestNonce: 2, requestToAccountIndex: null, requestToBJJ: null, requestToHezEthereumAddress: 'hez:0x5db35CdA08c794E4B610f82c286d58D09B8eDFD3', requestTokenId: 1, signature: 'c05c85ffd4fe517dc209cc200d955c3b779e57c45011b02ef75d5380fe105c2dff9b98cbd5900d38c1e4705274535fccc776b7f10d111bae2535dbf1dfbb9a05', state: 'fged', timestamp: '2021-07-16T08:58:02.810152Z', toAccountIndex: 'hez:HEZ:0', toBJJ: null, toHezEthereumAddress: 'hez:0x10272b5f04De4CE3aEBa30Be300303D058d0b117', token: { USD: 3.2205, decimals: 18, ethereumAddress: '0x55a1db90a5753e6ff50fd018d7e648d58a081486', ethereumBlockNum: 4417287, fiatUpdate: '2021-07-16T09:10:17.75789Z', id: 1, itemId: 2, name: 'Hermez Network Token', symbol: 'HEZ' }, type: 'TransferToEthAddr' }, { amount: '100000000000000000', fee: 126, fromAccountIndex: 'hez:HEZ:24291', fromBJJ: 'hez:vz2lLga_tN-B2ZDfdfBsi2XDv37r9jnuvAAgj545myG3', fromHezEthereumAddress: 'hez:0x10272b5f04De4CE3aEBa30Be300303D058d0b117', id: '0x02b25f36a14d0114bc5b83cae25fffa4ca53f27afacb323ef4cf6391915fca8aa1', info: 'BatchNum: 25385. Tx not selected due to not current Nonce. Tx.Nonce: 2, Account.Nonce: 1', itemId: 66, nonce: 2, requestAmount: '100000000000000000', requestFee: 126, requestFromAccountIndex: 'hez:HEZ:24290', requestNonce: 2, requestToAccountIndex: null, requestToBJJ: null, requestToHezEthereumAddress: 'hez:0x10272b5f04De4CE3aEBa30Be300303D058d0b117', requestTokenId: 1, signature: '4f1b76356cb00c10cb981b5e1c4ee3a31410f83ae66c8aabe988a5696ace3e8f5a7b4f0674b7e399293e30d86a37cb0bb9f47995272d62b4307c46d712143c04', state: 'fged', timestamp: '2021-07-16T08:58:02.810152Z', toAccountIndex: 'hez:HEZ:0', toBJJ: null, toHezEthereumAddress: 'hez:0x5db35CdA08c794E4B610f82c286d58D09B8eDFD3', token: { USD: 3.2205, decimals: 18, ethereumAddress: '0x55a1db90a5753e6ff50fd018d7e648d58a081486', ethereumBlockNum: 4417287, fiatUpdate: '2021-07-16T09:10:17.75789Z', id: 1, itemId: 2, name: 'Hermez Network Token', symbol: 'HEZ' }, type: 'TransferToEthAddr' }]
    const res = AtomicUtils.generateAtomicGroup(txs)

    expect(res.atomicGroupId).toEqual(expectedValueID)
    expect(res.transactions[0].requestOffset).toEqual(1)
    expect(res.transactions[1].requestOffset).toEqual(7)

    const requestOffsets = [2, 3]
    const res2 = AtomicUtils.generateAtomicGroup(txs, requestOffsets)

    expect(res2.atomicGroupId).toEqual(expectedValueID)
    expect(res2.transactions[0].requestOffset).toEqual(2)
    expect(res2.transactions[1].requestOffset).toEqual(3)
  })
})
