import ethers from 'ethers'

import hermez from './src/index.js'

async function main() {
  // Init network provider.
  hermez.Providers.setProvider('http://localhost:8545')

  // Initialize Transaction Pool
  // Transaction Pool declares an instance in LocalStorage where user transactions are stored.
  // When a L1Tx or L2Tx is sent, the transaction is also kept in the LocalStorage
  hermez.TxPool.initializeTransactionPool()

  // Create wallet
  // To create a wallet, we need to provide a signature and a hermez ethereum address.
  //  Signature is created with a standard message (METAMASK_MESSAGE)
  //  Hermez ethereum address is created by appending 'hez:' to the ethereum address.
  // In this example we create a standard wallet. It is also possible to link the hermez wallet to a existing
  // Metamask wallet
  const { hermezWallet, hermezEthereumAddress } = await hermez.BabyJubWallet
    .createWalletFromEtherAccount({ type: hermez.Signers.SignerType.JSON_RPC, addressOrIndex: 0 })

  // We can also create a Hermez Wallet from a hardware wallet (Ledger or Trezor) providing different data
  // to create a Signer
  // const { hermezWallet, hermezEthereumAddress } = await hermez.BabyJubWallet
  //   .createWalletFromEtherAccount({ type: hermez.Signers.SignerType.LEDGER, path: "m/44'/60'/0'/0/0" })
  // const { hermezWallet, hermezEthereumAddress } = await hermez.BabyJubWallet
  //   .createWalletFromEtherAccount({ type: hermez.Signers.SignerType.TREZOR, path: "m/44'/60'/0'/0/0" })

  // Deposit
  // First transaction is a deposit from the ethereum address into hermez network. Since a hermez
  // account associated to the ethereum address doesn't exist at this point, this deposit transaction
  // will also create one.
  // The steps to do a deposit are:
  //   - Select amount to deposit from ethereum into hermez using getTokenAmountBitInt
  //   - Select the token denomination of the deposit. Hermez contains a list of supported token that
  //      can be queried with getTokens(). This function returns the list of supported tokens. Only
  //      tokens in this list can be used.
  //   - Sender Hermez address
  //   - Sender Compresed Babyjubjub
  //   
  // NOTES
  //  In this preliminary version there are certain harcoded steps that stem from the fact that there is
  //    no real Hermez node running yet (mock server only that always provides same responses to the 
  //    same queries). These are:
  //  - In the example deployment, one token have been deployed and initialized in Hermez (ERC20 token)
  //  - Deposit is a L1 transaction that interacts with a deployed mock smart contract.
  //  - Hermez node returns a single token available with a false address. Therefore, we substitute the
  //      token address returned by Hermez node by the real address of the token added to the list of supported 
  //      tokens
  //  - Deposit funtion always returns that the deposit is to be done to a non existent account
  //  - ethereum account is preloaded with 1e6 ERC20Tokens

  // TODO : I don't understand this function
  let amount = hermez.Utils.getTokenAmountBigInt('100',2)

  // retrieve token info from Hermez network
  const token = await hermez.CoordinatorAPI.getTokens()

  // ERC20 Token
  //  tmp function to update returned values from getToken to real ones.
  const tokenERC20 = tmpUpdateToken(token,1)

  // make deposit of ERC20 Tokens
  await hermez.Tx.deposit(
    amount,
    hermezEthereumAddress,
    tokenERC20,
    hermezWallet.publicKeyCompressedHex,
    { type: hermez.Signers.SignerType.JSON_RPC }
  )

  // Forge Batch


  // Transfer
  //  Transfer is a L2 transaction. At this point, Hermez source account is already created with 
  //  some amount of tokens.
  //  The steps to configure a transfer transaction are:
  //  - Generate the L2 transaction locally first by calling generateL2Transaction(). This function
  //     returns a temporary transaction + a compressed transaction.
  //     For this we need:
  //     * Source account index -> retrieved by calling getAccounts with sender hermez address and token id
  //        of the token used for the transfer. Source account index must exist.
  //     * Destination account index -> retrieved by calling getAccounts with sender hermez address and token id. If its an Exit, set it to false
  //        of the token used for the transfer. Destination account undex must exit. Additionally, token id
  //        associated to source account must much token id associated to destination account.
  //     * Amount of tokens to transfer. Sender must have enough funds.
  //     * Fee : Amount to be paid to coordinator. The fee will be paid in the same denomination as the token
  //        of the transaction. Recommended feeds can be retrieved using getFees().
  //     * Nonce : current noce of the sender's token account, retrieved with getAccounts() function
  //     * Sender compressed BabyJubJub un hex format
  //     * Token object recovered from hermez when calling getAccounts()
  //   - Sign compressed transaction and store result as part of the transaction. For this, ouw babyjub wallet
  //      was a signature function signTransaction()
  //   - Send the transaction to the coordinator
  //
  //   NOTES
  //    Similarly to deposit example, transfer also interacts with a static hermez server that responds
  //    to queries always provinding same response:
  //    - getAccounts -> it should provide information on the queried account + token. In this case will 
  //       provided a harcoded answer.
  //    - getFees -> it should provide information on the fees

  // Create 2nd wallet
  const {hermezWallet2, hermezEthereumAddress2 } = await hermez.BabyJubWallet.createWalletFromEtherAccount(1)
  // src account
  let account = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress, [tokenERC20.id])).accounts[0]
  // dst account
  let to = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress2, [tokenERC20.id])).accounts[0]
  // fee computation
  const state = await hermez.CoordinatorAPI.getState()
  console.log(state.recommendedFee)
  let usdTokenExchangeRate = tokenERC20.USD
  let fee = state.recommendedFee.existingAccount / usdTokenExchangeRate
  // amount to transfer
  amount = hermez.Utils.getTokenAmountBigInt('10',2)

  // generate L2 transaction
  var {transaction, encodedTransaction} = await hermez.TxUtils.generateL2Transaction(
    {
      from: account.accountIndex,
      to: to.accountIndex,
      amount: hermez.Float16.float2Fix(hermez.Float16.floorFix2Float(amount)),
      fee,
      nonce: account.nonce
    },
    hermezWallet.publicKeyCompressedHex, account.token)

  // sign encoded transaction
  hermezWallet.signTransaction(transaction, encodedTransaction)
  // send transaction to coordinator
  let result = await hermez.Tx.send(transaction, hermezWallet.publicKeyCompressedHex)
  console.log(result)

  // Check transaction in coordinator's transaction pool
  const txPool = await hermez.CoordinatorAPI.getPoolTransaction(result.id)
  console.log(txPool)

  // Get transaction confirmation
  const txConf = await hermez.CoordinatorAPI.getHistoryTransaction(txPool.id)
  console.log(txConf)

  // Exit (L2)
  // amount to retrieve
  amount = hermez.Utils.getTokenAmountBigInt('10',2)

  // generate L2 transaction
  var {transaction, encodedTransaction} = await hermez.TxUtils.generateL2Transaction(
    {
      type: 'Exit',
      from: account.accountIndex,
      to: null,
      amount: hermez.Float16.float2Fix(hermez.Float16.floorFix2Float(amount)),
      fee,
      nonce: account.nonce
    },
    hermezWallet.publicKeyCompressedHex, account.token)

    // sign encoded transaction
    hermezWallet.signTransaction(transaction, encodedTransaction)
    // send transaction to coordinator
    result = await hermez.Tx.send(transaction, hermezWallet.publicKeyCompressedHex)
    console.log('EXIT',result)

    // Check transaction in coordinator's transaction pool
    const txExitPool = await hermez.CoordinatorAPI.getPoolTransaction(result.id)
    console.log(txExitPool)

    const txExitConf = await hermez.CoordinatorAPI.getHistoryTransaction(txExitPool.id)
    console.log(txExitConf)
    
    // Force Exit (L1)
    const from = (await hermez.CoordinatorAPI.getAccounts(hermezEthereumAddress2, [tokenERC20.id])).accounts[0]
    const forceExitTx = await hermez.Tx.forceExit(
      amount,
      'hez:TKN:256',
      tokenERC20,
      { type: hermez.Signers.SignerType.JSON_RPC }
    )
    //const forceExitTx = await hermez.Tx.forceExit(amount, from.accountIndex, tokenERC20)
    console.log(forceExitTx)

    // Forge batch

    // Withdraw
    const exitInfo = await hermez.CoordinatorAPI.getExit(txExitConf.batchNum, txExitConf.fromAccountIndex)
    const withdrawInfo = await hermez.Tx.withdraw(
      amount,
      'hez:TKN:256',
      tokenERC20,
      hermezWallet.publicKeyCompressedHex,
      ethers.BigNumber.from('4'),
      [],
      { type: hermez.Signers.SignerType.JSON_RPC }
    )
    // const withdrawInfo = await hermez.Tx.withdraw(amount, from.accountIndex, tokenERC20, hermezWallet.publicKeyCompressedHex, exitInfo.merkleProof.Root, exitInfo.merkleProof.Siblings)
    console.log(withdrawInfo)


}

function tmpUpdateToken(token, id) {
  if (id === 1){
    // ERC20
    token.tokens[0].ethereumAddress = '0xf4e77E5Da47AC3125140c470c71cBca77B5c638c'
  } 
  token.tokens[0].id = id

  return token.tokens[0]
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
