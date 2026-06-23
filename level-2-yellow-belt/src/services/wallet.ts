// @ts-nocheck
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';

StellarWalletsKit.init({
  network: Networks.TESTNET,
  selectedWalletId: 'freighter',
  modules: [
    new FreighterModule()
  ]
});

export const connectWallet = async (id: string, onAddressChange: (address: string) => void): Promise<void> => {
  try {
    if (id === 'metamask') {
      if (!window.ethereum) {
        throw new Error("WalletNotFound");
      }
      
      // Request MetaMask snap access
      await window.ethereum.request({
        method: 'wallet_requestSnaps',
        params: {
          'npm:stellar-snap': {}
        }
      });
      
      // Fetch address
      const address = await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:stellar-snap',
          request: {
            method: 'getAddress'
          }
        }
      });
      
      if (typeof address === 'string' && address.startsWith('G')) {
        onAddressChange(address);
        localStorage.setItem("active_wallet_id", "metamask");
      } else {
        throw new Error("InvalidAddressFromSnap");
      }
    } else {
      StellarWalletsKit.setWallet(id);
      const { address } = await StellarWalletsKit.fetchAddress();
      onAddressChange(address);
      localStorage.setItem("active_wallet_id", id);
    }
  } catch (error: any) {
    console.error("Wallet connection rejected or failed", error);
    throw error;
  }
};

export const disconnectWallet = async () => {
  try {
    localStorage.removeItem("active_wallet_id");
    await StellarWalletsKit.disconnect();
  } catch(e) {}
};

export const signTx = async (xdr: string): Promise<string> => {
  try {
    const activeWalletId = localStorage.getItem("active_wallet_id") || "freighter";
    if (activeWalletId === "metamask") {
      if (!window.ethereum) {
        throw new Error("WalletNotFound");
      }
      const signedTxXdr = await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:stellar-snap',
          request: {
            method: 'signTransaction',
            params: {
              transaction: xdr,
              testnet: true
            }
          }
        }
      });
      if (typeof signedTxXdr === 'string') {
        return signedTxXdr;
      }
      throw new Error("TransactionRejected");
    } else {
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: Networks.TESTNET
      });
      return signedTxXdr;
    }
  } catch (error: any) {
    console.error("Transaction sign error:", error);
    throw new Error("TransactionRejected");
  }
};
