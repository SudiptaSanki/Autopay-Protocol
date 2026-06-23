// @ts-nocheck
import * as StellarSdk from "@stellar/stellar-sdk";

export const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
export const sorobanServer = new StellarSdk.rpc.Server("https://soroban-testnet.stellar.org");

export const CONTRACT_ID = "CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH";

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

export const createSubscriptionTx = async (
  sourcePublicKey: string,
  amount: string,
  interval: string
) => {
  const account = await server.loadAccount(sourcePublicKey);
  const fee = await server.fetchBaseFee();
  
  const parsedAmount = parseInt(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error("InvalidAmount");
  }
  
  const parsedInterval = parseInt(interval);

  const contract = new StellarSdk.Contract(CONTRACT_ID);
  const operation = contract.call(
    "create_subscription",
    new StellarSdk.Address(sourcePublicKey).toScVal(),
    StellarSdk.nativeToScVal(parsedAmount, { type: "i128" }),
    StellarSdk.nativeToScVal(parsedInterval, { type: "u64" })
  );

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: (parseInt(fee) * 100).toString(), // Soroban needs higher base fee
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(operation)
    .setTimeout("30")
    .build();

  const preparedTx = await sorobanServer.prepareTransaction(transaction);
  return preparedTx;
};

export const submitSorobanTransaction = async (signedXdr: string) => {
  const transaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, StellarSdk.Networks.TESTNET);
  const sendResponse = await sorobanServer.sendTransaction(transaction as StellarSdk.Transaction);
  
  if (sendResponse.status === "ERROR") {
    throw new Error(`Transaction sending failed: ${(sendResponse as any).errorResultXdr || (sendResponse as any).errorResult}`);
  }
  
  // Wait for the transaction to be processed
  let statusResponse = await sorobanServer.getTransaction(sendResponse.hash);
  while (statusResponse.status === "NOT_FOUND") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    statusResponse = await sorobanServer.getTransaction(sendResponse.hash);
  }
  
  if (statusResponse.status === "FAILED") {
    throw new Error(`Transaction failed on-chain`);
  }
  
  return sendResponse.hash;
};

export const fetchContractEvents = async () => {
  const response = await sorobanServer.getEvents({
    startLedger: 0, // In production, limit this
    filters: [
      {
        type: "contract",
        contractIds: [CONTRACT_ID],
        topics: [
            [StellarSdk.xdr.ScVal.scvSymbol("Created").toXDR("base64") as any]
        ]
      }
    ],
    limit: 10,
  });
  return response.events;
};
