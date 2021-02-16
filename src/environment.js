import * as constants from './constants'
import * as coordinatorApi from './api'

let batchExplorerUrl = constants.BATCH_EXPLORER_URL
let etherscanUrl = constants.ETHERSCAN_URL

const SUPPORTED_ENVIRONMENTS = {
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
  [SUPPORTED_ENVIRONMENTS.Rinkeby.chainId]: 'http://explorer.testnet.hermez.io',
  [SUPPORTED_ENVIRONMENTS.Local.chainId]: 'http://localhost:8080'
}

const ETHERSCAN_URLS = {
  [SUPPORTED_ENVIRONMENTS.Rinkeby.chainId]: 'https://rinkeby.etherscan.io',
  [SUPPORTED_ENVIRONMENTS.Local.chainId]: 'https://etherscan.io'
}

const PUBLIC_BASE_API_URLS = {
  [SUPPORTED_ENVIRONMENTS.Rinkeby.chainId]: 'http://api.testnet.hermez.io',
  [SUPPORTED_ENVIRONMENTS.Local.chainId]: 'http://localhost:8086'
}

const PUBLIC_CONTRACT_ADDRESSES = {
  [SUPPORTED_ENVIRONMENTS.Rinkeby.chainId]: {
    [constants.ContractNames.Hermez]: '0x5e61B3d99cAa3a5892781F53996d2128B40a3fAD',
    [constants.ContractNames.WithdrawalDelayer]: '0x44D3CBFBeca39F08623Cc6e8574c91c621599548'
  },
  [SUPPORTED_ENVIRONMENTS.Local.chainId]: {
    [constants.ContractNames.Hermez]: '0x10465b16615ae36F350268eb951d7B0187141D3B',
    [constants.ContractNames.WithdrawalDelayer]: '0x8EEaea23686c319133a7cC110b840d1591d9AeE0'
  }
}

function getSupportedEnvironments () {
  return Object.values(SUPPORTED_ENVIRONMENTS)
}

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
