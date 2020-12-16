import ethers from 'ethers'

import { getProvider } from './providers.js'
import { getSigner } from './signers.js'

const contractsCache = new Map()

/**
 * Caches smart contract instances
 *
 * @param {String} contractAddress - The smart contract address
 * @param {Array} abi - The smart contract ABI
 * @param {Object} signerData - Signer data used to build a Signer to send any deployment transaction
 *
 */
function getContract (contractAddress, abi, signerData) {
  if (contractsCache.has(contractAddress)) {
    return contractsCache.get(contractAddress)
  }

  const provider = getProvider()
  const signer = getSigner(provider, signerData)
  const contract = new ethers.Contract(contractAddress, abi, signer)

  contractsCache.set(contractAddress, contract)

  return contract
}

export {
  getContract
}
