// @ts-nocheck
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';

export const kit = new StellarWalletsKit({
  network: Networks.TESTNET,
  selectedWalletId: 'freighter',
  modules: [
    new FreighterModule(),
    new AlbedoModule()
  ]
});

export const connectWallet = async (onAddressChange: (address: string) => void): Promise<void> => {
  try {
    await kit.openModal({
      onWalletSelected: async (option) => {
        try {
          kit.setWallet(option.id);
          const publicKey = await kit.getPublicKey();
          onAddressChange(publicKey);
        } catch (error) {
          console.error("Wallet connection rejected or failed", error);
        }
      }
    });
  } catch (error) {
    console.error("Modal error", error);
  }
};

export const disconnectWallet = () => {
  // no-op
};

export const signTx = async (xdr: string): Promise<string> => {
  try {
    const { signedXDR } = await kit.signTx({
      xdr,
      publicKeys: [await kit.getPublicKey()],
      network: Networks.TESTNET
    });
    return signedXDR;
  } catch (error: any) {
    throw new Error("TransactionRejected");
  }
};
