// import scAddressFile from '../auxdata/sc-address.json'

const TRANSACTION_POOL_KEY = 'transactionPool'

const METAMASK_MESSAGE = 'HERMEZ_ACCOUNT. Don\'t share this signature with anyone as this would reveal your Hermez private key. Unless you are in a trusted application, DO NOT SIGN THIS'

const ETHER_TOKEN_ID = 0

const GAS_LIMIT = 5000000

const GAS_MULTIPLIER = 1

const hermezAddress = '0xc4905364b78a742ccce7B890A89514061E47068D'
const contractAddresses = {
  Hermez: hermezAddress
}

const DEFAULT_PAGE_SIZE = 20

export {
  TRANSACTION_POOL_KEY,
  METAMASK_MESSAGE,
  ETHER_TOKEN_ID,
  GAS_LIMIT,
  GAS_MULTIPLIER,
  DEFAULT_PAGE_SIZE,
  contractAddresses
}
