const hermez = require('../dist/node/index.js')
const {
  EXAMPLES_WEB3_URL,
  EXAMPLES_HERMEZ_API_URL
} = require('./constants.js')

async function main () {
  // load ethereum network provider
  hermez.Providers.setProvider(EXAMPLES_WEB3_URL)
  // set API URL
  hermez.CoordinatorAPI.setBaseApiUrl(EXAMPLES_HERMEZ_API_URL)

  // load token to deposit information
  const tokenToDeposit = 0
  const token = await hermez.CoordinatorAPI.getTokens()
  const tokenERC20 = token.tokens[tokenToDeposit]

  // load first account
  const mnemonicIndex1 = 1
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'JSON-RPC', addressOrIndex: mnemonicIndex1 })
  const hermezWallet = wallet.hermezWallet
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // get sender account information
  const infoAccountSender = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
    .accounts[0]

  // set amount to transfer
  const amountExit = hermez.Utils.getTokenAmountBigInt('12', 18)
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
