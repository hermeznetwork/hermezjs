import { ethers } from 'ethers'

import { getProvider } from './providers.js'
import { getSigner } from './signers.js'

const contractsCache = new Map()

/**
 * Caches smart contract instances
 *
 * @param {String} contractAddress - The smart contract address
 * @param {Array} abi - The smart contract ABI
 * @param {Object} signerData - Signer data used to build a Signer to send any deployment transaction
 * @param {string} providerUrl - Network url (i.e, http://localhost:8545). Optional
 *
 * @return {Contract} The request contract
 */
function getContract (contractAddress, abi, signerData, providerUrl) {
  if (contractsCache.has(contractAddress)) {
    return contractsCache.get(contractAddress)
  }

  const provider = getProvider(providerUrl)
  const signer = getSigner(provider, signerData)
  const contract = new ethers.Contract(contractAddress, abi, signer)

  contractsCache.set(contractAddress, contract)

  return contract
}

export {
  getContract,
  contractsCache as _contractsCache
}
