const hermez = require('../dist/node/index.js')
const {
  EXAMPLES_WEB3_URL,
  EXAMPLES_PRIVATE_KEY1,
  configureEnvironment
} = require('./constants.js')

function getRandomPrivKey (length) {
  const randomChars = 'ABCDEF0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += randomChars.charAt(Math.floor(Math.random() * randomChars.length))
  }
  return result
}

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

  // create random ethereum key
  const privKey2 = getRandomPrivKey(64)

  // load second account
  const wallet2 = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privKey2 })
  const hermezWallet2 = wallet2.hermezWallet
  const hermezEthereumAddress2 = wallet2.hermezEthereumAddress

  // get sender account information
  const infoAccountSender = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
    .accounts[0]

  // set amount to transfer
  const amountTransfer = hermez.HermezCompressedAmount.compressAmount(hermez.Utils.getTokenAmountBigInt('0.0003', 18))
  // set fee in transaction
  const state = await hermez.CoordinatorAPI.getState()
  const usdTokenExchangeRate = tokenERC20.USD
  const fee = usdTokenExchangeRate ? state.recommendedFee.createAccount / usdTokenExchangeRate : 0

  // generate L2 transaction
  const l2TxTransfer = {
    from: infoAccountSender.accountIndex,
    to: hermezEthereumAddress2,
    amount: amountTransfer,
    fee: fee
  }

  // Transfer should fail because there is no account authorization
  await hermez.Tx.generateAndSendL2Tx(l2TxTransfer, hermezWallet, infoAccountSender.token).catch(console.log)

  // performs create account authorization account 2
  const signature = await hermezWallet2.signCreateAccountAuthorization(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privKey2 })
  await hermez.CoordinatorAPI.postCreateAccountAuthorization(
    hermezWallet2.hermezEthereumAddress,
    hermezWallet2.publicKeyBase64,
    signature
  ).catch((error) => {
    console.log(error.response)
  })

  // Verify autorization
  const authConf = await hermez.CoordinatorAPI.getCreateAccountAuthorization(hermezWallet2.hermezEthereumAddress)
  console.log('Authorization', authConf)

  // Transfer should be sucessful
  const transferResponse2 = await hermez.Tx.generateAndSendL2Tx(l2TxTransfer, hermezWallet, infoAccountSender.token).catch(console.log)
  console.log('transferResponse: ', transferResponse2)
}

main()
