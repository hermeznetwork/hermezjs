import { ethers } from 'ethers'

import * as Providers from '../../src/providers.js'

test('#getProvider', () => {
  const providerUrl = 'http://localhost:8545'
  const provider = Providers.getProvider(providerUrl)
  expect(provider).toBeInstanceOf(ethers.providers.JsonRpcProvider)
  expect(provider.connection.url).toBe(providerUrl)
})
