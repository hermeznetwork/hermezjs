const TRANSACTION_POOL_KEY = 'transactionPool'

const METAMASK_MESSAGE = 'Hermez Network account access.\n\nSign this message if you are in a trusted application only.'

const CREATE_ACCOUNT_AUTH_MESSAGE = 'Account creation'
const EIP_712_VERSION = '1'
const EIP_712_PROVIDER = 'Hermez Network'

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

const INTERNAL_ACCOUNT_ETH_ADDR = 'hez:0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF'

const STORAGE_VERSION_KEY = 'hermezStorageVersion'

const STORAGE_VERSION = 1

const MAX_NLEVELS = 48

const WITHDRAWAL_CIRCUIT_NLEVELS = 32

const WITHDRAWAL_WASM_URL = 'https://github.com/hermeznetwork/hermezjs/blob/feature/withdrawal-circuit/withdraw-circuit-files/withdraw.wasm'

const WITHDRAWAL_ZKEY_URL = 'https://github.com/hermeznetwork/hermezjs/blob/feature/withdrawal-circuit/withdraw-circuit-files/withdraw_hez3_0001.zkey'

export {
  TRANSACTION_POOL_KEY,
  METAMASK_MESSAGE,
  CREATE_ACCOUNT_AUTH_MESSAGE,
  EIP_712_VERSION,
  EIP_712_PROVIDER,
  ETHER_TOKEN_ID,
  GAS_LIMIT,
  GAS_MULTIPLIER,
  DEFAULT_PAGE_SIZE,
  BASE_API_URL,
  BATCH_EXPLORER_URL,
  ETHERSCAN_URL,
  ContractNames,
  CONTRACT_ADDRESSES,
  STORAGE_VERSION_KEY,
  STORAGE_VERSION,
  INTERNAL_ACCOUNT_ETH_ADDR,
  MAX_NLEVELS,
  WITHDRAWAL_CIRCUIT_NLEVELS,
  WITHDRAWAL_WASM_URL,
  WITHDRAWAL_ZKEY_URL
}
