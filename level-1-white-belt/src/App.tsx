import { useState, useEffect } from "react";
import { connectWallet, getWalletAddress, signTx } from "./services/freighter";
import { fetchBalance, createTransferTransaction, submitTransaction } from "./services/stellar";

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [targetAddress, setTargetAddress] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [txStatus, setTxStatus] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");

  useEffect(() => {
    const checkConnection = async () => {
      const addr = await getWalletAddress();
      if (addr) {
        setAddress(addr);
        const bal = await fetchBalance(addr);
        setBalance(bal);
      }
    };
    checkConnection();
  }, []);

  const handleConnect = async () => {
    const addr = await connectWallet();
    if (addr) {
      setAddress(addr);
      const bal = await fetchBalance(addr);
      setBalance(bal);
    }
  };

  const handleDisconnect = () => {
    // Freighter doesn't have a direct "disconnect" API, so we just clear state
    setAddress(null);
    setBalance("0");
  };

  const handleSend = async () => {
    if (!address) return;
    setTxStatus("Building transaction...");
    setTxHash("");
    try {
      const tx = await createTransferTransaction(address, targetAddress, amount);
      setTxStatus("Awaiting signature...");
      const signedXdr = await signTx(tx.toXDR());
      setTxStatus("Submitting to network...");
      const result = await submitTransaction(signedXdr);
      setTxStatus("Transaction successful!");
      setTxHash(result.hash);
      const newBal = await fetchBalance(address);
      setBalance(newBal);
    } catch (error: any) {
      console.error(error);
      setTxStatus(`Transaction failed: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Autopay-Protocol: Level 1 (White Belt)</h1>
      
      {!address ? (
        <button onClick={handleConnect}>Connect Freighter Wallet</button>
      ) : (
        <div>
          <p><strong>Connected Address:</strong> {address}</p>
          <p><strong>XLM Balance:</strong> {balance}</p>
          <button onClick={handleDisconnect}>Disconnect</button>

          <hr style={{ margin: "20px 0" }} />
          
          <h2>Send XLM (Testnet)</h2>
          <div style={{ marginBottom: "10px" }}>
            <label>Destination Address: </label>
            <input 
              type="text" 
              value={targetAddress} 
              onChange={(e) => setTargetAddress(e.target.value)} 
              style={{ width: "400px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Amount (XLM): </label>
            <input 
              type="text" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>
          <button onClick={handleSend}>Send Transaction</button>

          {txStatus && (
            <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
              <p><strong>Status:</strong> {txStatus}</p>
              {txHash && (
                <p>
                  <strong>Tx Hash:</strong>{" "}
                  <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer">
                    {txHash}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
