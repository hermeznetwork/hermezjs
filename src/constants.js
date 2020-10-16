const { CurrencySymbol } = require ('./currencies')

const TRANSACTION_POOL_KEY = 'transactionPool'

const SETTINGS = {
  PREFERRED_CURRENCY_KEY: 'preferredCurrency',
  DEFAULT_PREFERRED_CURRENCY: CurrencySymbol.USD.code
}

const SNACKBAR_AUTO_HIDE_DURATION = 5000

const METAMASK_MESSAGE = 'HERMEZ_ACCOUNT. Don\'t share this signature with anyone as this would reveal your Hermez private key. Unless you are in a trusted application, DO NOT SIGN THIS'

const ETHER_TOKEN_ID = 0

const MAX_DECIMALS_UNTIL_ZERO_AMOUNT = 6

const scAddressFile = require("../auxdata/sc-address.json")

const hermezAddress = scAddressFile.hermez
const contractAddresses = {
  Hermez: hermezAddress,
  ERC1820: '0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24'
}

module.exports = {
  TRANSACTION_POOL_KEY,
  SETTINGS,
  SNACKBAR_AUTO_HIDE_DURATION,
  METAMASK_MESSAGE,
  ETHER_TOKEN_ID,
  MAX_DECIMALS_UNTIL_ZERO_AMOUNT,
  contractAddresses
}
