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

  // initialize transaction pool
  hermez.TxPool.initializeTransactionPool()

  // load token to deposit information
  const tokenToDeposit = 0
  const token = await hermez.CoordinatorAPI.getTokens()
  const tokenERC20 = token.tokens[tokenToDeposit]

  // load first account
  const mnemonicIndex1 = 1
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'JSON-RPC', addressOrIndex: mnemonicIndex1 })
  const hermezWallet = wallet.hermezWallet
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // load second account
  const mnemonicIndex2 = 2
  const wallet2 = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'JSON-RPC', addressOrIndex: mnemonicIndex2 })
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
