import { isConnected, requestAccess, getAddress, signTransaction } from "@stellar/freighter-api";

export const connectWallet = async (): Promise<string | null> => {
  if (!(await isConnected())) {
    console.warn("Freighter is not installed or not connected.");
    return null;
  }
  const access = await requestAccess();
  if (access) {
    const address = await getAddress();
    return address;
  }
  return null;
};

export const getWalletAddress = async (): Promise<string | null> => {
  return await getAddress();
};

export const signTx = async (xdr: string, network: string = "TESTNET"): Promise<string> => {
  const signedTx = await signTransaction(xdr, { network });
  return signedTx as string;
};
