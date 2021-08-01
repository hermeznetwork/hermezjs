import { Scalar } from 'ffjavascript'
import { groth16 } from 'snarkjs'

import {
  postPoolTransaction,
  postAtomicGroup,
  getAccounts,
  getAccount
} from './api.js'
import { HermezCompressedAmount } from './hermez-compressed-amount.js'
import { addPoolTransaction } from './tx-pool.js'
import { ContractNames, CONTRACT_ADDRESSES, GAS_LIMIT_LOW, GAS_MULTIPLIER, WITHDRAWAL_WASM_URL, WITHDRAWAL_ZKEY_URL, ETHER_ADDRESS } from './constants.js'
import { approve } from './tokens.js'
import { getEthereumAddress, getAccountIndex } from './addresses.js'
import { getContract } from './contracts.js'
import { getProvider } from './providers.js'
import { generateL2Transaction } from './tx-utils.js'
import HermezABI from './abis/HermezABI.js'
import WithdrawalDelayerABI from './abis/WithdrawalDelayerABI.js'
import { SignerType } from './signers.js'
import { buildZkInputWithdraw, buildProofContract } from './withdraw-utils.js'
import { estimateDepositGasLimit, estimateWithdrawGasLimit } from './tx-fees.js'
import { generateAtomicGroup } from './atomic-utils.js'

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
 * @param {HermezCompressedAmount} amount - The amount to be deposited in the compressed format
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
  gasLimit,
  gasMultiplier = GAS_MULTIPLIER
) => {
  if (!HermezCompressedAmount.isHermezCompressedAmount(amount)) {
    throw new Error('The parameter needs to be an instance of HermezCompressedAmount created with HermezCompressedAmount.compressAmount')
  }

  const ethereumAddress = getEthereumAddress(hezEthereumAddress)
  const txSignerData = signerData || { type: SignerType.JSON_RPC, addressOrIndex: ethereumAddress }
  const hermezContract = getContract(CONTRACT_ADDRESSES[ContractNames.Hermez], HermezABI, txSignerData, providerUrl)

  const accounts = await getAccounts(hezEthereumAddress, [token.id])
    .catch(() => undefined)
  const account = typeof accounts !== 'undefined' ? accounts.accounts[0] : null

  const overrides = {
    gasPrice: await getGasPrice(gasMultiplier, providerUrl)
  }
  const transactionParameters = [
    account ? 0 : `0x${babyJubJub}`,
    account ? getAccountIndex(account.accountIndex) : 0,
    amount.value,
    0,
    token.id,
    0,
    '0x'
  ]

  const decompressedAmount = HermezCompressedAmount.decompressAmount(amount)

  // Deposits need a gas limit to not have to wait for the approve to occur
  // before calculating it automatically, which would slow down the process
  overrides.gasLimit = typeof gasLimit === 'undefined'
    ? await estimateDepositGasLimit(token, decompressedAmount, overrides, txSignerData, providerUrl)
    : gasLimit

  if (token.id === 0) {
    overrides.value = decompressedAmount

    return hermezContract.addL1Transaction(...transactionParameters, overrides)
  }

  await approve(decompressedAmount, ethereumAddress, token.ethereumAddress, signerData, providerUrl)

  return hermezContract.addL1Transaction(...transactionParameters, overrides)
}

/**
 * Makes a force Exit. This is the L1 transaction equivalent of Exit.
 * @param {HermezCompressedAmount} amount - The amount to be withdrawn in the compressed format
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
  gasLimit,
  gasMultiplier = GAS_MULTIPLIER
) => {
  if (!HermezCompressedAmount.isHermezCompressedAmount(amount)) {
    throw new Error('The parameter needs to be an instance of HermezCompressedAmount created with HermezCompressedAmount.compressAmount')
  }

  const account = await getAccount(accountIndex)
    .catch(() => {
      throw new Error('Invalid account index')
    })
  const ethereumAddress = getEthereumAddress(account.hezEthereumAddress)
  const txSignerData = signerData || { type: SignerType.JSON_RPC, addressOrIndex: ethereumAddress }
  const hermezContract = getContract(CONTRACT_ADDRESSES[ContractNames.Hermez], HermezABI, txSignerData, providerUrl)

  const overrides = {
    gasLimit: typeof gasLimit !== 'undefined' ? gasLimit : GAS_LIMIT_LOW,
    gasPrice: await getGasPrice(gasMultiplier, providerUrl)
  }

  const transactionParameters = [
    0,
    getAccountIndex(accountIndex),
    0,
    amount.value,
    token.id,
    1,
    '0x'
  ]

  return hermezContract.addL1Transaction(...transactionParameters, overrides)
}

/**
 * Finalise the withdraw with merkle proof. This is a L1 transaction.
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
  gasLimit,
  gasMultiplier = GAS_MULTIPLIER
) => {
  const account = await getAccount(accountIndex)
    .catch(() => {
      throw new Error('Invalid account index')
    })
  const ethereumAddress = getEthereumAddress(account.hezEthereumAddress)
  const txSignerData = signerData || { type: SignerType.JSON_RPC, addressOrIndex: ethereumAddress }
  const hermezContract = getContract(CONTRACT_ADDRESSES[ContractNames.Hermez], HermezABI, txSignerData, providerUrl)

  const overrides = {
    gasPrice: await getGasPrice(gasMultiplier, providerUrl),
    gasLimit: typeof gasLimit === 'undefined'
      ? await estimateWithdrawGasLimit(token, merkleSiblings.length, amount, {}, txSignerData, providerUrl, isInstant)
      : gasLimit
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
}

/**
 * Finalise the withdraw with zkProof. This is a L1 transaction.
 * @param {Object} exitInfo - exit object as it is returned by hermez-node API
 * @param {Boolean} isInstant - Whether it should be an Instant Withdrawal
 * @param {String} wasmFilePath - wasm witness file path
 * @param {String} zkeyFilePath - zkey proving key path
 * @param {Object} signerData - Signer data used to build a Signer to send the transaction
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @param {Number} gasLimit - Optional gas limit
 * @param {Number} gasMultiplier - Optional gas multiplier
 * @returns {Promise} transaction parameters
 */
const withdrawCircuit = async (
  exitInfo,
  isInstant = true,
  wasmFilePath,
  zkeyFilePath,
  signerData,
  providerUrl,
  gasLimit,
  gasMultiplier = GAS_MULTIPLIER
) => {
  const hermezContract = getContract(CONTRACT_ADDRESSES[ContractNames.Hermez], HermezABI, signerData, providerUrl)
  const wasmFileInput = typeof window === 'undefined' ? wasmFilePath : wasmFilePath || WITHDRAWAL_WASM_URL
  const zkeyFileInput = typeof window === 'undefined' ? zkeyFilePath : zkeyFilePath || WITHDRAWAL_ZKEY_URL

  const zkInputs = await buildZkInputWithdraw(exitInfo)
  const zkProofSnarkJs = await groth16.fullProve(zkInputs, wasmFileInput, zkeyFileInput)
  const zkProofContract = await buildProofContract(zkProofSnarkJs.proof)

  const overrides = {
    gasPrice: await getGasPrice(gasMultiplier, providerUrl)
  }

  if (typeof gasLimit !== 'undefined') {
    overrides.gasLimit = gasLimit
  }

  const transactionParameters = [
    zkProofContract.proofA,
    zkProofContract.proofB,
    zkProofContract.proofC,
    exitInfo.token.id,
    exitInfo.balance,
    exitInfo.batchNum,
    getAccountIndex(exitInfo.accountIndex),
    isInstant
  ]

  return hermezContract.withdrawCircuit(...transactionParameters, overrides)
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
  gasLimit,
  gasMultiplier = GAS_MULTIPLIER
) => {
  const ethereumAddress = getEthereumAddress(hezEthereumAddress)
  const txSignerData = signerData || { type: SignerType.JSON_RPC, addressOrIndex: ethereumAddress }
  const delayedWithdrawalContract = getContract(CONTRACT_ADDRESSES[ContractNames.WithdrawalDelayer], WithdrawalDelayerABI, txSignerData, providerUrl)

  const overrides = {
    gasPrice: await getGasPrice(gasMultiplier, providerUrl)
  }

  if (typeof gasLimit !== 'undefined') {
    overrides.gasLimit = gasLimit
  }

  const transactionParameters = [
    ethereumAddress,
    token.id === 0 ? ETHER_ADDRESS : token.ethereumAddress
  ]

  return delayedWithdrawalContract.withdrawal(...transactionParameters, overrides)
}

/**
 *
 * @param {BigInt} amount - The amount to be withdrawn
 * @param {String} accountIndex - The account index in hez address format e.g. hez:DAI:4444
 * @param {Object} token - The token information object as returned from the API
 * @param {String} babyJubJub - The compressed BabyJubJub in hexadecimal format of the transaction sender.
 * @param {BigInt} batchNumber - The batch number where the exit being withdrawn was forged
 * @param {Array} merkleSiblings - An array of BigInts representing the siblings of the exit being withdrawn.
 * @param {Boolean} isInstant - Whether it should be an Instant Withdrawal
 * @param {Object} signerData - Signer data used to build a Signer to send the transaction
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @returns {Promise}
 */
async function isInstantWithdrawalAllowed (
  amount,
  accountIndex,
  token,
  babyJubJub,
  batchNumber,
  merkleSiblings,
  signerData,
  providerUrl) {
  const account = await getAccount(accountIndex)
    .catch(() => {
      throw new Error('Invalid account index')
    })
  const ethereumAddress = getEthereumAddress(account.hezEthereumAddress)
  const txSignerData = signerData || { type: SignerType.JSON_RPC, addressOrIndex: ethereumAddress }
  const hermezContract = getContract(CONTRACT_ADDRESSES[ContractNames.Hermez], HermezABI, txSignerData, providerUrl)

  const overrides = {
    from: ethereumAddress
  }
  const transactionParameters = [
    token.id,
    amount,
    `0x${babyJubJub}`,
    batchNumber,
    merkleSiblings,
    getAccountIndex(accountIndex),
    true
  ]

  try {
    return hermezContract.callStatic.withdrawMerkleProof(...transactionParameters, overrides)
  } catch (error) {
    return Promise.reject(error)
  }
}

/**
 * Sends a L2 transaction to the Coordinator
 * @param {Object} transaction - Transaction object prepared by TxUtils.generateL2Transaction
 * @param {String} bJJ - The compressed BabyJubJub in hexadecimal format of the transaction sender.
 * @param {Array} nextForgers - An array of URLs of the next forgers to send the L2 tx to.
 * @param {Boolean} addToTxPool - A boolean which indicates if the tx should be added to the tx pool or not
 * @return {Object} - Object with the response status, transaction id and the transaction nonce
*/
async function sendL2Transaction (transaction, bJJ, nextForgers, addToTxPool) {
  const result = await postPoolTransaction(transaction, nextForgers)
  if (result.status === 200 && addToTxPool) {
    await addPoolTransaction(transaction, bJJ)
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
 * @param {HermezCompressedAmount} transaction.amount - The amount being sent in the compressed format
 * @param {Number} transaction.fee - The amount of tokens to be sent as a fee to the Coordinator
 * @param {Number} transaction.nonce - The current nonce of the sender's token account
 * @param {Number} transaction.maxNumBatch - maximum allowed batch number when the transaction can be processed (optional)
 * @param {Object} wallet - Transaction sender Hermez Wallet
 * @param {Object} token - The token information object as returned from the Coordinator.
 * @param {Array} nextForgers - An array of URLs of the next forgers to send the L2 tx to.
 * @param {Boolean} addToTxPool - A boolean which indicates if the tx should be added to the tx pool or not
*/
async function generateAndSendL2Tx (tx, wallet, token, nextForgers, addToTxPool = true) {
  const l2TxParams = await generateL2Transaction(tx, wallet.publicKeyCompressedHex, token)

  wallet.signTransaction(l2TxParams.transaction, l2TxParams.encodedTransaction)

  return sendL2Transaction(l2TxParams.transaction, wallet.publicKeyCompressedHex, nextForgers, addToTxPool)
}

/**
 * Sends an atomic group to the Coordinator
 * @param {Object} atomicGroup - Transactions object prepared by AtomicUtils.generateAtomicGroup
 * @param {Array} nextForgers - An array of URLs of the next forgers to send the L2 tx to.
 * @return {Object} - Object with the response status and transactions ids
*/
async function sendAtomicGroup (atomicGroup, nextForgers) {
  const result = await postAtomicGroup(atomicGroup, nextForgers)
  return {
    status: result.status,
    id: result.data
  }
}

/**
 * Compact L2 atomic grup transactions generated and sent to a Coordinator.
 * @param {Array[Object]} txs - list of txs. Transaction object prepared by AtomicUtils.buildAtomicTransaction
 * @param {Array} nextForgers - An array of URLs of the next forgers to send the L2 tx to.
 * @param {Array} requestOffsets - request offsets to set on each transaction (optional)
 * @return {Object} - Object with the response status and transactions ids
*/
async function generateAndSendAtomicGroup (txs, nextForgers, requestOffsets) {
  const atomicGroup = await generateAtomicGroup(txs, requestOffsets)
  return sendAtomicGroup(atomicGroup, nextForgers)
}

export {
  deposit,
  forceExit,
  withdraw,
  delayedWithdraw,
  isInstantWithdrawalAllowed,
  sendL2Transaction,
  generateAndSendL2Tx,
  sendAtomicGroup,
  generateAndSendAtomicGroup,
  withdrawCircuit
}
