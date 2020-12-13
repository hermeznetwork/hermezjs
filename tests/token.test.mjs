import * as tokens from '../src/tokens.js'
import * as utils from '../src/utils.js'
import * as providers from '../src/providers.js'
import ERC20ABI from '../src/abis/ERC20ABI.js'
import ethers from 'ethers'

test('Check Allowance', async () => {
  /*
   * 1 - Deploy contracts
   * 2 - Approve Hermez contract amount1 of ERC tokens
   * 3 - Check allowance
   */
  const txAddress = '0xc783df8a850f42e7f7e57013759c285caa701eb6'
  const hermezAddress = '0x500D1d6A4c7D8Ae28240b47c8FCde034D827fD5e'
  const erc20Address = '0xf4e77E5Da47AC3125140c470c71cBca77B5c638c'

  // Initialize providers
  providers.setProvider('http://localhost:8545')
  const provider = providers.getProvider()

  // Get erc20 contract
  const signer = provider.getSigner(txAddress)
  const erc20Contract = new ethers.Contract(erc20Address, ERC20ABI, signer)

  // Set allowance to Hermez contract
  for (var i = 0; i < 10; i++) {
    const amountStr = Math.floor(Math.random() * 10000).toString()
    const amount = utils.getTokenAmountBigInt(amountStr, 2)
    await tokens.approve(amount, txAddress, erc20Address)
    const allowance = await erc20Contract.allowance(txAddress, hermezAddress)

    expect(allowance.toString()).toBe(amount.toString())
  }
})
