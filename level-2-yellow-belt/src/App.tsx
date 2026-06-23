import { useState, useEffect } from "react";
import { connectWallet, disconnectWallet, signTx } from "./services/wallet";
import { fetchBalance, createSubscriptionTx, submitSorobanTransaction, fetchContractEvents, CONTRACT_ID } from "./services/stellar";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogOut, ArrowRight, Activity, ShieldCheck, Zap } from "lucide-react";

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [amount, setAmount] = useState<string>("100");
  const [interval, setInterval] = useState<string>("30");
  const [txStatus, setTxStatus] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const pollEvents = async () => {
      try {
        const latestEvents = await fetchContractEvents();
        if (latestEvents) {
          setEvents(latestEvents);
        }
      } catch (e) {
        console.error("Failed to fetch events", e);
      }
    };
    const timer = window.setInterval(pollEvents, 5000);
    pollEvents();
    return () => window.clearInterval(timer);
  }, []);

  const handleConnect = async (walletId: string) => {
    await connectWallet(walletId, async (addr) => {
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
    
    setIsLoading(true);
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
        setIsLoading(false);
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
    setIsLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ padding: "24px 48px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={20} color="white" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0, background: "linear-gradient(to right, #60a5fa, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Autopay Protocol</h1>
        </motion.div>
        
        <AnimatePresence mode="wait">
          {!address ? (
            <motion.div key="connect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => handleConnect('freighter')} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#3b82f6", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600, transition: "background 0.2s" }}>
                <Wallet size={18} /> Freighter
              </button>
              <button onClick={() => handleConnect('albedo')} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#8b5cf6", color: "white", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600, transition: "background 0.2s" }}>
                <Wallet size={18} /> Albedo
              </button>
            </motion.div>
          ) : (
            <motion.div key="connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ background: "#1e293b", padding: "8px 16px", borderRadius: "8px", border: "1px solid #334155" }}>
                <span style={{ color: "#94a3b8", fontSize: "14px", marginRight: "8px" }}>Balance:</span>
                <span style={{ fontWeight: "bold", color: "#60a5fa" }}>{balance} XLM</span>
              </div>
              <div style={{ background: "#1e293b", padding: "8px 16px", borderRadius: "8px", border: "1px solid #334155" }}>
                <span style={{ color: "#94a3b8", fontSize: "14px", marginRight: "8px" }}>Wallet:</span>
                <span style={{ fontFamily: "monospace", color: "#f8fafc" }}>{address.slice(0, 5)}...{address.slice(-4)}</span>
              </div>
              <button onClick={handleDisconnect} style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }}>
                <LogOut size={16} /> Disconnect
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }}>
        
        {/* Left Column: Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ background: "linear-gradient(145deg, #1e293b, #0f172a)", padding: "32px", borderRadius: "24px", border: "1px solid #334155", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
            <h2 style={{ fontSize: "28px", margin: "0 0 24px 0", display: "flex", alignItems: "center", gap: "12px" }}>
              <ShieldCheck color="#60a5fa" /> Create Subscription
            </h2>
            <p style={{ color: "#94a3b8", marginBottom: "32px", lineHeight: "1.6" }}>
              Initialize a recurring payment agreement on the Soroban smart contract. The contract ensures your funds are transferred safely at the specified intervals.
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: "#cbd5e1", marginBottom: "8px", fontWeight: 500 }}>Amount (XLM)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                style={{ width: "100%", padding: "16px", background: "#0f172a", border: "1px solid #334155", borderRadius: "12px", color: "white", fontSize: "16px", boxSizing: "border-box", outline: "none", transition: "border 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "#60a5fa"}
                onBlur={(e) => e.target.style.borderColor = "#334155"}
              />
            </div>
            
            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", color: "#cbd5e1", marginBottom: "8px", fontWeight: 500 }}>Interval (Seconds)</label>
              <input 
                type="number" 
                value={interval} 
                onChange={(e) => setInterval(e.target.value)} 
                style={{ width: "100%", padding: "16px", background: "#0f172a", border: "1px solid #334155", borderRadius: "12px", color: "white", fontSize: "16px", boxSizing: "border-box", outline: "none", transition: "border 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "#60a5fa"}
                onBlur={(e) => e.target.style.borderColor = "#334155"}
              />
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubscribe} 
              disabled={isLoading}
              style={{ width: "100%", padding: "16px", background: "linear-gradient(to right, #3b82f6, #8b5cf6)", color: "white", border: "none", borderRadius: "12px", fontSize: "18px", fontWeight: "bold", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
            >
              {isLoading ? "Processing..." : "Deploy Subscription"} <ArrowRight size={20} />
            </motion.button>

            <AnimatePresence>
              {txStatus && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }} 
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: "24px", padding: "16px", borderRadius: "12px", border: "1px solid", background: txStatus.includes("Error") ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)", borderColor: txStatus.includes("Error") ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)" }}
                >
                  <p style={{ margin: 0, color: txStatus.includes("Error") ? "#fca5a5" : "#86efac", fontSize: "14px", lineHeight: "1.5" }}>{txStatus}</p>
                  {txHash && (
                    <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "12px", color: "#60a5fa", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
                      View on Stellar Expert →
                    </a>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right Column: Events */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ background: "#1e293b", padding: "32px", borderRadius: "24px", border: "1px solid #334155", height: "100%", boxSizing: "border-box" }}>
            <h2 style={{ fontSize: "24px", margin: "0 0 24px 0", display: "flex", alignItems: "center", gap: "12px" }}>
              <Activity color="#a855f7" /> Live Network Events
            </h2>
            <p style={{ color: "#94a3b8", marginBottom: "24px", fontSize: "14px" }}>
              Contract ID: <code style={{ background: "#0f172a", padding: "4px 8px", borderRadius: "6px", color: "#60a5fa" }}>{CONTRACT_ID.slice(0,8)}...{CONTRACT_ID.slice(-8)}</code>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "400px", overflowY: "auto", paddingRight: "8px" }}>
              <AnimatePresence>
                {!events || events.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "32px", textAlign: "center", color: "#64748b", border: "1px dashed #334155", borderRadius: "12px" }}>
                    <p style={{ margin: 0 }}>Listening for events on the ledger...</p>
                  </motion.div>
                ) : (
                  events.map((e, idx) => (
                    <motion.div 
                      key={e.id || idx} 
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }}
                      style={{ background: "#0f172a", padding: "16px", borderRadius: "12px", borderLeft: "4px solid #8b5cf6" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "bold", color: "#f8fafc", fontSize: "14px" }}>Event Type: {e.type}</span>
                        <span style={{ color: "#64748b", fontSize: "12px" }}>Ledger: {e.ledger}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", wordBreak: "break-all", fontFamily: "monospace" }}>
                        Topic: {JSON.stringify(e.topic)}
                      </p>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default App;
