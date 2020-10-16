const ethers                             = require('ethers')
const { MAX_DECIMALS_UNTIL_ZERO_AMOUNT } = require('./constants')

const CurrencySymbol = {
  USD: {
    symbol: '$',
    code: 'USD'
  },
  EUR: {
    symbol: '€',
    code: 'EUR'
  }
}

/**
 * Gets the string representation of a token amount with fixed decimals
 * @param {string} amount - Amount to be be converted in a bigint format
 * @param {number} decimals - Decimals that the amount should have in its string representation
 * @returns {string}
 */
function getFixedTokenAmount (amount, decimals) {
  // We can lose precision as there will never be more than MAX_DECIMALS_UNTIL_ZERO_AMOUNT significant digits
  const balanceWithDecimals = Number(amount) / Math.pow(10, decimals)
  const amountSignificantDigits = amount.length - 1
  const significantDigits = decimals - amountSignificantDigits

  if (significantDigits > MAX_DECIMALS_UNTIL_ZERO_AMOUNT) {
    return '0'
  }

  const significantDigitsFinal = significantDigits > 2 ? significantDigits : 2
  return balanceWithDecimals.toFixed(significantDigitsFinal)
}

/**
 * Converts an amount in BigInt and decimals to a String with correct decimal point placement
 *
 * @param {String} amountBigInt - String representing the amount as a BigInt with no decimals
 * @param {Number} decimals - Number of decimal points the amount actually has
 *
 * @returns {String}
 */
function getTokenAmountString (amountBigInt, decimals) {
  return ethers.utils.formatUnits(amountBigInt, decimals)
}

/**
 * Converts an amount in Float with the appropriate decimals to a BigInt
 *
 * @param {Number} amountString - String representing the amount as a Float
 * @param {Number} decimals - Number of decimal points the amount has
 *
 * @returns {BigInt}
 */
function getTokenAmountBigInt (amountString, decimals) {
  return ethers.utils.parseUnits(amountString, decimals)
}

/**
 * Converts a token amount to a new amount but in the user preferred currency
 *
 * @param {String} amount - The amount to be be converted
 * @param {String} usdTokenExchangeRate - Current USD exchange rate for the token
 * @param {String} preferredCurrency - User preferred currency
 * @param {String} fiatExchangeRates - Exchange rates for all the supported currencies in the app
 *
 * @returns {Number}
 */
function getTokenAmountInPreferredCurrency (
  amount,
  usdTokenExchangeRate,
  preferredCurrency,
  fiatExchangeRates
) {
  const usdAmount = Number(amount) * usdTokenExchangeRate

  if (!fiatExchangeRates) {
    return undefined
  }

  if (preferredCurrency === CurrencySymbol.USD.code) {
    return usdAmount
  }

  return usdAmount * fiatExchangeRates[preferredCurrency]
}

module.exports = {
  CurrencySymbol,
  getFixedTokenAmount,
  getTokenAmountString,
  getTokenAmountBigInt,
  getTokenAmountInPreferredCurrency
}
