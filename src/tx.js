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
import { generateL2Transaction } from './tx-utils.js'
import HermezABI from './abis/HermezABI.js'
import WithdrawalDelayerABI from './abis/WithdrawalDelayerABI.js'
import { SignerType } from './signers.js'

/**
 * Get current average gas price from the last ethereum blocks and multiply it
 * @param {Number} multiplier - multiply the average gas price by this parameter
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @returns {Promise} - promise will return the gas price obtained.
 */
async function getGasPrice (multiplier, providerUrl) {
  const provider = getProvider(providerUrl)
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
 * @param {String} hezEthereumAddress - The Hermez address of the transaction sender
 * @param {Object} token - The token information object as returned from the API
 * @param {String} babyJubJub - The compressed BabyJubJub in hexadecimal format of the transaction sender.
 * @param {Object} signerData - Signer data used to build a Signer to send the transaction
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @param {Number} gasLimit - Optional gas limit
 * @param {Number} gasMultiplier - Optional gas multiplier
 * @returns {Promise} transaction parameters
 */
const deposit = async (
  amount,
  hezEthereumAddress,
  token,
  babyJubJub,
  signerData,
  providerUrl,
  gasLimit = GAS_LIMIT,
  gasMultiplier = GAS_MULTIPLIER
) => {
  const ethereumAddress = getEthereumAddress(hezEthereumAddress)
  const txSignerData = signerData || { type: SignerType.JSON_RPC, addressOrIndex: ethereumAddress }
  const hermezContract = getContract(contractAddresses.Hermez, HermezABI, txSignerData, providerUrl)

  const accounts = await getAccounts(hezEthereumAddress, [token.id])
    .catch(() => undefined)
  const account = typeof accounts !== 'undefined' ? accounts.accounts[0] : null

  const overrides = {
    gasLimit,
    gasPrice: await getGasPrice(gasMultiplier, providerUrl)
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

  await approve(amount, ethereumAddress, token.ethereumAddress, signerData, providerUrl)

  return hermezContract.addL1Transaction(...transactionParameters, overrides)
    .then(() => transactionParameters)
}

/**
 * Makes a force Exit. This is the L1 transaction equivalent of Exit.
 * @param {BigInt} amount - The amount to be withdrawn
 * @param {String} accountIndex - The account index in hez address format e.g. hez:DAI:4444
 * @param {Object} token - The token information object as returned from the API
 * @param {Object} signerData - Signer data used to build a Signer to send the transaction
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @param {Number} gasLimit - Optional gas limit
 * @param {Number} gasMultiplier - Optional gas multiplier
 * @returns {Promise} transaction parameters
 * @throws {Error} Throws an error if account index isn't valid
 */
const forceExit = async (
  amount,
  accountIndex,
  token,
  signerData,
  providerUrl,
  gasLimit = GAS_LIMIT,
  gasMultiplier = GAS_MULTIPLIER
) => {
  const account = await getAccount(accountIndex)
    .catch(() => {
      throw new Error('Invalid account index')
    })
  const ethereumAddress = getEthereumAddress(account.hezEthereumAddress)
  const txSignerData = signerData || { type: SignerType.JSON_RPC, addressOrIndex: ethereumAddress }
  const hermezContract = getContract(contractAddresses.Hermez, HermezABI, txSignerData, providerUrl)

  const overrides = {
    gasLimit,
    gasPrice: await getGasPrice(gasMultiplier, providerUrl)
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
 * Finalise the withdraw. This is a L1 transaction.
 * @param {BigInt} amount - The amount to be withdrawn
 * @param {String} accountIndex - The account index in hez address format e.g. hez:DAI:4444
 * @param {Object} token - The token information object as returned from the API
 * @param {String} babyJubJub - The compressed BabyJubJub in hexadecimal format of the transaction sender.
 * @param {BigInt} batchNumber - The batch number where the exit being withdrawn was forged
 * @param {Array} merkleSiblings - An array of BigInts representing the siblings of the exit being withdrawn.
 * @param {Boolean} isInstant - Whether it should be an Instant Withdrawal
 * @param {Object} signerData - Signer data used to build a Signer to send the transaction
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @param {Boolean} filterSiblings - Whether siblings should be filtered
 * @param {Number} gasLimit - Optional gas limit
 * @param {Number} gasMultiplier - Optional gas multiplier
 * @returns {Promise} transaction parameters
 * @throws {Error} Throws an error if account index isn't valid
 */
const withdraw = async (
  amount,
  accountIndex,
  token,
  babyJubJub,
  batchNumber,
  merkleSiblings,
  isInstant = true,
  signerData,
  providerUrl,
  gasLimit = GAS_LIMIT,
  gasMultiplier = GAS_MULTIPLIER
) => {
  const account = await getAccount(accountIndex)
    .catch(() => {
      throw new Error('Invalid account index')
    })
  const ethereumAddress = getEthereumAddress(account.hezEthereumAddress)
  const txSignerData = signerData || { type: SignerType.JSON_RPC, addressOrIndex: ethereumAddress }
  const hermezContract = getContract(contractAddresses.Hermez, HermezABI, txSignerData, providerUrl)

  const overrides = {
    gasLimit,
    gasPrice: await getGasPrice(gasMultiplier, providerUrl)
  }
  const transactionParameters = [
    token.id,
    amount,
    `0x${babyJubJub}`,
    batchNumber,
    merkleSiblings,
    getAccountIndex(accountIndex),
    isInstant
  ]

  return hermezContract.withdrawMerkleProof(...transactionParameters, overrides)
    .then(() => transactionParameters)
}

/**
 * Makes the final withdrawal from the WithdrawalDelayer smart contract after enough time has passed.
 *
 * @param {String} hezEthereumAddress - The Hermez address of the transaction sender
 * @param {Object} token - The token information object as returned from the API
 * @param {Object} signerData - Signer data used to build a Signer to send the transaction
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @param {Number} gasLimit - Optional gas limit
 * @param {Number} gasMultiplier - Optional gas multiplier
 * @returns {Promise} transaction parameters
 */
const delayedWithdraw = async (
  hezEthereumAddress,
  token,
  signerData,
  providerUrl,
  gasLimit = GAS_LIMIT,
  gasMultiplier = GAS_MULTIPLIER
) => {
  const ethereumAddress = getEthereumAddress(hezEthereumAddress)
  const txSignerData = signerData || { type: SignerType.JSON_RPC, addressOrIndex: ethereumAddress }
  const delayedWithdrawalContract = getContract(contractAddresses.WithdrawalDelayer, WithdrawalDelayerABI, txSignerData, providerUrl)

  const overrides = {
    gasLimit,
    gasPrice: await getGasPrice(gasMultiplier, providerUrl)
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
 * @param {Object} transaction - Transaction object prepared by TxUtils.generateL2Transaction
 * @param {String} bJJ - The compressed BabyJubJub in hexadecimal format of the transaction sender.
 * @return {Object} - Object with the response status, transaction id and the transaction nonce
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

/**
 * Compact L2 transaction generated and sent to a Coordinator.
 * @param {Object} transaction - ethAddress and babyPubKey together
 * @param {String} transaction.from - The account index that's sending the transaction e.g hez:DAI:4444
 * @param {String} transaction.to - The account index of the receiver e.g hez:DAI:2156. If it's an Exit, set to a falseable value
 * @param {BigInt} transaction.amount - The amount being sent as a BigInt
 * @param {Number} transaction.fee - The amount of tokens to be sent as a fee to the Coordinator
 * @param {Number} transaction.nonce - The current nonce of the sender's token account
 * @param {Object} wallet - Transaction sender Hermez Wallet
 * @param {Object} token - The token information object as returned from the Coordinator.
*/
async function generateAndSendL2Tx (tx, wallet, token) {
  const l2TxParams = await generateL2Transaction(tx, wallet.publicKeyCompressedHex, token)

  wallet.signTransaction(l2TxParams.transaction, l2TxParams.encodedTransaction)

  const l2TxResult = await sendL2Transaction(l2TxParams.transaction, wallet.publicKeyCompressedHex)

  return l2TxResult
}

export {
  deposit,
  forceExit,
  withdraw,
  delayedWithdraw,
  sendL2Transaction,
  generateAndSendL2Tx
}
