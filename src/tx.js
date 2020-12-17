import { Scalar } from 'ffjavascript'

import {
  postPoolTransaction,
  getAccounts,
  getAccount
} from './api.js'
import { fix2Float } from './float16.js'
import { addPoolTransaction } from './tx-pool.js'
import { contractAddresses, GAS_LIMIT, GAS_MULTIPLIER } from './constants.js'
import { approve } from './tokens.js'
import { getEthereumAddress, getAccountIndex } from './addresses.js'
import { getContract } from './contracts.js'
import { getProvider } from './providers.js'
import HermezABI from './abis/HermezABI.js'
import WithdrawalDelayerABI from './abis/WithdrawalDelayerABI.js'

/**
 * Get current average gas price from the last ethereum blocks and multiply it
 * @param {Number} multiplier - multiply the average gas price by this parameter
 * @returns {Promise} - promise will return the gas price obtained.
*/
async function getGasPrice (multiplier) {
  const provider = getProvider()
  const strAvgGas = await provider.getGasPrice()
  const avgGas = Scalar.e(strAvgGas)
  const res = (avgGas * Scalar.e(multiplier))
  const retValue = res.toString()
  return retValue
}

/**
 * Makes a deposit.
 * It detects if it's a 'createAccountDeposit' or a 'deposit' and prepares the parameters accodingly.
 * Detects if it's an Ether, ERC 20 or ERC 777 token and sends the transaction accordingly.
 * @param {BigInt} amount - The amount to be deposited
 * @param {string} hezEthereumAddress - The Hermez address of the transaction sender
 * @param {object} token - The token information object as returned from the API
 * @param {string} babyJubJub - The compressed BabyJubJub in hexadecimal format of the transaction sender.
 * @param {string} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @param {number} gasLimit - Optional gas limit
 * @param {number} gasMultiplier - Optional gas multiplier
 * @returns {promise} transaction parameters
 */
const deposit = async (amount, hezEthereumAddress, token, babyJubJub, providerUrl, gasLimit = GAS_LIMIT, gasMultiplier = GAS_MULTIPLIER) => {
  const ethereumAddress = getEthereumAddress(hezEthereumAddress)
  const hermezContract = getContract(contractAddresses.Hermez, HermezABI, providerUrl, ethereumAddress)
  let account = await getAccounts(hezEthereumAddress, [token.id])

  if (typeof account !== 'undefined') {
    account = account.accounts[0]
  }

  const overrides = {
    gasLimit,
    gasPrice: await getGasPrice(gasMultiplier)
  }
  const transactionParameters = [
    account ? 0 : `0x${babyJubJub}`,
    account ? getAccountIndex(account.accountIndex) : 0,
    fix2Float(amount),
    0,
    token.id,
    0,
    '0x'
  ]

  if (token.id === 0) {
    overrides.value = amount
    return hermezContract.addL1Transaction(...transactionParameters, overrides)
      .then(() => {
        return transactionParameters
      })
  }

  await approve(amount, ethereumAddress, token.ethereumAddress, providerUrl)
  return hermezContract.addL1Transaction(...transactionParameters, overrides)
    .then(() => transactionParameters)
}

/**
 * Makes a force Exit. This is the L1 transaction equivalent of Exit.
 * @param {BigInt} amount - The amount to be withdrawn
 * @param {string} accountIndex - The account index in hez address format e.g. hez:DAI:4444
 * @param {object} token - The token information object as returned from the API
 * @param {number} gasLimit - Optional gas limit
 * @param {number} gasMultiplier - Optional gas multiplier
 * @returns {promise} transaction parameters
 */
const forceExit = async (amount, accountIndex, token, gasLimit = GAS_LIMIT, gasMultiplier = GAS_MULTIPLIER) => {
  // TODO. Check call below as it can be invalid if accountIndex doesn't exist
  const hermezEthereumAddress = (await getAccount(accountIndex)).hezEthereumAddress
  const ethereumAddress = getEthereumAddress(hermezEthereumAddress)
  const hermezContract = getContract(contractAddresses.Hermez, HermezABI, null, ethereumAddress)

  const overrides = {
    gasLimit,
    gasPrice: await getGasPrice(gasMultiplier)
  }

  const transactionParameters = [
    0,
    getAccountIndex(accountIndex),
    0,
    fix2Float(amount),
    token.id,
    1,
    '0x'
  ]

  return hermezContract.addL1Transaction(...transactionParameters, overrides)
    .then(() => transactionParameters)
}

/**
 * Finalise the withdraw. This a L1 transaction.
 * @param {BigInt} amount - The amount to be withdrawn
 * @param {string} accountIndex - The account index in hez address format e.g. hez:DAI:4444
 * @param {object} token - The token information object as returned from the API
 * @param {string} babyJubJub - The compressed BabyJubJub in hexadecimal format of the transaction sender.
 * @param {BigInt} batchNumber - The batch number where the exit being withdrawn was forged
 * @param {array} merkleSiblings - An array of BigInts representing the siblings of the exit being withdrawn.
 * @param {boolean} isInstant - Whether it should be an Instant Withdrawal
 * @param {boolean} filterSiblings - Whether siblings should be filtered
 * @param {number} gasLimit - Optional gas limit
 * @param {number} gasMultiplier - Optional gas multiplier
 * @returns {promise} transaction parameters
 */
const withdraw = async (amount, accountIndex, token, babyJubJub, batchNumber, merkleSiblings, isInstant = true, filterSibling = false, gasLimit = GAS_LIMIT, gasMultiplier = GAS_MULTIPLIER) => {
  // TODO. Check call below as it can be invalid if accountIndex doesn't exist
  const hermezEthereumAddress = (await getAccount(accountIndex)).hezEthereumAddress
  const ethereumAddress = getEthereumAddress(hermezEthereumAddress)
  const hermezContract = getContract(contractAddresses.Hermez, HermezABI, null, ethereumAddress)

  const overrides = {
    gasLimit,
    gasPrice: await getGasPrice(gasMultiplier)
  }

  // TODO - filter Merkle Siblings
  const filteredSiblings = filterSiblings(merkleSiblings, filterSiblings)

  const transactionParameters = [
    token.id,
    amount,
    `0x${babyJubJub}`,
    batchNumber,
    filteredSiblings,
    getAccountIndex(accountIndex),
    isInstant
  ]

  return hermezContract.withdrawMerkleProof(...transactionParameters, overrides)
    .then(() => transactionParameters)
}

/**
 * Removes 0's from Siblings
 * @param {array} siblings - Array of sibling strings
 * @param {boolean} enable -  Whether siblings should be filtered
 * @returns {array} Array of filtered sibling strings
 */
function filterSiblings (siblings, enable) {
  if (!enable) {
    return siblings
  }

  const filteredSiblings = []
  for (var i = 0; i < siblings.length; i++) {
    if (siblings[i] !== '0') {
      filteredSiblings.push(siblings[i])
    } else {
      break
    }
  }
  return filteredSiblings
}

/**
 * Makes the final withdrawal from the WithdrawalDelayer smart contract after enough time has passed.
 * @param {string} hezEthereumAddress - The Hermez address of the transaction sender
 * @param {object} token - The token information object as returned from the API
 * @param {number} gasLimit - Optional gas limit
 * @param {number} gasMultiplier - Optional gas multiplier
 * @returns {promise} transaction parameters
 */
const delayedWithdraw = async (hezEthereumAddress, token, gasLimit = GAS_LIMIT, gasMultiplier = GAS_MULTIPLIER) => {
  const ethereumAddress = getEthereumAddress(hezEthereumAddress)
  const delayedWithdrawalContract = getContract(contractAddresses.WithdrawalDelayer, WithdrawalDelayerABI, null, ethereumAddress)

  const overrides = {
    gasLimit,
    gasPrice: await getGasPrice(gasMultiplier)
  }

  const transactionParameters = [
    ethereumAddress,
    token.id === 0 ? 0x0 : token.ethereumAddress
  ]

  return delayedWithdrawalContract.withdrawal(...transactionParameters, overrides)
    .then(() => transactionParameters)
}

/**
 * Sends a L2 transaction to the Coordinator
 * @param {object} transaction - Transaction object prepared by TxUtils.generateL2Transaction
 * @param {string} bJJ - The compressed BabyJubJub in hexadecimal format of the transaction sender.
 * @return {object} - Object with the response status, transaction id and the transaction nonce
*/
async function sendL2Transaction (transaction, bJJ) {
  const result = await postPoolTransaction(transaction)

  if (result.status === 200) {
    addPoolTransaction(transaction, bJJ)
  }

  return {
    status: result.status,
    id: result.data,
    nonce: transaction.nonce
  }
}

export {
  deposit,
  forceExit,
  withdraw,
  delayedWithdraw,
  sendL2Transaction
}
