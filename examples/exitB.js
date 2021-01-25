const hermez = require('../dist/node/index.js')
const {
  EXAMPLES_WEB3_URL,
  configureEnvironment
} = require('./constants.js')
require('dotenv').config()

async function main () {
  const privKey1 = process.env.PRIVATE_KEY2

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

  // set amount to transfer
  const amountExit = hermez.Utils.getTokenAmountBigInt('0.0001', 18)
  // set fee in transaction
  const userFee = 0

  // generate L2 transaction
  const l2ExitTx = {
    type: 'Exit',
    from: infoAccountSender.accountIndex,
    amount: amountExit,
    userFee
  }

  const exitResponse = await hermez.Tx.generateAndSendL2Tx(l2ExitTx, hermezWallet, infoAccountSender.token)
  console.log('exitResponse: ', exitResponse)
}

main()
