import { splitSignature, Interface } from 'ethers/lib/utils'
import { constants as ethersConstants } from 'ethers'

import ERC20ABI from './abis/ERC20ABI.js'
import { ContractNames, CONTRACT_ADDRESSES, APPROVE_AMOUNT } from './constants.js'
import { getContract } from './contracts.js'
import { SignerType, getSigner } from './signers.js'
import { getProvider } from './providers.js'

/**
 * Sends an approve transaction to an ERC 20 contract for a certain amount of tokens
 * @param {BigInt} amount - Amount of tokens to be approved by the ERC 20 contract
 * @param {String} accountAddress - The Ethereum address of the transaction sender
 * @param {String} contractAddress - The token smart contract address
 * @param {Object} signerData - Signer data used to build a Signer to send the transaction
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @returns {Promise} transaction
 */
async function approve (amount, accountAddress, contractAddress, signerData, providerUrl) {
  const txSignerData = signerData || { type: SignerType.JSON_RPC, addressOrIndex: accountAddress }
  const erc20Contract = getContract(contractAddress, ERC20ABI, txSignerData, providerUrl)
  const allowance = await erc20Contract.allowance(accountAddress, CONTRACT_ADDRESSES[ContractNames.Hermez])

  if (allowance.lt(amount)) {
    return erc20Contract.approve(CONTRACT_ADDRESSES[ContractNames.Hermez], APPROVE_AMOUNT)
  } else {
    return Promise.resolve()
  }
}

/**
 * Checks where a token contract supports `permit`
 * @param {ethers.Contract} tokenContractInstance - A Contract instance of an ERC 20 token
 * @returns {Boolean} Whether the ERC 20 contract supports `permit`
 */
async function isPermitSupported (tokenContractInstance) {
  try {
    return !!(await tokenContractInstance.PERMIT_TYPEHASH())
  } catch (e) {
    return false
  }
}

/**
 * Generates a permit signature following EIP 712
 * @param {ethers.Contract} tokenContractInstance - A Contract instance of an ERC 20 token
 * @param {String} accountAddress - The Ethereum address of the account making the transfer
 * @param {String} contractAddress - The Ethereum address of the contract being authorized
 * @param {ethers.BigNumber} value - The amount being approved
 * @param {ethers.BigNumber} nonce - The contract's nonce
 * @param {ethers.BigNumber} deadline -
 * @param {Object} signerData - Signer data used to build a Signer to send the transaction
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @returns {Object} A signature object with r, s, v
 */
async function createPermitSignature (
  tokenContractInstance,
  accountAddress,
  contractAddress,
  value,
  nonce,
  deadline,
  signerData,
  providerUrl
) {
  const chainId = (await tokenContractInstance.getChainId())
  const name = await tokenContractInstance.name()

  // The domain
  const domain = {
    name: name,
    version: '1',
    chainId: chainId,
    verifyingContract: tokenContractInstance.address
  }

  // The named list of all type definitions
  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
  }

  // The data to sign
  const values = {
    owner: accountAddress,
    spender: contractAddress,
    value: value,
    nonce: nonce,
    deadline: deadline
  }

  const provider = getProvider(providerUrl)
  const signer = getSigner(provider, signerData)
  const rawSignature = await signer._signTypedData(domain, types, values)
  return splitSignature(rawSignature)
}

/**
 * Generates a permit data string to be passed to a smart contract function call
 * @param {ethers.Contract} fromTokenContract - A Contract instance of an ERC 20 token
 * @param {String} accountAddress - The Ethereum address of the transaction sender
 * @param {String} contractAddress - The contract we are authorizing to handle our tokens
 * @param {ethers.BigNumber} amount - The amount we want to authorize
 * @param {Object} signerData - Signer data used to build a Signer to send the transaction
 * @param {String} providerUrl - Network url (i.e, http://localhost:8545). Optional
 * @returns {String} A hex string with the permit data
 */
async function permit (fromTokenContract, accountAddress, contractAddress, amount, signerData, providerUrl) {
  const nonce = await fromTokenContract.nonces(accountAddress)
  const deadline = ethersConstants.MaxUint256
  const { v, r, s } = await createPermitSignature(
    fromTokenContract,
    accountAddress,
    contractAddress,
    amount,
    nonce,
    deadline,
    signerData,
    providerUrl
  )

  const permitABI = [
    'function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)'
  ]
  const permitInterface = new Interface(permitABI)
  const dataPermit = permitInterface.encodeFunctionData('permit', [
    accountAddress,
    contractAddress,
    amount,
    deadline,
    v,
    r,
    s
  ])

  return dataPermit
}

export {
  approve,
  isPermitSupported,
  permit
}
