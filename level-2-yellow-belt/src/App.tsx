import { useState, useEffect } from "react";
import { connectWallet, disconnectWallet, signTx, kit } from "./services/wallet";
import { fetchBalance, createSubscriptionTx, submitSorobanTransaction, fetchContractEvents, CONTRACT_ID } from "./services/stellar";

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [amount, setAmount] = useState<string>("100");
  const [interval, setInterval] = useState<string>("30");
  const [txStatus, setTxStatus] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // @ts-ignore
        const key = await kit.getPublicKey();
        if (key) {
          setAddress(key);
          const bal = await fetchBalance(key);
          setBalance(bal);
        }
      } catch (e) {
        // Not connected
      }
    };
    checkConnection();
  }, []);

  useEffect(() => {
    const pollEvents = async () => {
      try {
        const latestEvents = await fetchContractEvents();
        setEvents(latestEvents);
      } catch (e) {
        console.error("Failed to fetch events", e);
      }
    };
    const timer = window.setInterval(pollEvents, 5000);
    pollEvents();
    return () => window.clearInterval(timer);
  }, []);

  const handleConnect = async () => {
    await connectWallet(async (addr) => {
      setAddress(addr);
      const bal = await fetchBalance(addr);
      setBalance(bal);
    });
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setAddress(null);
    setBalance("0");
  };

  const handleSubscribe = async () => {
    if (!address) {
      setTxStatus("Error: WalletNotConnected. Please connect your wallet first.");
      return;
    }
    
    setTxStatus("Building Soroban transaction...");
    setTxHash("");
    
    try {
      const preparedTx = await createSubscriptionTx(address, amount, interval);
      
      setTxStatus("Awaiting signature from wallet...");
      let signedXdr: string;
      try {
        signedXdr = await signTx(preparedTx.toXDR());
      } catch (err: any) {
        if (err.message === "TransactionRejected") {
          setTxStatus("Error: TransactionRejected. You declined the signature in your wallet.");
        } else {
          setTxStatus("Error: TransactionRejected. Signature failed.");
        }
        return;
      }
      
      setTxStatus("Submitting to network (Pending)...");
      const hash = await submitSorobanTransaction(signedXdr);
      
      setTxStatus("Transaction successful! (Success)");
      setTxHash(hash);
      
      const newBal = await fetchBalance(address);
      setBalance(newBal);
    } catch (error: any) {
      console.error(error);
      if (error.message === "InvalidAmount") {
        setTxStatus(`Error: InvalidAmount. The amount must be a positive number.`);
      } else {
        setTxStatus(`Transaction failed: ${error.message || "Unknown error"} (Fail)`);
      }
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Autopay Protocol - Level 2 (Yellow Belt)</h1>
      <p>Multi-Wallet & Smart Contract Integration</p>
      
      {!address ? (
        <button onClick={handleConnect} style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}>
          Connect Wallet (StellarWalletsKit)
        </button>
      ) : (
        <div>
          <div style={{ background: "#f4f4f4", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
            <p><strong>Connected Address:</strong> {address}</p>
            <p><strong>XLM Balance:</strong> {balance}</p>
            <button onClick={handleDisconnect}>Disconnect</button>
          </div>

          <hr style={{ margin: "20px 0" }} />
          
          <h2>Create Subscription (Smart Contract)</h2>
          <p>Contract ID: <code>{CONTRACT_ID}</code></p>
          <div style={{ marginBottom: "10px" }}>
            <label>Amount: </label>
            <input 
              type="text" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Interval (seconds): </label>
            <input 
              type="text" 
              value={interval} 
              onChange={(e) => setInterval(e.target.value)} 
            />
          </div>
          <button onClick={handleSubscribe} style={{ padding: "10px 20px", cursor: "pointer" }}>
            Create Subscription
          </button>

          {txStatus && (
            <div style={{ marginTop: "20px", padding: "15px", borderRadius: "8px", border: "1px solid #ccc", background: txStatus.includes("Error") ? "#ffebee" : "#e8f5e9" }}>
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

          <hr style={{ margin: "30px 0" }} />

          <h2>Live Contract Events</h2>
          <p>Listening for `SubscriptionCreated` events on the ledger...</p>
          <div style={{ background: "#222", color: "#0f0", padding: "15px", borderRadius: "8px", maxHeight: "300px", overflowY: "auto", fontFamily: "monospace" }}>
            {events.length === 0 ? "No events found yet..." : (
              events.map((e, idx) => (
                <div key={idx} style={{ marginBottom: "10px", borderBottom: "1px solid #444", paddingBottom: "10px" }}>
                  <p style={{ margin: "0" }}><strong>Type:</strong> {e.type}</p>
                  <p style={{ margin: "0" }}><strong>Ledger:</strong> {e.ledger}</p>
                  <p style={{ margin: "0", wordBreak: "break-all" }}><strong>Topics:</strong> {JSON.stringify(e.topic)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
