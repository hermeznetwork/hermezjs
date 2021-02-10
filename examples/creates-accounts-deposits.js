const hermez = require('../dist/node/index.js')
const {
  EXAMPLES_WEB3_URL,
  EXAMPLES_PRIVATE_KEY1,
  EXAMPLES_PRIVATE_KEY2,
  configureEnvironment
} = require('./constants.js')

async function main () {
  const privKey1 = EXAMPLES_PRIVATE_KEY1
  const privKey2 = EXAMPLES_PRIVATE_KEY2

  // Configure Environment (SC address, WEB3 providers,...)
  configureEnvironment()

  // initialize transaction pool
  hermez.TxPool.initializeTransactionPool()

  // load token to deposit information
  const tokenToDeposit = 0
  const token = await hermez.CoordinatorAPI.getTokens()
  const tokenERC20 = token.tokens[tokenToDeposit]

  // load first account
  const wallet = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privKey1 })
  const hermezWallet = wallet.hermezWallet
  const hermezEthereumAddress = wallet.hermezEthereumAddress

  // load second account
  const wallet2 = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privKey2 })
  const hermezWallet2 = wallet2.hermezWallet
  const hermezEthereumAddress2 = wallet2.hermezEthereumAddress

  // set amount to deposit
  const amountDeposit = hermez.HermezCompressedAmount.compressAmount(hermez.Utils.getTokenAmountBigInt('0.1', 18))

  // perform deposit account 1
  await hermez.Tx.deposit(
    amountDeposit,
    hermezEthereumAddress,
    tokenERC20,
    hermezWallet.publicKeyCompressedHex,
    { type: 'WALLET', privateKey: privKey1 }
  )

  // perform deposit account 2
  await hermez.Tx.deposit(
    amountDeposit,
    hermezEthereumAddress2,
    tokenERC20,
    hermezWallet2.publicKeyCompressedHex,
    { type: 'WALLET', privateKey: privKey2 }
  )
}

main()
