import { Scalar } from 'ffjavascript'


import { postPoolTransaction, getAccounts } from './api.js'
import { fix2Float } from './float16.js'
import { addPoolTransaction } from './tx-pool.js'
import { contractAddresses, GAS_LIMIT, GAS_MULTIPLIER } from './constants.js'
import { approve } from './tokens.js'
import { getEthereumAddress, getAccountIndex } from './addresses.js'
import { getContract } from './contracts.js'
import { getProvider } from './providers.js'
import HermezABI from './abis/HermezABI.js'
import WithdrawalDelayerABI from './abis/WithdrawalDelayerABI.js'

export const TxType = {
  Deposit: 'Deposit',
  Transfer: 'Transfer',
  Withdraw: 'Withdrawn',
  Exit: 'Exit'
}

export const TxState = {
  Forged: 'fged',
  Forging: 'fing',
  Pending: 'pend',
  Invalid: 'invl'
}

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
 *
 * @param {BigInt} amount - The amount to be deposited
 * @param {String} hezEthereumAddress - The Hermez address of the transaction sender
 * @param {Object} token - The token information object as returned from the API
 * @param {String} babyJubJub - The compressed BabyJubJub in hexadecimal format of the transaction sender.
 * @param {Number} gasLimit - Optional gas limit
 * @param {Bumber} gasMultiplier - Optional gas multiplier
 *
 * @returns {Promise} transaction
 */
const deposit = async (amount, hezEthereumAddress, token, babyJubJub, gasLimit = GAS_LIMIT, gasMultiplier = GAS_MULTIPLIER) => {
  const hermezContract = getContract(contractAddresses.Hermez, HermezABI)

  const ethereumAddress = getEthereumAddress(hezEthereumAddress)
  let account = (await getAccounts(ethereumAddress, [token.id])).accounts[0]
  // TODO Remove once the hermez-node is ready
  account = undefined

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

  await approve(amount, ethereumAddress, token.ethereumAddress)
  return hermezContract.addL1Transaction(...transactionParameters, overrides)
    .then(() => {
      return transactionParameters
    })
}

/**
 * Makes a force Exit. This is the L1 transaction equivalent of Exit.
 *
 * @param {BigInt} amount - The amount to be withdrawn
 * @param {String} accountIndex - The account index in hez address format e.g. hez:DAI:4444
 * @param {Object} token - The token information object as returned from the API
 * @param {Number} gasLimit - Optional gas limit
 * @param {Bumber} gasMultiplier - Optional gas multiplier
 */
const forceExit = async (amount, accountIndex, token, gasLimit = GAS_LIMIT, gasMultiplier = GAS_MULTIPLIER) => {
  const hermezContract = getContract(contractAddresses.Hermez, HermezABI)

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

  if (token.id === 0) {
    return hermezContract.addL1Transaction(...transactionParameters, overrides)
      .then(() => {
        return transactionParameters
      })
  }

  return hermezContract.addL1Transaction(...transactionParameters, overrides)
    .then(() => {
      return transactionParameters
    })
}

/**
 * Finalise the withdraw. This a L1 transaction.
 *
 * @param {BigInt} amount - The amount to be withdrawn
 * @param {String} accountIndex - The account index in hez address format e.g. hez:DAI:4444
 * @param {Object} token - The token information object as returned from the API
 * @param {String} babyJubJub - The compressed BabyJubJub in hexadecimal format of the transaction sender.
 * @param {BigInt} merkleRoot - The merkle root of the exit being withdrawn.
 * @param {Array} merkleSiblings - An array of BigInts representing the siblings of the exit being withdrawn.
 * @param {Boolean} isInstant - Whether it should be an Instant Withdrawal
 * @param {Number} gasLimit - Optional gas limit
 * @param {Bumber} gasMultiplier - Optional gas multiplier
 */
const withdraw = async (amount, accountIndex, token, babyJubJub, merkleRoot, merkleSiblings, isInstant = true, gasLimit = GAS_LIMIT, gasMultiplier = GAS_MULTIPLIER) => {
  const hermezContract = getContract(contractAddresses.Hermez, HermezABI)

  const overrides = {
    gasLimit,
    gasPrice: await getGasPrice(gasMultiplier)
  }

  const transactionParameters = [
    token.id,
    amount,
    `0x${babyJubJub}`,
    merkleRoot,
    merkleSiblings,
    getAccountIndex(accountIndex),
    isInstant
  ]

  return hermezContract.withdrawMerkleProof(...transactionParameters, overrides)
    .then(() => {
      return transactionParameters
    })
}

/**
 * Makes the final withdrawal from the WithdrawalDelayer smart contract after enough time has passed.
 *
 * @param {String} hezEthereumAddress - The Hermez address of the transaction sender
 * @param {Object} token - The token information object as returned from the API
 * @param {Number} gasLimit - Optional gas limit
 * @param {Bumber} gasMultiplier - Optional gas multiplier
 */
const delayWithdraw = async (hezEthereumAddress, token, gasLimit = GAS_LIMIT, gasMultiplier = GAS_MULTIPLIER) => {
  const delayedWithdrawalContract = getContract(contractAddresses.WithdrawalDelayer, WithdrawalDelayerABI)

  const ethereumAddress = getEthereumAddress(hezEthereumAddress)

  const overrides = {
    gasLimit,
    gasPrice: await getGasPrice(gasMultiplier)
  }

  const transactionParameters = [
    ethereumAddress,
    token.id === 0 ? 0x0 : token.ethereumAddress
  ]

  return delayedWithdrawalContract.withdrawal(...transactionParameters, overrides)
    .then(() => {
      return transactionParameters
    })
}

/**
 * Sends a L2 transaction to the Coordinator
 *
 * @param {Object} transaction - Transaction object prepared by TxUtils.generateL2Transaction
 * @param {String} bJJ - The compressed BabyJubJub in hexadecimal format of the transaction sender.
 *
 * @return {Object} - Object with the response status, transaction id and the transaction nonce
*/
async function send (transaction, bJJ) {
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

/**
 * Gets the beautified name of a transaction state
 *
 * @param {String} transactionState - The original transaction state from the API
 *
 * @return {String} - The beautified transaction state
*/
function beautifyTransactionState (transactionState) {
  return Object.keys(TxState).find(key => TxState[key] === transactionState)
}

export {
  deposit,
  forceExit,
  withdraw,
  delayWithdraw,
  send,
  beautifyTransactionState
}
