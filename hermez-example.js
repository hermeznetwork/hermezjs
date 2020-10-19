const hermez        = require("./src/hermez")

async function main() {
  // Init network provider.
  hermez.setDefaultProvider("http://localhost:8545")
  
  // Initialize Transaction Pool
  // Transaction Pool declares an instance in LocalStorage where user transactions are stored.
  // When a L1Tx or L2Tx is sent, the transaction is also kept in the LocalStorage
  hermez.initializeTransactionPool()
  

  // Create wallet
  // To create a wallet, we need to provide a signature and a hermez ethereum address.
  //  Signature is created with a standard message (METAMASK_MESSAGE)
  //  Hermez ethereum address is created by appending 'hez:' to the ethereum address.
  // In this example we create a standard wallet. It is also possible to link the hermez wallet to a existing
  // Metamask wallet
  const {hermezWallet, hermezEthereumAddress } = await hermez.newWalletFromEtherAccount(0)

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
  //  - In the example deployment, two tokens have been deployed and initialized in Hermez (ERC20 token and
  //      ERC777 token)
  //  - Deposit is a L1 transaction that interacts with a deployed mock smart contract.
  //  - Hermez node returns a single token available with a false address. Therefore, we substitute the
  //      token address returned by Hermez node by the real address of the token added to the list of supported 
  //      tokens
  //  - Deposit funtion always returns that the deposit is to be done to a non existent account
  //  - ethereum account is preloaded with 1e6 ERC20Tokens and 1e6 ERC777Tokens

  // TODO : I don't understand this function
  amount = hermez.getTokenAmountBigInt("100",2)

  // retrieve token info from Hermez network
  token = await hermez.getTokens()

  // ERC20 Token
  //  tmp function to update returned values from getToken to real ones.
  tokenERC20 = tmpUpdateToken(token,1)

  acc = await hermez.getAccounts(hermezEthereumAddress)
  console.log(acc)
  // make deposit of ERC20 Tokens
  await hermez.deposit(amount, hermezEthereumAddress, tokenERC20, hermezWallet.publicKeyCompressedHex)

  // HEZ Token : ERC777 
  //  tmp function to update returned values from getToken to real ones.
  tokenERC777 = tmpUpdateToken(token,2)

  // make deposit of ERC777 Tokens
  await hermez.deposit(amount, hermezEthereumAddress, tokenERC777, hermezWallet.publicKeyCompressedHex)
 
  // Withdraw -> Not completed

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

  // src account
  let account = (await hermez.getAccounts(hermezEthereumAddress, [tokenERC777.id])).accounts[0]
  // dst account
  let to = (await hermez.getAccounts(hermezEthereumAddress, [tokenERC777.id])).accounts[0]
  // fee computation
  let fees = await hermez.getFees()
  console.log(fees)
  let usdTokenExchangeRate = tokenERC777.USD
  let fee = fees.existingAccount / usdTokenExchangeRate
  // amount to transfer
  amount = hermez.getTokenAmountBigInt("10",2)

  // generate L2 transaction
  var {transaction, encodedTransaction} = await hermez.generateL2Transaction(
    {
      from: account.accountIndex,
      to: to.accountIndex,
      amount: hermez.float2Fix(hermez.floorFix2Float(amount)),
      fee,
      nonce: account.nonce
    },
    hermezWallet.publicKeyCompressedHex, account.token)

  // sign encoded transaction
  hermezWallet.signTransaction(transaction, encodedTransaction)
  // send transaction to coordinator
  result = await hermez.send(transaction, hermezWallet.publicKeyCompressedHex)
  console.log(result)

  // Check transaction in coordinator's transaction pool
  txPool = await hermez.getPoolTransaction(result.id)
  console.log(txPool)

  // Get transaction confirmation
  txConf = await hermez.getHistoryTransaction(txPool.id)
  console.log(txConf)


  // Exit
  // amount to retrieve
  amount = hermez.getTokenAmountBigInt("10",2)

  // generate L2 transaction
  var {transaction, encodedTransaction} = await hermez.generateL2Transaction(
    {
      type: 'Exit',
      from: account.accountIndex,
      to: false,
      amount: hermez.float2Fix(hermez.floorFix2Float(amount)),
      fee,
      nonce: account.nonce
    },
    hermezWallet.publicKeyCompressedHex, account.token)

    // sign encoded transaction
    hermezWallet.signTransaction(transaction, encodedTransaction)
    // send transaction to coordinator
    result = await hermez.send(transaction, hermezWallet.publicKeyCompressedHex)
    console.log("EXIT",result)

    // Check transaction in coordinator's transaction pool
    txPool = await hermez.getPoolTransaction(result.id)
    console.log(txPool)

}

function tmpUpdateToken(token, id) {
  if (id === 1){
    // ERC20
    token.tokens[0].ethereumAddress = "0x8858eeB3DfffA017D4BCE9801D340D36Cf895CCf"
  } else {
    // ERC777
    token.tokens[0].ethereumAddress = "0x7c2C195CD6D34B8F845992d380aADB2730bB9C6F" 
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
