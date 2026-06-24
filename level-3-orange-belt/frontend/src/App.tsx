import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, CheckCircle, RefreshCcw, ShieldCheck, Play, ArrowRight,
  Loader2, AlertCircle, X, ExternalLink, Lock, Zap, Users
} from 'lucide-react';
import { connectWallet, disconnectWallet } from './services/wallet';
import { createSubscriptionTx } from './services/contract';

// Testnet Native XLM SAC address
const XLM_SAC = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
// Demo merchant address (your own funded testnet address)
const DEMO_MERCHANT = 'GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBWE3RHMXPV2';

interface Sub {
  id: string; name: string; price: string; cycle: string;
  status: 'Active' | 'Canceled'; color: string; txHash?: string;
}

interface NewSubModal {
  name: string; amountXLM: string; cycleLabel: string;
  intervalSecs: bigint; merchant: string;
}

const PLANS: NewSubModal[] = [
  { name: 'AI API Plan',     amountXLM: '10',  cycleLabel: '/ month', intervalSecs: 2592000n, merchant: DEMO_MERCHANT },
  { name: 'SaaS Pro Plan',   amountXLM: '50',  cycleLabel: '/ year',  intervalSecs: 31536000n, merchant: DEMO_MERCHANT },
  { name: 'Custom Billing',  amountXLM: '5',   cycleLabel: '/ week',  intervalSecs: 604800n,  merchant: DEMO_MERCHANT },
];

export default function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'engine'>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<{ id: number; type: string; msg: string }[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [subs, setSubs] = useState<Sub[]>([
    { id: '1', name: 'AI API Plan',  price: '50 USDC', cycle: '/ month', status: 'Active',   color: 'burgundy' },
    { id: '2', name: 'SaaS Pro Plan',price: '120 XLM', cycle: '/ year',  status: 'Canceled', color: 'charcoal' },
  ]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<NewSubModal | null>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'building' | 'signing' | 'submitting' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Auto event ping on engine tab
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'engine') {
        setEvents(prev => [{ id: Date.now(), type: 'Heartbeat', msg: 'RPC polling contract events on Testnet...' }, ...prev].slice(0, 10));
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleConnect = async (walletId: string) => {
    try { setLoading(true); setError(null); await connectWallet(walletId, setAddress); }
    catch (e: any) { setError(e.message || 'Wallet connection failed.'); }
    finally { setLoading(false); }
  };

  const handleDisconnect = async () => { await disconnectWallet(); setAddress(null); };

  const openModal = () => { setShowModal(true); setSelectedPlan(PLANS[0]); setTxStatus('idle'); setTxHash(null); setTxError(null); };
  const closeModal = () => { if (txStatus === 'building' || txStatus === 'signing' || txStatus === 'submitting') return; setShowModal(false); setTxStatus('idle'); };

  const handleCreateSubscription = async () => {
    if (!selectedPlan || !address) return;
    try {
      setTxStatus('building');
      setTxError(null);
      const amountInStroops = BigInt(Math.round(parseFloat(selectedPlan.amountXLM) * 10_000_000));

      setTxStatus('signing');
      const result = await createSubscriptionTx({
        subscriberAddress: address,
        merchantAddress: selectedPlan.merchant,
        tokenAddress: XLM_SAC,
        amount: amountInStroops,
        intervalSeconds: selectedPlan.intervalSecs,
      });

      setTxStatus('submitting');
      setTxHash(result.hash);
      setTxStatus('success');

      // Add to list
      setSubs(prev => [{
        id: result.hash,
        name: selectedPlan.name,
        price: `${selectedPlan.amountXLM} XLM`,
        cycle: selectedPlan.cycleLabel,
        status: 'Active',
        color: 'gold',
        txHash: result.hash,
      }, ...prev]);

      // Emit event
      setEvents(prev => [
        { id: Date.now(), type: 'SubscriptionCreated', msg: `Subscriber authorized ${selectedPlan.amountXLM} XLM ${selectedPlan.cycleLabel} to merchant.` },
        ...prev,
      ].slice(0, 10));

    } catch (e: any) {
      setTxStatus('error');
      setTxError(e.message || 'Transaction failed.');
    }
  };

  const handleSimulateBilling = () => {
    setSimulating(true);
    setTimeout(() => {
      setEvents(prev => [
        { id: Date.now() + 2, type: 'SubscriptionCharged', msg: `Transferred 50 XLM → merchant via contract fn charge().` },
        { id: Date.now() + 1, type: 'ContractInvoke',     msg: `Relayer cron triggered: charge(subscriber, merchant) executed.` },
        { id: Date.now(),     type: 'RetryScheduled',     msg: `Next billing cycle scheduled: +30 days.` },
        ...prev,
      ].slice(0, 10));
      setSimulating(false);
    }, 1200);
  };

  const statusLabel = { building: 'Building transaction...', signing: 'Waiting for Freighter approval...', submitting: 'Submitting to Testnet...', success: '✓ Subscription Created!', error: '✗ Transaction Failed', idle: '' };
  const statusColor = { building: 'text-gold-600', signing: 'text-gold-600', submitting: 'text-gold-600', success: 'text-green-600', error: 'text-red-600', idle: '' };

  return (
    <div className="min-h-screen bg-parchment text-charcoal font-sans selection:bg-gold-400 selection:text-white">
      {/* Nav */}
      <nav className="flex flex-wrap items-center justify-between px-6 md:px-8 py-5 border-b border-charcoal/10 gap-4 sticky top-0 bg-parchment/90 backdrop-blur-md z-40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
          <span className="font-serif text-2xl font-bold">Autopay</span>
          <span className="text-xs font-semibold tracking-widest text-burgundy uppercase mt-1">Protocol</span>
        </div>
        <div className="flex gap-6 text-sm font-medium">
          {(['home','dashboard','engine'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`capitalize hover:text-gold-600 transition-colors ${activeTab === tab ? 'font-bold text-burgundy' : ''}`}>
              {tab === 'engine' ? 'Core Engine' : tab}
            </button>
          ))}
        </div>
        <div>
          {address ? (
            <button onClick={handleDisconnect}
              className="flex items-center gap-2 px-5 py-2.5 bg-burgundy/10 text-burgundy rounded-full hover:bg-burgundy/20 transition-all font-medium text-sm">
              <Wallet size={15} /> {address.slice(0,6)}...{address.slice(-4)}
            </button>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => handleConnect('freighter')} disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-charcoal text-parchment rounded-full hover:bg-charcoal/90 transition-all font-medium text-sm disabled:opacity-50">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />} Freighter
              </button>
              <button onClick={() => handleConnect('metamask')} disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 border border-charcoal rounded-full hover:bg-charcoal/5 transition-all font-medium text-sm disabled:opacity-50">
                MetaMask
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 md:px-8 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800">
            <AlertCircle size={18} /> <p className="font-medium text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto"><X size={16} /></button>
          </div>
        )}

        {/* ── HOME ── */}
        {activeTab === 'home' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Hero */}
            <div className="text-center mt-10 mb-24">
              <div className="inline-block mb-4 px-4 py-1 border border-gold-400 text-gold-600 text-xs font-semibold tracking-widest rounded-full uppercase">
                Built on Stellar · Testnet Live
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight max-w-4xl mx-auto">
                Recurring payments for Web3 without repeated signing.
              </h1>
              <p className="text-xl text-charcoal/65 mb-10 max-w-2xl mx-auto leading-relaxed">
                Let users approve once. Collect recurring stablecoin payments through a secure Stellar-based billing engine built for SaaS, AI agents, and cross-border products.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button onClick={() => setActiveTab('dashboard')}
                  className="px-8 py-4 bg-burgundy text-parchment rounded-full hover:bg-burgundy/90 transition-all font-semibold text-lg shadow-lg">
                  Launch Demo
                </button>
                <button onClick={() => setActiveTab('engine')}
                  className="px-8 py-4 border border-charcoal rounded-full hover:bg-charcoal/5 transition-all font-semibold text-lg flex items-center gap-2">
                  View Core Engine <ArrowRight size={20} />
                </button>
              </div>
            </div>

            {/* How It Works — FOR VIDEO */}
            <div className="mb-24">
              <h2 className="text-4xl font-serif font-bold text-center mb-4">How It Works</h2>
              <p className="text-center text-charcoal/60 mb-14 max-w-xl mx-auto">
                A five-step flow from wallet connection to automated recurring billing — all on-chain.
              </p>
              <div className="relative">
                {/* Connecting line */}
                <div className="absolute left-1/2 top-8 bottom-8 w-px bg-gradient-to-b from-gold-400/80 to-transparent hidden md:block" />
                <div className="space-y-12">
                  {[
                    { step: '01', icon: <Wallet size={24} />, title: 'Connect Wallet', desc: 'User connects their Freighter or MetaMask wallet — no account creation needed.', side: 'left' },
                    { step: '02', icon: <CheckCircle size={24} />, title: 'Choose a Plan', desc: 'Pick a subscription: monthly SaaS, weekly API, or annual billing.', side: 'right' },
                    { step: '03', icon: <Lock size={24} />, title: 'Authorize Once', desc: 'Freighter pops up once. User signs the create_subscription() call on the Soroban contract. That\'s it.', side: 'left' },
                    { step: '04', icon: <Zap size={24} />, title: 'Automated Billing', desc: 'The off-chain relayer cron triggers the charge() function at each billing interval automatically.', side: 'right' },
                    { step: '05', icon: <RefreshCcw size={24} />, title: 'Full Control', desc: 'User can cancel anytime from the dashboard. The contract stops future charges immediately.', side: 'left' },
                  ].map(({ step, icon, title, desc, side }) => (
                    <div key={step} className={`flex items-start gap-6 ${side === 'right' ? 'md:flex-row-reverse' : ''}`}>
                      <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-charcoal text-parchment flex items-center justify-center shadow-lg">
                        {icon}
                      </div>
                      <div className={`flex-1 p-6 bg-white rounded-2xl border border-charcoal/8 shadow-sm max-w-md ${side === 'right' ? 'md:text-right' : ''}`}>
                        <div className="text-xs font-bold text-gold-500 tracking-widest mb-1">STEP {step}</div>
                        <h3 className="text-xl font-serif font-bold mb-2">{title}</h3>
                        <p className="text-charcoal/65 text-sm leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
              {[
                { icon: <ShieldCheck className="w-9 h-9 text-gold-500" />, title: 'One-time authorization', desc: 'Users sign a mandate once — your app bills repeatedly within approved limits.' },
                { icon: <RefreshCcw className="w-9 h-9 text-gold-500" />, title: 'Automated Retries', desc: 'The off-chain relayer retries failed payments without manual intervention.' },
                { icon: <Users className="w-9 h-9 text-gold-500" />, title: 'Full User Control', desc: 'Transparent dashboard to revoke, pause, or view billing history anytime.' },
              ].map(c => (
                <div key={c.title} className="p-8 border border-charcoal/10 rounded-2xl bg-white/60 backdrop-blur-sm hover:shadow-md transition-shadow">
                  {c.icon}
                  <h3 className="text-xl font-serif font-bold mt-4 mb-2">{c.title}</h3>
                  <p className="text-charcoal/65 text-sm leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>

            {/* Contract address proof */}
            <div className="p-6 bg-charcoal text-green-400 rounded-2xl font-mono text-xs">
              <div className="text-white/40 mb-2 text-xs uppercase tracking-widest">Live Testnet Contract</div>
              <div>Contract ID: CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH</div>
              <div className="text-white/40 mt-1">Network: Stellar Testnet · RPC: soroban-testnet.stellar.org</div>
            </div>
          </motion.div>
        )}

        {/* ── DASHBOARD ── */}
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-charcoal/5 max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-between items-center mb-8 pb-6 border-b border-charcoal/10 gap-4">
              <div>
                <h2 className="text-3xl font-serif font-bold">Your Subscriptions</h2>
                {address && <p className="text-sm text-charcoal/50 mt-1">{address.slice(0,8)}...{address.slice(-6)} · Testnet</p>}
              </div>
              {address && (
                <button onClick={openModal}
                  className="px-5 py-2.5 bg-charcoal text-white rounded-xl text-sm font-semibold hover:bg-charcoal/90 transition-colors flex items-center gap-2">
                  + New Subscription
                </button>
              )}
            </div>

            {!address ? (
              <div className="text-center py-20">
                <Wallet className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                <p className="text-xl text-charcoal/50 mb-6">Connect your wallet to manage subscriptions</p>
                <div className="flex justify-center gap-3">
                  <button onClick={() => handleConnect('freighter')} disabled={loading}
                    className="px-6 py-2.5 bg-charcoal text-white rounded-full text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />} Connect Freighter
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {subs.map(sub => (
                  <div key={sub.id}
                    className="flex flex-wrap items-center justify-between p-5 rounded-2xl border border-charcoal/10 hover:border-gold-400/60 hover:shadow-sm transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg
                        ${sub.color === 'burgundy' ? 'bg-burgundy/10 text-burgundy' : sub.color === 'gold' ? 'bg-gold-400/10 text-gold-600' : 'bg-charcoal/5 text-charcoal'}`}>
                        {sub.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold">{sub.name}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-charcoal/50">{sub.status === 'Active' ? 'Next charge: Oct 15, 2026' : 'No future charges'}</p>
                          {sub.txHash && (
                            <a href={`https://stellar.expert/explorer/testnet/tx/${sub.txHash}`} target="_blank" rel="noreferrer"
                              className="text-xs text-gold-600 flex items-center gap-0.5 hover:underline">
                              <ExternalLink size={11} /> tx
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${sub.status === 'Active' ? 'text-charcoal' : 'text-charcoal/40'}`}>
                        {sub.price} <span className="text-xs font-normal opacity-60">{sub.cycle}</span>
                      </p>
                      <span className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold rounded-full
                        ${sub.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── CORE ENGINE ── */}
        {activeTab === 'engine' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-4">The Core Engine</h2>
              <p className="text-charcoal/65 mb-6 leading-relaxed">
                The Autopay smart contract on Soroban tracks pre-authorized allowances and billing schedules entirely on-chain. An off-chain relayer cron calls <code className="font-mono text-sm bg-charcoal/5 px-1.5 py-0.5 rounded">charge()</code> at each interval.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  'create_subscription() — signed once by user',
                  'charge() — called by relayer every interval',
                  'cancel() — user revokes anytime',
                  'get_subscription() — read subscription state',
                ].map(fn => (
                  <div key={fn} className="flex items-center gap-3 p-3 bg-charcoal/3 rounded-lg border border-charcoal/8">
                    <CheckCircle className="text-gold-500 w-4 h-4 flex-shrink-0" />
                    <code className="font-mono text-sm text-charcoal">{fn}</code>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-charcoal/5 rounded-xl border border-charcoal/10 mb-6 text-xs font-mono text-charcoal/70">
                <div className="font-bold text-charcoal mb-1">Contract Address</div>
                <div className="break-all">CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH</div>
              </div>

              <button onClick={handleSimulateBilling} disabled={simulating}
                className="px-6 py-3 bg-charcoal text-parchment rounded-xl flex items-center gap-2 hover:bg-charcoal/90 transition-colors disabled:opacity-50 font-semibold">
                {simulating ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                Simulate Billing Run
              </button>
            </div>

            {/* Live Event Stream */}
            <div className="bg-charcoal text-green-400 p-5 rounded-2xl font-mono text-sm shadow-2xl flex flex-col h-[460px]">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <span className="text-white/40 uppercase tracking-widest font-bold text-xs">Event Stream · Testnet</span>
                <span className="flex items-center gap-1.5 text-white/40 text-xs">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {events.length === 0 && (
                  <div className="text-white/25 text-center mt-12 text-xs">
                    Click "Simulate Billing Run" or switch to Core Engine tab to start the live listener.
                  </div>
                )}
                {events.map(ev => (
                  <div key={ev.id} className="border-l-2 border-green-500 pl-3">
                    <div className="text-white/40 text-xs mb-0.5">[{new Date(ev.id).toLocaleTimeString()}] {ev.type}</div>
                    <div className="text-green-300 text-xs leading-relaxed">{ev.msg}</div>
                  </div>
                ))}
                <div className="border-l-2 border-white/15 pl-3 opacity-40">
                  <div className="text-white/40 text-xs mb-0.5">[historical] SubscriptionCreated</div>
                  <div className="text-xs">Subscriber G... → Merchant G... · 10 XLM / month</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* ── NEW SUBSCRIPTION MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <motion.div className="bg-parchment rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}>
              
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-charcoal/10">
                <h3 className="text-2xl font-serif font-bold">New Subscription</h3>
                {txStatus !== 'building' && txStatus !== 'signing' && txStatus !== 'submitting' && (
                  <button onClick={closeModal} className="text-charcoal/40 hover:text-charcoal transition-colors"><X size={22} /></button>
                )}
              </div>

              <div className="px-8 py-6">
                {txStatus === 'success' ? (
                  /* Success State */
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-green-600 w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-serif font-bold mb-2">Subscription Created!</h4>
                    <p className="text-charcoal/60 text-sm mb-4">Your subscription is now active on Stellar Testnet.</p>
                    {txHash && (
                      <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-gold-600 text-sm font-medium hover:underline">
                        View transaction <ExternalLink size={14} />
                      </a>
                    )}
                    <button onClick={closeModal}
                      className="mt-6 w-full py-3 bg-charcoal text-white rounded-xl font-semibold hover:bg-charcoal/90">
                      Done
                    </button>
                  </div>
                ) : (
                  /* Plan Selection + Pay */
                  <>
                    <div className="mb-6">
                      <label className="text-xs font-bold uppercase tracking-widest text-charcoal/50 mb-3 block">Select Plan</label>
                      <div className="space-y-2.5">
                        {PLANS.map(plan => (
                          <label key={plan.name}
                            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                              ${selectedPlan?.name === plan.name ? 'border-burgundy bg-burgundy/5' : 'border-charcoal/10 hover:border-charcoal/30'}`}>
                            <input type="radio" name="plan" checked={selectedPlan?.name === plan.name}
                              onChange={() => setSelectedPlan(plan)} className="accent-burgundy w-4 h-4" />
                            <div className="flex-1">
                              <div className="font-bold text-sm">{plan.name}</div>
                              <div className="text-xs text-charcoal/50">Every {plan.cycleLabel.replace('/ ', '')}</div>
                            </div>
                            <div className="font-bold text-charcoal">{plan.amountXLM} XLM</div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Info box */}
                    <div className="p-4 bg-charcoal/4 rounded-xl border border-charcoal/8 mb-6 text-xs text-charcoal/60 space-y-1">
                      <div className="flex justify-between"><span>Token</span><span className="font-mono">XLM (Native SAC)</span></div>
                      <div className="flex justify-between"><span>Network</span><span className="font-mono">Stellar Testnet</span></div>
                      <div className="flex justify-between"><span>Contract</span><span className="font-mono">CC2U...BTDH</span></div>
                      <div className="flex justify-between"><span>Action</span><span className="font-mono">create_subscription()</span></div>
                    </div>

                    {/* Error */}
                    {txStatus === 'error' && txError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex gap-2">
                        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> {txError}
                      </div>
                    )}

                    {/* Status */}
                    {txStatus !== 'idle' && txStatus !== 'error' && (
                      <div className={`mb-4 text-sm font-medium flex items-center gap-2 ${statusColor[txStatus]}`}>
                        <Loader2 size={16} className="animate-spin" /> {statusLabel[txStatus]}
                      </div>
                    )}

                    <button
                      onClick={handleCreateSubscription}
                      disabled={txStatus !== 'idle' && txStatus !== 'error'}
                      className="w-full py-3.5 bg-burgundy text-white rounded-xl font-bold text-base hover:bg-burgundy/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                      {(txStatus === 'building' || txStatus === 'signing' || txStatus === 'submitting')
                        ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
                        : <><Wallet size={18} /> Authorize & Subscribe with Freighter</>}
                    </button>
                    <p className="text-center text-xs text-charcoal/40 mt-3">Freighter will open to approve the transaction on Stellar Testnet.</p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
