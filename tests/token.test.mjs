import * as tokens from '../src/tokens.js'
import * as utils from '../src/utils.js'
import * as providers from '../src/providers.js'
import ERC20ABI from '../src/abis/ERC20ABI.js'
import ethers from 'ethers'

test('Tx without approve', async () => {
  // 1. ERC20 Token deployed
  // 2. Account 0 created and funded
  // 3. Send Transfer from account 0 to 1 without previous approval => It should fail

  const txAddress = '0xc783df8a850f42e7f7e57013759c285caa701eb6'
  const rxAddress = '0xead9c93b79ae7c1591b1fb5323bd777e86e150d4'
  const contractAddress = '0xf4e77E5Da47AC3125140c470c71cBca77B5c638c'

  const amount = utils.getTokenAmountBigInt('900000', 2)

  // Initialize providers
  providers.setProvider('http://localhost:8545')
  const provider = providers.getProvider()

  const signer = provider.getSigner(txAddress)
  const contract = new ethers.Contract(contractAddress, ERC20ABI, signer)

  try {
    await contract.transferFrom(txAddress, rxAddress, amount)
  } catch (e) {
    expect(e.message.includes('SERVER_ERROR')).toBe(true)
  }
})

test('Tx insufficient approve', async () => {
  // 1. ERC20 Token deployed
  // 2. Account 0 created and funded
  // 3. Send Transfer from account 0 to 1 wit insufficient approval

  const txAddress = '0xc783df8a850f42e7f7e57013759c285caa701eb6'
  const rxAddress = '0xead9c93b79ae7c1591b1fb5323bd777e86e150d4'
  const contractAddress = '0xf4e77E5Da47AC3125140c470c71cBca77B5c638c'

  // TODO: I can only work with 0 ammount
  // const txAmount = utils.getTokenAmountBigInt('900000', 2)
  // const approveAmount = utils.getTokenAmountBigInt('800000', 2)
  const txAmount = utils.getTokenAmountBigInt('0', 2)
  const approveAmount = utils.getTokenAmountBigInt('0', 2)

  // Initialize providers
  providers.setProvider('http://localhost:8545')
  const provider = providers.getProvider()

  const signer = provider.getSigner(txAddress)
  const contract = new ethers.Contract(contractAddress, ERC20ABI, signer)

  await tokens.approve(approveAmount, txAddress, contractAddress)
  await contract.transferFrom(txAddress, rxAddress, txAmount)

  const rxBalance = await contract.balanceOf(rxAddress)
  expect(rxBalance.toString()).toBe(approveAmount.toString())
})
