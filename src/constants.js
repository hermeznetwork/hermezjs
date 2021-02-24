const TRANSACTION_POOL_KEY = 'transactionPool'

const METAMASK_MESSAGE = 'Hermez Network account access.\n\nSign this message if you are in a trusted application only.'

const CREATE_ACCOUNT_AUTH_MESSAGE = 'I authorize this babyjubjub key for hermez rollup account creation'

const ETHER_TOKEN_ID = 0

const GAS_LIMIT = 5000000

const GAS_MULTIPLIER = 1

const DEFAULT_PAGE_SIZE = 20

const BASE_API_URL = 'http://localhost:8086'

const BATCH_EXPLORER_URL = 'http://localhost:8080'

const ETHERSCAN_URL = 'https://etherscan.io'

const ContractNames = {
  Hermez: 'Hermez',
  WithdrawalDelayer: 'WithdrawalDelayer'
}

const CONTRACT_ADDRESSES = {
  [ContractNames.Hermez]: '0x10465b16615ae36F350268eb951d7B0187141D3B',
  [ContractNames.WithdrawalDelayer]: '0x8EEaea23686c319133a7cC110b840d1591d9AeE0'
}

export {
  TRANSACTION_POOL_KEY,
  METAMASK_MESSAGE,
  CREATE_ACCOUNT_AUTH_MESSAGE,
  ETHER_TOKEN_ID,
  GAS_LIMIT,
  GAS_MULTIPLIER,
  DEFAULT_PAGE_SIZE,
  BASE_API_URL,
  BATCH_EXPLORER_URL,
  ETHERSCAN_URL,
  ContractNames,
  CONTRACT_ADDRESSES
}
