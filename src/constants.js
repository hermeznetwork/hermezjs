const TRANSACTION_POOL_KEY = 'transactionPool'

const METAMASK_MESSAGE = 'HERMEZ_ACCOUNT. Don\'t share this signature with anyone as this would reveal your Hermez private key. Unless you are in a trusted application, DO NOT SIGN THIS'

const CREATE_ACCOUNT_AUTH_MESSAGE = 'I authorize this babyjubjub key for hermez rollup account creation'

const ETHER_TOKEN_ID = 0

const GAS_LIMIT = 5000000

const GAS_MULTIPLIER = 1

const ContractNames = {
  Hermez: 'Hermez',
  WithdrawalDelayer: 'WithdrawalDelayer'
}

const contractAddresses = {
  Hermez: '0x10465b16615ae36F350268eb951d7B0187141D3B',
  WithdrawalDelayer: '0x8EEaea23686c319133a7cC110b840d1591d9AeE0'
}

/**
 * Tells hermezjs to use alternative contract addresses
 * Useful for testing with non-standardised addresses
 * @private
 */
function setContractAddress (name, address) {
  contractAddresses[ContractNames[name]] = address
}

const DEFAULT_PAGE_SIZE = 20

const BASE_API_URL = 'http://localhost:8086'

export {
  TRANSACTION_POOL_KEY,
  METAMASK_MESSAGE,
  CREATE_ACCOUNT_AUTH_MESSAGE,
  ETHER_TOKEN_ID,
  GAS_LIMIT,
  GAS_MULTIPLIER,
  DEFAULT_PAGE_SIZE,
  ContractNames,
  contractAddresses,
  BASE_API_URL,
  setContractAddress as _setContractAddress
}
