import * as constants from './constants'
import * as coordinatorApi from './api'
import { ContractNames } from './constants'

let batchExplorerUrl = constants.BATCH_EXPLORER_URL

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
  [SUPPORTED_ENVIRONMENTS.Rinkeby.chainId]: 'http://hermez-public-998653595.eu-west-1.elb.amazonaws.com:8080',
  [SUPPORTED_ENVIRONMENTS.Local.chainId]: 'http://localhost:8080'
}

const PUBLIC_BASE_API_URLS = {
  [SUPPORTED_ENVIRONMENTS.Rinkeby.chainId]: 'http://hermez-public-998653595.eu-west-1.elb.amazonaws.com',
  [SUPPORTED_ENVIRONMENTS.Local.chainId]: 'http://localhost:8086'
}

const PUBLIC_CONTRACT_ADDRESSES = {
  [SUPPORTED_ENVIRONMENTS.Rinkeby.chainId]: {
    [ContractNames.Hermez]: '0x98d51Ce36C2769176f443D1b967d42A7Bea5BCf9',
    [ContractNames.WithdrawalDelayer]: '0x429C6837a135229C2c221810ACdF3B074971030A'
  },
  [SUPPORTED_ENVIRONMENTS.Local.chainId]: {
    [ContractNames.Hermez]: '0x10465b16615ae36F350268eb951d7B0187141D3B',
    [ContractNames.WithdrawalDelayer]: '0x8EEaea23686c319133a7cC110b840d1591d9AeE0'
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

function setEnvironment (env) {
  if (!env) {
    throw new Error('A environment is required')
  }

  if (typeof env === 'number') {
    if (!isEnvironmentSupported(env)) {
      throw new Error('Environment not supported')
    }

    setContractAddress(ContractNames.Hermez, PUBLIC_CONTRACT_ADDRESSES[env][ContractNames.Hermez])
    setContractAddress(ContractNames.WithdrawalDelayer, PUBLIC_CONTRACT_ADDRESSES[env][ContractNames.WithdrawalDelayer])
    setBaseApiUrl(PUBLIC_BASE_API_URLS[env])
    setBatchExplorerUrl(BATCH_EXPLORER_URLS[env])
  }

  if (typeof env === 'object') {
    if (
      env.contractAddresses &&
      env.contractAddresses.Hermez &&
      typeof env.contractAddresses[ContractNames.Hermez] === 'string'
    ) {
      setContractAddress(ContractNames.Hermez, env.contractAddresses[ContractNames.Hermez])
    }
    if (
      env.contractAddresses &&
      env.contractAddresses.WithdrawalDelayer &&
      typeof env.contractAddresses[ContractNames.WithdrawalDelayer] === 'string'
    ) {
      setContractAddress(ContractNames.WithdrawalDelayer, env.contractAddresses[ContractNames.WithdrawalDelayer])
    }
    if (env.baseApiUrl && typeof env.baseApiUrl === 'string') {
      setBaseApiUrl(env.baseApiUrl)
    }
    if (env.batchExplorerUrl && typeof env.batchExplorerUrl === 'string') {
      setBatchExplorerUrl(env.batchExplorerUrl)
    }
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

function getBatchExplorerUrl () {
  return batchExplorerUrl
}

export {
  setEnvironment,
  getSupportedEnvironments,
  isEnvironmentSupported,
  getBatchExplorerUrl
}
