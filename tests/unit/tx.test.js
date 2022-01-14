import { jest } from '@jest/globals'
import axios from 'axios'

import * as Tx from '../../src/tx.js'
import { setProvider } from '../../src/providers.js'

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

  beforeAll(async () => {
    setProvider(providerUrl)

    axios.post = jest.fn().mockResolvedValue({
      status: 200,
      data: txId
    })
  })

  afterAll(async () => {
    axios.post.mockRestore()
  })

  test('#sendL2Transaction mock', async () => {
    const txResult = await Tx.sendL2Transaction(tx, ['http://127.0.0.1:8086'])

    expect(txResult).toEqual({
      status: 200,
      id: txId,
      nonce: 2
    })
  })
})
