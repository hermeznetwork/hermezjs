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
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // get account information
  const infoAccount = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
    .accounts[0]

  // set amount to force-exit
  const amountExit = hermez.HermezCompressedAmount.compressAmount(hermez.Utils.getTokenAmountBigInt('0.0001', 18))

  // perform force-exit
  await hermez.Tx.forceExit(
    amountExit,
    infoAccount.accountIndex,
    tokenERC20,
    { type: 'WALLET', privateKey: privKey1 }
  )
}

main()
