const TRANSACTION_POOL_KEY = 'transactionPool'

const METAMASK_MESSAGE = 'Hermez Network account access.\n\nSign this message if you are in a trusted application only.'

const CREATE_ACCOUNT_AUTH_MESSAGE = 'Account creation'
const EIP_712_VERSION = '1'
const EIP_712_PROVIDER = 'Hermez Network'

const ETHER_TOKEN_ID = 0

const GAS_LIMIT_HIGH = 170000
const GAS_LIMIT_LOW = 150000
const GAS_STANDARD_ERC20_TX = 30000
const GAS_LIMIT_WITHDRAW = 230000
const SIBLING_GAS_COST = 31000

// @deprecated
const GAS_LIMIT = GAS_LIMIT_HIGH

const GAS_MULTIPLIER = 1

const DEFAULT_PAGE_SIZE = 20

const API_VERSION = 'v1'

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

const EMPTY_BJJ_ADDR = 'hez:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

const STORAGE_VERSION_KEY = 'hermezStorageVersion'

const STORAGE_VERSION = 1

const APPROVE_AMOUNT = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

const MAX_NLEVELS = 48

const WITHDRAWAL_CIRCUIT_NLEVELS = 32

const WITHDRAWAL_WASM_URL = 'https://github.com/hermeznetwork/hermezjs/blob/main/withdraw-circuit-files/withdraw.wasm'

const WITHDRAWAL_ZKEY_URL = 'https://github.com/hermeznetwork/hermezjs/blob/main/withdraw-circuit-files/withdraw_hez4_final.zkey'

export {
  TRANSACTION_POOL_KEY,
  METAMASK_MESSAGE,
  CREATE_ACCOUNT_AUTH_MESSAGE,
  EIP_712_VERSION,
  EIP_712_PROVIDER,
  ETHER_TOKEN_ID,
  GAS_LIMIT,
  GAS_LIMIT_HIGH,
  GAS_LIMIT_LOW,
  GAS_STANDARD_ERC20_TX,
  GAS_LIMIT_WITHDRAW,
  SIBLING_GAS_COST,
  GAS_MULTIPLIER,
  DEFAULT_PAGE_SIZE,
  API_VERSION,
  BASE_API_URL,
  BATCH_EXPLORER_URL,
  ETHERSCAN_URL,
  ContractNames,
  CONTRACT_ADDRESSES,
  STORAGE_VERSION_KEY,
  STORAGE_VERSION,
  APPROVE_AMOUNT,
  INTERNAL_ACCOUNT_ETH_ADDR,
  EMPTY_BJJ_ADDR,
  MAX_NLEVELS,
  WITHDRAWAL_CIRCUIT_NLEVELS,
  WITHDRAWAL_WASM_URL,
  WITHDRAWAL_ZKEY_URL
}
