import { isConnected, requestAccess, getAddress, signTransaction } from "@stellar/freighter-api";
import { Networks } from "@stellar/stellar-sdk";

export const connectWallet = async (): Promise<string | null> => {
  if (!(await isConnected())) {
    console.warn("Freighter is not installed or not connected.");
    return null;
  }
  const access = await requestAccess();
  if (access) {
    const response = await getAddress();
    if (response.error) {
      console.error(response.error);
      return null;
    }
    return response.address;
  }
  return null;
};

export const getWalletAddress = async (): Promise<string | null> => {
  const response = await getAddress();
  if (response.error) {
    return null;
  }
  return response.address;
};

export const signTx = async (xdr: string, networkPassphrase: string = Networks.TESTNET): Promise<string> => {
  const response = await signTransaction(xdr, { networkPassphrase });
  if (response.error) {
    throw new Error(response.error);
  }
  return response.signedTxXdr;
};
