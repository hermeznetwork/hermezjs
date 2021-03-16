const hermez = require('../dist/node/index.js')
const {
  EXAMPLES_WEB3_URL,
  EXAMPLES_PRIVATE_KEY1,
  EXAMPLES_PRIVATE_KEY2,
  configureEnvironment
} = require('./constants.js')

async function sleep (timeout) {
  await new Promise(resolve => setTimeout(resolve, timeout))
}

async function main () {
  const privKey1 = EXAMPLES_PRIVATE_KEY1
  const privKey2 = EXAMPLES_PRIVATE_KEY2

  // Configure Environment (SC address, WEB3 providers,...)
  configureEnvironment()

  // load token to deposit information
  const tokenToDeposit = 0
  const tokensRes = await hermez.CoordinatorAPI.getTokens()
  const tokenERC20 = tokensRes.tokens[tokenToDeposit]

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

  // WAIT until account is created
  let pollingAccountCreate = true
  while (pollingAccountCreate) {
    const accountInfo = await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id])
    if (accountInfo.accounts.length === 0) {
      console.log('Waiting for deposit to be forged...')
      await sleep(10000)
    } else {
      pollingAccountCreate = false
    }
  }

  // performs create account authorization account 2
  const signature = await hermezWallet2.signCreateAccountAuthorization(EXAMPLES_WEB3_URL, { type: 'WALLET', privateKey: privKey2 })
  const res = await hermez.CoordinatorAPI.postCreateAccountAuthorization(
    hermezWallet2.hermezEthereumAddress,
    hermezWallet2.publicKeyBase64,
    signature
  ).catch((error) => {
    console.log(error.response)
  })
  console.log('create account authorization response:', res.response.status)

  // get sender account information
  const infoAccountSender = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
    .accounts[0]

  // set amount to transfer
  const amountTransfer = hermez.HermezCompressedAmount.compressAmount(hermez.Utils.getTokenAmountBigInt('0.1', 18))
  // set fee in transaction
  const state = await hermez.CoordinatorAPI.getState()
  const recommendedFees = state.recommendedFee

  // generate L2 transaction
  const l2TxTransfer = {
    from: infoAccountSender.accountIndex,
    to: hermezEthereumAddress2,
    amount: amountTransfer,
    fee: recommendedFees.createAccount
  }
  const transferResponse = await hermez.Tx.generateAndSendL2Tx(l2TxTransfer, hermezWallet, infoAccountSender.token).catch(console.log)
  console.log('transferResponse: ', transferResponse)
}
try {
  main()
} catch (e) {
  console.log(e)
}
