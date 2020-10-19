const { BabyJubWallet,
        newWalletFromEtherAccount }             = require('./babyjub-wallet')

const { hexToBuffer }               = require('./utils.js')

const { deposit,
        send }                      = require('./tx.js')

const { generateL2Transaction }     = require('./tx-utils')

const { getAccounts, 
        getAccount, 
        getTransactions,
        getHistoryTransaction,
        getPoolTransaction,
        getExit,
        getExits,
        getTokens,
        getToken,
        getFees }                   = require('./api')

const { initializeTransactionPool } = require("./tx-pool.js")

const { TRANSACTION_POOL_KEY,
        SETTINGS,
        MY_ADDRESS,
        SNACKBAR_AUTO_HIDE_DURATION,
        METAMASK_MESSAGE,
        ETHER_TOKEN_ID,
        MAX_DECIMALS_UNTIL_ZERO_AMOUNT,
        contractAddresses }  = require('./constants')

const { fix2Float,
        float2Fix, 
	floorFix2Float }            = require('./float16')

const { getHermezAddress,
        getEthereumAddress,
        getAccountIndex, 
        getPartiallyHiddenHermezAddress }          = require('./addresses')

const { CurrencySymbol,
        getFixedTokenAmount,
        getTokenAmountString,
        getTokenAmountBigInt,
        getTokenAmountInPreferredCurrency }      = require('./currencies.js')

const { getDefaultProvider,
        setDefaultProvider }                     = require('./providers')

module.exports = {
  // currency
  CurrencySymbol,
  getFixedTokenAmount,
  getTokenAmountString,
  getTokenAmountBigInt,
  getTokenAmountInPreferredCurrency, 

  // float16
  fix2Float,
  float2Fix,
  floorFix2Float,

  // addresses
  getHermezAddress,
  getEthereumAddress,
  getAccountIndex,
  getPartiallyHiddenHermezAddress,

  // providers
  getDefaultProvider,
  setDefaultProvider,

  // contants
  TRANSACTION_POOL_KEY,
  SETTINGS,
  MY_ADDRESS,
  SNACKBAR_AUTO_HIDE_DURATION,
  METAMASK_MESSAGE,
  ETHER_TOKEN_ID,
  MAX_DECIMALS_UNTIL_ZERO_AMOUNT,
  contractAddresses,
  
  // tx-pool
  initializeTransactionPool,

  // babyJub-wallet
  BabyJubWallet,
  newWalletFromEtherAccount,

  // utils
  hexToBuffer,

  // tx
  deposit,
  send,

  // tx-utils
  generateL2Transaction,

  // api
  getAccounts, 
  getAccount, 
  getTransactions,
  getHistoryTransaction,
  getPoolTransaction,
  getExit,
  getExits,
  getTokens,
  getToken,
  getFees
}
