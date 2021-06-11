import { ethers } from 'ethers'

const PROVIDER_TYPES = {
  WEB3: 'web3'
}

let provider

/**
 * Set a Provider URL
 * @param {String|Object} providerData - Network url (i.e, http://localhost:8545) or an Object with the information to set the provider
 * @param {String} providerType - A value from the enum PROVIDER_TYPES
 */
function setProvider (providerData, providerType) {
  if (typeof providerData === 'string' || typeof window === 'undefined') {
    provider = ethers.getDefaultProvider(providerData)
    return
  }

  switch (providerType) {
    case PROVIDER_TYPES.WEB3: {
      provider = new ethers.providers.Web3Provider(providerData)
      break
    }
    default: {
      provider = new ethers.providers.Web3Provider(window.ethereum)
    }
  }
}

/**
 * Retrieve provider
 * @param {String|Object} providerData - Network url (i.e, http://localhost:8545) or an Object with the information to set the provider
 * @param {String} providerType - A value from the enum PROVIDER_TYPES
 * @returns {Object} provider
 */
function getProvider (providerData, providerType) {
  if (!provider) {
    setProvider(providerData, providerType)
  }

  return provider
}

export {
  PROVIDER_TYPES,
  setProvider,
  getProvider
}
