import ethers from 'ethers'

import { getProvider } from './providers.js'

const contractsCache = new Map()

/**
 * Caches smart contract instances
 * @param {string} contractAddress - The smart contract address
 * @param {array} abi - The smart contract ABI
 * @param {string} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @return {Contract} The request contract
 */
function getContract (contractAddress, abi, providerUrl) {
  if (contractsCache.has(contractAddress)) {
    return contractsCache.get(contractAddress)
  }

  const provider = getProvider(providerUrl)
  const signer = provider.getSigner()
  const contract = new ethers.Contract(contractAddress, abi, signer)

  contractsCache.set(contractAddress, contract)

  return contract
}

export {
  getContract,
  contractsCache as _contractsCache
}
