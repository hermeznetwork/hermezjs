const hermez = require('../dist/node/index.js')

const yargs = require('yargs').usage('')

// local arguments
const argv = yargs.argv
const ethNodeURL = argv.url === undefined ? 'http://localhost:8545' : argv.url
const hermezApiURL = argv.api === undefined ? 'localhost:8086' : argv.api

async function main () {
  // load ethereum network provider
  hermez.Providers.setProvider(ethNodeURL)
  // set API URL
  hermez.CoordinatorAPI.setBaseApiUrl(hermezApiURL)

  // initialize transaction pool
  hermez.TxPool.initializeTransactionPool()

  // load token to deposit information
  const tokenToDeposit = 0
  const token = await hermez.CoordinatorAPI.getTokens()
  const tokenERC20 = token.tokens[tokenToDeposit]

  // load first account
  const mnemonicIndex1 = 1
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(ethNodeURL, { type: 'JSON-RPC', addressOrIndex: mnemonicIndex1 })
  const hermezWallet = wallet.hermezWallet
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // load second account
  const mnemonicIndex2 = 2
  const wallet2 = await hermez.HermezWallet.createWalletFromEtherAccount(ethNodeURL, { type: 'JSON-RPC', addressOrIndex: mnemonicIndex2 })
  const hermezWallet2 = wallet2.hermezWallet
  const hermezEthereumAddress2 = wallet2.hermezEthereumAddress

  // set amount to deposit
  const amountDeposit = hermez.Utils.getTokenAmountBigInt('100', 18)

  // perform deposit account 1
  await hermez.Tx.deposit(
    amountDeposit,
    hermezEthereumAddress,
    tokenERC20,
    hermezWallet.publicKeyCompressedHex
  )

  // perform deposit account 2
  await hermez.Tx.deposit(
    amountDeposit,
    hermezEthereumAddress2,
    tokenERC20,
    hermezWallet2.publicKeyCompressedHex
  )
}

main()
