import { ethers } from 'ethers'

import { getProvider } from './providers.js'

const contractsCache = new Map()

/**
 * Caches smart contract instances
 * @param {string} contractAddress - The smart contract address
 * @param {array} abi - The smart contract ABI
 * @param {string} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @param {string} ethereumAddress - Optional
 * @return {ethers.Contract} The request contract
 */
function getContract (contractAddress, abi, providerUrl, ethereumAddress) {
  if (contractsCache.has(contractAddress + ethereumAddress)) {
    return contractsCache.get(contractAddress + ethereumAddress)
  }

  const provider = getProvider(providerUrl)
  const signer = provider.getSigner(ethereumAddress)
  const contract = new ethers.Contract(contractAddress, abi, signer)

  contractsCache.set(contractAddress + ethereumAddress, contract)

  return contract
}

export {
  getContract,
  contractsCache as _contractsCache
}
