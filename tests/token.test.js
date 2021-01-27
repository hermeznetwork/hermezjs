import { ethers } from 'ethers'

import * as tokens from '../src/tokens.js'
import * as utils from '../src/utils.js'
import * as providers from '../src/providers.js'
import { ContractNames, CONTRACT_ADDRESSES } from '../src/constants.js'
import ERC20ABI from '../src/abis/ERC20ABI.js'

// Ignoring due to a race condition with tx.test.mjs
// This sets a small allowance while deposit needs a higher one,
// but both tests are ran in parallel and clash
test('Check Allowance', async () => {
  /*
   * 1 - Deploy contracts
   * 2 - Approve Hermez contract amount1 of ERC tokens
   * 3 - Check allowance
   */
  const txAddress = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
  const ERC20Address = '0x24650cad431915051e2987455b76e0cdcaa1d4d8'

  // Initialize providers
  const provider = providers.getProvider('http://localhost:8545')

  // Get erc20 contract
  const signer = provider.getSigner(txAddress)
  const erc20Contract = new ethers.Contract(ERC20Address, ERC20ABI, signer)

  // Set allowance to Hermez contract
  for (var i = 0; i < 10; i++) {
    const amountStr = Math.floor(Math.random() * 10000).toString()
    const amount = utils.getTokenAmountBigInt(amountStr, 2)
    await tokens.approve(amount, txAddress, ERC20Address, 'http://localhost:8545')
    const allowance = await erc20Contract.allowance(txAddress, CONTRACT_ADDRESSES[ContractNames.Hermez])

    expect(allowance.toString()).toBe(amount.toString())
  }
})
