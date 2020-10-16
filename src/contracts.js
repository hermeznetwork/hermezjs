const ethers = require('ethers')

const { getProvider } = require('./providers')

const contractsCache = new Map()

/**
 * Caches smart contract instances
 *
 * @param {String} contractAddress - The smart contract address
 * @param {Array} abi - The smart contract ABI
 */
function getContract (contractAddress, abi) {
  if (contractsCache.has(contractAddress)) {
    return contractsCache.get(contractAddress)
  }

  const provider = getProvider()
  const signer = provider.getSigner()
  const contract = new ethers.Contract(contractAddress, abi, signer)

  contractsCache.set(contractAddress, contract)

  return contract
}

module.exports = {
  getContract
}
