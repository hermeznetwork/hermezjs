const  ethers   = require('ethers')

const ERC20ABI              = require('./abis/ERC20ABI.json')
const ERC1820ABI            = require('./abis/ERC1820ABI.json')
const { contractAddresses } = require('./constants')
const { getContract }       = require('./contracts')

const tokenTypes = {
  ERC20: 0,
  ERC777: 1
}

/**
 * Detects if a smart contract is an ERC 20 or ERC 777 contract
 *
 * @param {String} contractAddress - The token smart contract address
 *
 * @returns {Number} tokenType - Value from tokenTypes
 */
async function detectTokenType (contractAddress) {
  const tokenContract = getContract(contractAddresses.ERC1820, ERC1820ABI)
  const contractType = await tokenContract.getInterfaceImplementer(contractAddress, ethers.utils.id('ERC777Token'))
  if (contractType === '0x0000000000000000000000000000000000000000') {
    return tokenTypes.ERC20
  } else {
    return tokenTypes.ERC777
  }
}

/**
 * Sends an approve transaction to an ERC 20 contract for a certain amount of tokens
 *
 * @param {BigInt} amount - Amount of tokens to be approved by the ERC 20 contract
 * @param {String} accountAddress - The Ethereum address of the transaction sender
 * @param {String} contractAddress - The token smart contract address
 *
 * @returns {Promise} transaction
 */
async function approve (amount, accountAddress, contractAddress) {
  const erc20Contract = getContract(contractAddress, ERC20ABI)
  const allowance = await erc20Contract.allowance(accountAddress, contractAddresses.Hermez)

  if (allowance.lt(amount)) {
    return erc20Contract.approve(contractAddresses.Hermez, amount)
  }

  if (!allowance.isZero(amount)) {
    const tx = await erc20Contract.approve(contractAddresses.Hermez, '0')
    await tx.wait(1)
  }

  return erc20Contract.approve(contractAddresses.Hermez, amount)
}

module.exports =  {
  tokenTypes,
  detectTokenType,
  approve
}
