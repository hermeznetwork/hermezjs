const hermez = require('../dist/node/index.js')

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
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // get account information
  const infoAccount = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
    .accounts[0]

  // set amount to force-exit
  const amountExit = hermez.Utils.getTokenAmountBigInt('8', 18)

  // perform force-exit
  await hermez.Tx.forceExit(amountExit, infoAccount.accountIndex, tokenERC20)
}

main()
