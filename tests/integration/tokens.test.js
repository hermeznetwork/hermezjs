import { ethers } from 'ethers'

import * as tokens from '../../src/tokens.js'
import * as utils from '../../src/utils.js'
import * as providers from '../../src/providers.js'
import { ContractNames, CONTRACT_ADDRESSES } from '../../src/constants.js'
import ERC20ABI from '../../src/abis/ERC20ABI.js'
import { SignerType } from '../../src/signers.js'

// Requires `integration-testing` environment running

test('Check Allowance', async () => {
  const ERC20Address = '0xaded47e7b9275b17189f0b17bf6a4ce909047084'

  // Initialize providers
  const provider = providers.getProvider('http://localhost:8545')

  // Initialize signer
  const signer = await provider.getSigner()
  const accountAddress = await signer.getAddress()

  // Get erc20 contract
  const erc20Contract = new ethers.Contract(ERC20Address, ERC20ABI, signer)

  // Approve and check allowance
  const oldAllowance = BigInt(await erc20Contract.allowance(accountAddress, CONTRACT_ADDRESSES[ContractNames.Hermez]))

  const amountToApprove = oldAllowance + utils.getTokenAmountBigInt('2', 18)

  const txRes = await tokens.approve(amountToApprove, accountAddress, ERC20Address, { type: SignerType.JSON_RPC }, 'http://localhost:8545')
  await txRes.wait()

  const newAllowance = BigInt(await erc20Contract.allowance(accountAddress, CONTRACT_ADDRESSES[ContractNames.Hermez]))
  expect(newAllowance === amountToApprove).toBe(true)
})
