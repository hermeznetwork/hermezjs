import ERC20ABI from './abis/ERC20ABI.js'
import { contractAddresses } from './constants.js'
import { getContract } from './contracts.js'

/**
 * Sends an approve transaction to an ERC 20 contract for a certain amount of tokens
 *
 * @param {BigInt} amount - Amount of tokens to be approved by the ERC 20 contract
 * @param {String} accountAddress - The Ethereum address of the transaction sender
 * @param {String} contractAddress - The token smart contract address
 * @param {string} providerUrl - Network url (i.e, http://localhost:8545). Optional
 *
 * @returns {Promise} transaction
 */
async function approve (amount, accountAddress, contractAddress, providerUrl) {
  const erc20Contract = getContract(contractAddress, ERC20ABI, providerUrl, accountAddress)
  const allowance = await erc20Contract.allowance(accountAddress, contractAddresses.Hermez)
  if (allowance.lt(amount)) {
    return erc20Contract.approve(contractAddresses.Hermez, amount)
  }

  if (!allowance.isZero()) {
    const tx = await erc20Contract.approve(contractAddresses.Hermez, '0')
    await tx.wait(1)
  }

  return erc20Contract.approve(contractAddresses.Hermez, amount)
}

export {
  approve
}
