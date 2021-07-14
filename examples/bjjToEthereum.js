import * as hermez from 'hermez'

hermez.Environment.setEnvironment(4)

// Example of BJJ address used to retrieve associated Ethereum Address
const address = 'hez:yngK9rTGFkFX33N84-Hgop7JUj9bLLStwmVgN5v9UICE'
const tokenId = 0
// Source Hermez address
const hermezEthereumAddress = 'hez:0xaBB84DD767AA0F58949458927bff6aFa550f2466'
// set amount to transfer
const compressedUserDepositToInternal = hermez.HermezCompressedAmount.compressAmount(hermez.Utils.getTokenAmountBigInt('0.001', 18));
(async () => {
  const token = await hermez.CoordinatorAPI.getTokens()
  const tokenERC20 = token.tokens[tokenId]
  // Retrieve source account to do the transfers
  const infoAccountSender = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenId]))
    .accounts[0]
  // Compute fees
  const state = await hermez.CoordinatorAPI.getState()
  const usdTokenExchangeRate = tokenERC20.USD
  const fee = usdTokenExchangeRate ? state.recommendedFee.createAccount / usdTokenExchangeRate : 0

  // Get all token accounts associated to this address
  const response = await hermez.CoordinatorAPI.getAccounts(address)

  console.log(response)
  // In case it's a Bjj address, find an Ethereum Address
  const hermezEthereumAccount = hermez.Addresses.isHermezEthereumAddress(address)
    ? address
    : response.accounts
      .find((account) => account.hezEthereumAddress.toLowerCase() !== hermez.Constants.INTERNAL_ACCOUNT_ETH_ADDR.toLowerCase())
      .hezEthereumAddress

  console.log(hermezEthereumAccount)
  if (!hermezEthereumAccount && hermez.Addresses.isHermezBjjAddress(address)) {
    // Only internal transactions are valid, they can be done here
    const transferData = {
      from: infoAccountSender.accountIndex,
      to: address,
      amount: compressedUserDepositToInternal,
      fee: fee
    }
    hermez.Tx.generateAndSendL2Tx(transferData)
  } else {
    // Check whether user already has
    const accountChecks = [
      hermez.CoordinatorAPI.getAccounts(hermezEthereumAccount, [tokenId]),
      hermez.CoordinatorAPI.getCreateAccountAuthorization(hermezEthereumAccount).catch(() => {})
    ]

    Promise.all(accountChecks)
      .then((result) => {
        const receiverAccount = result[0]?.accounts[0]
        if (!receiverAccount && !result[1]) {
          throw new Error('Hermez user has neither an existing token account nor signed the Create Account Authorization')
        } else {
          const transferData = {
            from: infoAccountSender.accountIndex,
            to: hermezEthereumAccount,
            amount: compressedUserDepositToInternal,
            fee: fee
          }
          hermez.Tx.generateAndSendL2Tx(transferData)
        }
      })
  }
})()
