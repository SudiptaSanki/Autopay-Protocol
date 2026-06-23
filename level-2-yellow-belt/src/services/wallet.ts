// @ts-nocheck
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';

StellarWalletsKit.init({
  network: Networks.TESTNET,
  selectedWalletId: 'freighter',
  modules: [
    new FreighterModule(),
    new AlbedoModule()
  ]
});

export const connectWallet = async (id: string, onAddressChange: (address: string) => void): Promise<void> => {
  try {
    StellarWalletsKit.setWallet(id);
    const { address } = await StellarWalletsKit.fetchAddress();
    onAddressChange(address);
  } catch (error: any) {
    console.error("Wallet connection rejected or failed", error);
    throw error;
  }
};

export const disconnectWallet = async () => {
  try {
    await StellarWalletsKit.disconnect();
  } catch(e) {}
};

export const signTx = async (xdr: string): Promise<string> => {
  try {
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: Networks.TESTNET
    });
    return signedTxXdr;
  } catch (error: any) {
    throw new Error("TransactionRejected");
  }
};
