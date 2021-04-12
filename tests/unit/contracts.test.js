import { ethers } from 'ethers'

import ERC20ABI from '../../src/abis/ERC20ABI.js'
import * as Contracts from '../../src/contracts.js'
import { SignerType } from '../../src/signers.js'

test('#getContract', () => {
  const contractAddress = '0x24650cad431915051e2987455b76e0cdcaa1d4d8'
  const contract = Contracts.getContract(contractAddress, ERC20ABI, { type: SignerType.JSON_RPC }, 'http://localhost:8545')
  expect(contract).toBeInstanceOf(ethers.Contract)
  expect(Contracts._contractsCache.get(contractAddress + undefined)).toBe(contract)
})
