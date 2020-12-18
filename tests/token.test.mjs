import { ethers } from 'ethers'

import * as tokens from '../src/tokens.js'
import * as utils from '../src/utils.js'
import * as providers from '../src/providers.js'
import { contractAddresses } from '../src/constants.js'
import ERC20ABI from '../src/abis/ERC20ABI.js'

// Ignoring due to a race condition with tx.test.mjs
// This sets a small allowance while deposit needs a higher one,
// but both tests are ran in parallel and clash
test.skip('Check Allowance', async () => {
  /*
   * 1 - Deploy contracts
   * 2 - Approve Hermez contract amount1 of ERC tokens
   * 3 - Check allowance
   */
  const txAddress = '0xc783df8a850f42e7f7e57013759c285caa701eb6'
  const ERC20Address = '0x8196263D97DE9A1198Da2A1830b5A49cBe6eb3FE'

  // Initialize providers
  const provider = providers.getProvider('http://localhost:8545')

  // Get erc20 contract
  const signer = provider.getSigner(txAddress)
  const erc20Contract = new ethers.Contract(ERC20Address, ERC20ABI, signer)

  // Set allowance to Hermez contract
  for (var i = 0; i < 10; i++) {
    const amountStr = Math.floor(Math.random() * 10000).toString()
    const amount = utils.getTokenAmountBigInt(amountStr, 2)
    await tokens.approve(amount, txAddress, ERC20Address)
    const allowance = await erc20Contract.allowance(txAddress, contractAddresses.Hermez)

    expect(allowance.toString()).toBe(amount.toString())
  }
})
