import ethers from 'ethers'

import ERC20ABI from '../src/abis/ERC20ABI.js'
import * as Contracts from '../src/contracts.js'

test('#getContract', () => {
  const contractAddress = '0xf4e77E5Da47AC3125140c470c71cBca77B5c638c'
  const contract = Contracts.getContract(contractAddress, ERC20ABI, 'http://localhost:8545')
  expect(contract).toBeInstanceOf(ethers.Contract)
  expect(Contracts._contractsCache.get(contractAddress)).toBe(contract)
})