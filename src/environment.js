import * as constants from './constants'
import * as coordinatorApi from './api'

let batchExplorerUrl = constants.BATCH_EXPLORER_URL
let etherscanUrl = constants.ETHERSCAN_URL

const SUPPORTED_ENVIRONMENTS = {
  Mainnet: {
    name: 'Mainnet',
    chainId: 1
  },
  Rinkeby: {
    name: 'Rinkeby',
    chainId: 4
  },
  Local: {
    name: 'Localhost',
    chainId: 1337
  }
}

const BATCH_EXPLORER_URLS = {
  [SUPPORTED_ENVIRONMENTS.Mainnet.chainId]: 'https://explorer.hermez.io',
  [SUPPORTED_ENVIRONMENTS.Rinkeby.chainId]: 'https://explorer.testnet.hermez.io',
  [SUPPORTED_ENVIRONMENTS.Local.chainId]: 'http://localhost:8080'
}

const ETHERSCAN_URLS = {
  [SUPPORTED_ENVIRONMENTS.Mainnet.chainId]: 'https://etherscan.io',
  [SUPPORTED_ENVIRONMENTS.Rinkeby.chainId]: 'https://rinkeby.etherscan.io',
  [SUPPORTED_ENVIRONMENTS.Local.chainId]: 'https://etherscan.io'
}

const PUBLIC_BASE_API_URLS = {
  [SUPPORTED_ENVIRONMENTS.Mainnet.chainId]: 'https://api.hermez.io',
  [SUPPORTED_ENVIRONMENTS.Rinkeby.chainId]: 'https://api.testnet.hermez.io',
  [SUPPORTED_ENVIRONMENTS.Local.chainId]: 'http://localhost:8086'
}

const PUBLIC_CONTRACT_ADDRESSES = {
  [SUPPORTED_ENVIRONMENTS.Mainnet.chainId]: {
    [constants.ContractNames.Hermez]: '0xA68D85dF56E733A06443306A095646317B5Fa633',
    [constants.ContractNames.WithdrawalDelayer]: '0x392361427Ef5e17b69cFDd1294F31ab555c86124'
  },
  [SUPPORTED_ENVIRONMENTS.Rinkeby.chainId]: {
    [constants.ContractNames.Hermez]: '0x679b11E0229959C1D3D27C9d20529E4C5DF7997c',
    [constants.ContractNames.WithdrawalDelayer]: '0xeFD96CFBaF1B0Dd24d3882B0D6b8D95F85634724'
  },
  [SUPPORTED_ENVIRONMENTS.Local.chainId]: {
    [constants.ContractNames.Hermez]: '0x10465b16615ae36F350268eb951d7B0187141D3B',
    [constants.ContractNames.WithdrawalDelayer]: '0x8EEaea23686c319133a7cC110b840d1591d9AeE0'
  }
}

/**
 * Gets the current supported environments
 * @returns {Object[]} Supported environments
 */
function getSupportedEnvironments () {
  return Object.values(SUPPORTED_ENVIRONMENTS)
}

/**
 * Checks if a chain id has a supported environment
 * @param {Number} env Chain id
 */
function isEnvironmentSupported (env) {
  if (Object.values(SUPPORTED_ENVIRONMENTS).find((supportedEnv) => supportedEnv.chainId === env) !== undefined) {
    return true
  } else {
    return false
  }
}

function setContractAddress (contractName, address) {
  constants.CONTRACT_ADDRESSES[contractName] = address
}

function setBaseApiUrl (baseApiUrl) {
  coordinatorApi.setBaseApiUrl(baseApiUrl)
}

function setBatchExplorerUrl (url) {
  batchExplorerUrl = url
}

function getBatchExplorerUrl () {
  return batchExplorerUrl
}

function setEtherscanUrl (url) {
  etherscanUrl = url
}

function getEtherscanUrl () {
  return etherscanUrl
}

/**
 * Sets an environment from a chain id or from a custom environment object
 * @param {Object|Number} env - Chain id or a custom environment object
 */
function setEnvironment (env) {
  if (!env) {
    throw new Error('A environment is required')
  }

  if (typeof env === 'number') {
    if (!isEnvironmentSupported(env)) {
      throw new Error('Environment not supported')
    }

    setContractAddress(constants.ContractNames.Hermez, PUBLIC_CONTRACT_ADDRESSES[env][constants.ContractNames.Hermez])
    setContractAddress(constants.ContractNames.WithdrawalDelayer, PUBLIC_CONTRACT_ADDRESSES[env][constants.ContractNames.WithdrawalDelayer])
    setBaseApiUrl(PUBLIC_BASE_API_URLS[env])
    setBatchExplorerUrl(BATCH_EXPLORER_URLS[env])
    setEtherscanUrl(ETHERSCAN_URLS[env])
  }

  if (typeof env === 'object') {
    if (env.contractAddresses) {
      if (env.contractAddresses.Hermez && typeof env.contractAddresses[constants.ContractNames.Hermez] === 'string') {
        setContractAddress(constants.ContractNames.Hermez, env.contractAddresses[constants.ContractNames.Hermez])
      }
      if (env.contractAddresses.WithdrawalDelayer && typeof env.contractAddresses[constants.ContractNames.WithdrawalDelayer] === 'string') {
        setContractAddress(constants.ContractNames.WithdrawalDelayer, env.contractAddresses[constants.ContractNames.WithdrawalDelayer])
      }
    }
    if (env.baseApiUrl && typeof env.baseApiUrl === 'string') {
      setBaseApiUrl(env.baseApiUrl)
    }
    if (env.batchExplorerUrl && typeof env.batchExplorerUrl === 'string') {
      setBatchExplorerUrl(env.batchExplorerUrl)
    }
    if (env.etherscanUrl && typeof env.etherscanUrl === 'string') {
      setEtherscanUrl(env.etherscanUrl)
    }
  }
}

/**
 * Returns the current environment
 * @returns {Object} Contains contract addresses, Hermez API and Batch Explorer urls
 * and the Etherscan URL por the provider
 */
function getCurrentEnvironment () {
  return {
    contracts: constants.CONTRACT_ADDRESSES,
    baseApiUrl: coordinatorApi.getBaseApiUrl(),
    batchExplorerUrl,
    etherscanUrl
  }
}

export {
  setEnvironment,
  getCurrentEnvironment,
  getSupportedEnvironments,
  isEnvironmentSupported,
  getBatchExplorerUrl,
  getEtherscanUrl
}
