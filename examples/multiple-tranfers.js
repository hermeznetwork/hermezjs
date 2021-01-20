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

  // load second account
  const mnemonicIndex2 = 2
  const wallet2 = await hermez.HermezWallet.createWalletFromEtherAccount(EXAMPLES_WEB3_URL, { type: 'JSON-RPC', addressOrIndex: mnemonicIndex2 })
  const hermezEthereumAddress2 = wallet2.hermezEthereumAddress

  // get sender account information
  const infoAccountSender = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id]))
    .accounts[0]

  // get receiver account information
  const infoAccountReceiver = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress2, [tokenERC20.id]))
    .accounts[0]

  // set amount to transfer
  const amountTransfer = hermez.Utils.getTokenAmountBigInt('1', 18)
  // set fee in transaction
  const userFee = 0

  // perform multiple transfers
  const numTransfers = 5

  for (let i = 0; i < numTransfers; i++) {
    const l2TxTransfer = {
      type: 'Transfer',
      from: infoAccountSender.accountIndex,
      to: infoAccountReceiver.accountIndex,
      amount: amountTransfer,
      userFee
    }

    const transferResponse = await hermez.Tx.generateAndSendL2Tx(l2TxTransfer, hermezWallet, infoAccountSender.token)
    console.log(`transferResponse ${i}: `, transferResponse)
  }
}

main()
