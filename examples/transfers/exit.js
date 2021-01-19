const hermez = require('@hermeznetwork/hermezjs')
const yargs = require('yargs').usage('')

// local arguments
const argv = yargs.argv
const ethNodeURL = argv.url === undefined ? 'http://localhost:8545' : argv.url

async function main () {
  // load ethereum network provider
  hermez.Providers.setProvider(ethNodeURL)

  // load token to deposit information
  const tokenToDeposit = 0
  const token = await hermez.CoordinatorAPI.getTokens()
  const tokenERC20 = token.tokens[tokenToDeposit]

  // load first account
  const mnemonicIndex1 = 1
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(ethNodeURL, { type: 'JSON-RPC', addressOrIndex: mnemonicIndex1 })
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
