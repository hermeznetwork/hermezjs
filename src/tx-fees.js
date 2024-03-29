import ERC20ABI from './abis/ERC20ABI'
import {
  ContractNames,
  CONTRACT_ADDRESSES,
  ETHER_TOKEN_ID,
  GAS_LIMIT_HIGH,
  GAS_LIMIT_LOW,
  GAS_LIMIT_WITHDRAW,
  GAS_STANDARD_ERC20_TX,
  SIBLING_GAS_COST,
  GAS_COST_VERIFY_CIRCUIT,
  GAS_BASE_WITHDRAW,
  NON_INSTANT_WITHDRAW_ERC20_GAS_COST,
  NON_INSTANT_WITHDRAW_ETH_GAS_COST,
  GAS_PERMIT
} from './constants'
import { getProvider } from './providers'
import { getSigner } from './signers'
import { getContract } from './contracts'

/**
 * Estimates the gas limit for a deposit
 * @param {Object} token - The token information object as returned from the API
 * @param {Scalar} decompressedAmount - Deposit amount in encoded in fix
 * @param {Object} overrides - Transaction overrides
 * @param {Boolean} usePermit - Flag to indicate if the token supports the EIP-2612
 * @param {Object} signerData - Signer data used to send the transaction.
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @returns {Number} estimated gas for the deposit
 */
async function estimateDepositGasLimit (token, decompressedAmount, overrides, usePermit, signerData, providerUrl) {
  if (token.id === 0) {
    return GAS_LIMIT_LOW
  } else {
    try {
      const tokenContract = getContract(token.ethereumAddress, ERC20ABI, signerData, providerUrl)
      const estimatedTransferGasBigNumber = await tokenContract.estimateGas.transfer(CONTRACT_ADDRESSES[ContractNames.Hermez], decompressedAmount, overrides)
      const estimatedTransferGas = Number(estimatedTransferGasBigNumber.toString())

      return usePermit
        ? estimatedTransferGas + GAS_LIMIT_HIGH + GAS_PERMIT
        : estimatedTransferGas + GAS_LIMIT_HIGH
    } catch (err) {
      return GAS_LIMIT_HIGH + GAS_STANDARD_ERC20_TX + GAS_PERMIT
    }
  }
}

/**
 * Estimates the gas limit for a withdraw
 * @param {Object} token - The token information object as returned from the API
 * @param {Array} merkleSiblingsLength - Length of the siblings of the exit being withdrawn.
 * @param {BigInt} amount - The amount to be withdrawn
 * @param {Object} overrides - Transaction overrides
 * @param {Object} signerData - Signer data used to send the transaction.
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @param {Boolean} isInstant - Whether it should be an Instant Withdrawal
 * @returns {Number} estimated gas for the withdraw
 */
async function estimateWithdrawGasLimit (token, merkleSiblingsLength, amount, overrides, signerData, providerUrl, isInstant = true) {
  // TODO Breaking Release: Restructure params order to move isInstant forward
  const nonInstantGas = token.id === ETHER_TOKEN_ID ? NON_INSTANT_WITHDRAW_ETH_GAS_COST : NON_INSTANT_WITHDRAW_ERC20_GAS_COST
  const finalNonInstantGas = isInstant ? 0 : nonInstantGas
  try {
    const tokenContract = getContract(token.ethereumAddress, ERC20ABI, signerData, providerUrl)
    const provider = getProvider(providerUrl)
    const signer = getSigner(provider, signerData)
    const address = await signer.getAddress()
    const estimatedTransferGasBigNumber = await tokenContract.connect(CONTRACT_ADDRESSES[ContractNames.Hermez]).estimateGas.transfer(address, amount, overrides)

    // 230k + Transfer cost + (31k * siblings.length) + non-instant cost offset
    return GAS_LIMIT_WITHDRAW + Number(estimatedTransferGasBigNumber.toString()) + (SIBLING_GAS_COST * merkleSiblingsLength) + finalNonInstantGas
  } catch (err) {
    return GAS_LIMIT_WITHDRAW + GAS_STANDARD_ERC20_TX + (SIBLING_GAS_COST * merkleSiblingsLength) + finalNonInstantGas
  }
}

/**
 * Estimates the gas limit for a withdrawCircuit
 * @param {Object} token - The token information object as returned from the API
 * @param {BigInt} amount - The amount to be withdrawn
 * @param {Object} overrides - Transaction overrides
 * @param {Boolean} isInstant - Whether it should be an Instant Withdrawal
 * @param {Object} signerData - Signer data used to send the transaction. Optional
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @returns {Number} estimated gas for the withdrawCircuit
 */
async function estimateWithdrawCircuitGasLimit (token, amount, overrides, isInstant, signerData, providerUrl) {
  const nonInstantGas = token.id === ETHER_TOKEN_ID ? NON_INSTANT_WITHDRAW_ETH_GAS_COST : NON_INSTANT_WITHDRAW_ERC20_GAS_COST
  const finalNonInstantGas = isInstant ? 0 : nonInstantGas
  try {
    const tokenContract = getContract(token.ethereumAddress, ERC20ABI, signerData, providerUrl)
    const provider = getProvider(providerUrl)
    const signer = getSigner(provider, signerData)
    const address = await signer.getAddress()
    const estimatedTransferGasBigNumber = await tokenContract.connect(CONTRACT_ADDRESSES[ContractNames.Hermez]).estimateGas.transfer(address, amount, overrides)

    // Base cost (70k) + (Verify circuit cost 208k) + Transfer cost + non-instant cost offset
    return GAS_BASE_WITHDRAW + GAS_COST_VERIFY_CIRCUIT + Number(estimatedTransferGasBigNumber.toString()) + finalNonInstantGas
  } catch (err) {
    return GAS_BASE_WITHDRAW + GAS_COST_VERIFY_CIRCUIT + GAS_STANDARD_ERC20_TX + finalNonInstantGas
  }
}

export {
  estimateDepositGasLimit,
  estimateWithdrawGasLimit,
  estimateWithdrawCircuitGasLimit
}
