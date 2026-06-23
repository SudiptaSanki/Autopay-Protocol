import * as StellarSdk from "@stellar/stellar-sdk";

// Initialize Stellar Testnet server
export const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

export const fetchBalance = async (publicKey: string): Promise<string> => {
  try {
    const account = await server.loadAccount(publicKey);
    const xlmBalance = account.balances.find((b) => b.asset_type === "native");
    return xlmBalance ? xlmBalance.balance : "0";
  } catch (error) {
    console.error("Error fetching balance:", error);
    return "0";
  }
};

export const createTransferTransaction = async (
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string
) => {
  const account = await server.loadAccount(sourcePublicKey);
  const fee = await server.fetchBaseFee();

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: fee.toString(),
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationPublicKey,
        asset: StellarSdk.Asset.native(),
        amount: amount,
      })
    )
    .setTimeout(30)
    .build();

  return transaction;
};

export const submitTransaction = async (signedXdr: string) => {
  const transaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);
  const response = await server.submitTransaction(transaction as StellarSdk.Transaction);
  return response;
};
