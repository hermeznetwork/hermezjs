const hermez = require('../dist/node/index.js')
const {
  EXAMPLES_WEB3_URL,
  EXAMPLES_PRIVATE_KEY1,
  configureEnvironment
} = require('./constants.js')

async function main () {
  const privKey1 = EXAMPLES_PRIVATE_KEY1

  // Configure Environment (SC address, WEB3 providers,...)
  configureEnvironment()

  // load token to deposit information
  const tokenToDeposit = 0
  const token = await hermez.CoordinatorAPI.getTokens()
  const tokenERC20 = token.tokens[tokenToDeposit]

  // load first account
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privKey1 })
  const hermezWallet = wallet.hermezWallet
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // get sender account information
  const infoAccountSender = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
    .accounts[0]

  // create new bjj private key to receive user transactions
  const pvtBjjKey = Buffer.allocUnsafe(32).fill('1')

  // create rollup internal account from bjj private key
  const wallet2 = await hermez.HermezWallet.createWalletFromBjjPvtKey(pvtBjjKey)
  const hermezWallet2 = wallet2.hermezWallet

  // share public bjj key with the user
  console.log(`Transfer funds to this hermez address:\n   ${hermezWallet2.publicKeyBase64}\n\n`)

  const state = await hermez.CoordinatorAPI.getState()
  const usdTokenExchangeRate = tokenERC20.USD
  const fee = usdTokenExchangeRate ? state.recommendedFee.createAccountInternal / usdTokenExchangeRate : 0
  console.log(state.recommendedFee)

  // user creates transaction to deposit some ether into internal account
  const userDepositToInternal = hermez.Utils.getTokenAmountBigInt('0.0001', 18)
  const compressedUserDepositToInternal = hermez.HermezCompressedAmount.compressAmount(userDepositToInternal)
  // the following transaction would:
  // - create an account for the exchange in hermez network
  const transferToInternal = {
    from: infoAccountSender.accountIndex,
    to: hermezWallet2.publicKeyBase64,
    amount: compressedUserDepositToInternal,
    fee: fee
  }
  console.log('transferToInternal: ', transferToInternal, fee)
  // send tx to hermez network
  await hermez.Tx.generateAndSendL2Tx(transferToInternal, hermezWallet, tokenERC20)
}

main()
