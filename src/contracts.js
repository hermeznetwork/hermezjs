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
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @return {ethers.Contract} The request contract
 */
function getContract (contractAddress, abi, signerData = {}, providerUrl) {
  const signerId = signerData.addressOrIndex || signerData.path || signerData.privateKey
  if (contractsCache.has(contractAddress + signerId)) {
    return contractsCache.get(contractAddress + signerId)
  }

  const provider = getProvider(providerUrl)
  const signer = getSigner(provider, signerData)
  const contract = new ethers.Contract(contractAddress, abi, signer)

  contractsCache.set(contractAddress + signerId, contract)

  return contract
}

export {
  getContract,
  contractsCache as _contractsCache
}
