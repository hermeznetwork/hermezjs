import { ethers } from 'ethers'

let provider

/**
 * Set a Provider URL
 * @param {String} url - Network url (i.e, http://localhost:8545)
 */
function setProvider (url) {
  if (url || typeof window === 'undefined') {
    provider = ethers.getDefaultProvider(url)
  } else {
    provider = new ethers.providers.Web3Provider(window.ethereum)
  }
}

/**
 * Retrieve provider
 * @param {String} url - Network url (i.e, http://localhost:8545)
 * @returns {Object} provider
 */
function getProvider (url) {
  if (!provider) {
    setProvider(url)
  }

  return provider
}

export {
  setProvider,
  getProvider
}
