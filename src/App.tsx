/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { simulateScenario, validateIdea } from './lib/gemini';
import { motion } from 'motion/react';
import { Zap, ShieldCheck, ArrowLeft, Loader2, Copy, Share2, Check, AlertCircle, Clock, Database, Code, Play, Globe, Activity, Cpu, LogOut, Wallet as WalletIcon, ChevronDown, ExternalLink, X, ArrowRight } from 'lucide-react';
import { WalletProviders, useAppConnection } from './components/WalletProviders';
import { LandingPage } from './components/LandingPage';
import { useDisconnect, useAccount, useChainId, useSwitchChain, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { NETWORKS } from './networks';
import { parseEther } from 'viem';

const NetworkStatusDot = ({ isConnected, currentChainId, targetNetworkName }: { isConnected: boolean, currentChainId: number | null, targetNetworkName: string }) => {
  const targetNetwork = (NETWORKS as any)[targetNetworkName];
  
  if (!targetNetwork?.active) return null;

  const isCorrectNetwork = isConnected && currentChainId === targetNetwork?.chainId;
  
  const color = !isConnected
    ? '#8888AA'
    : isCorrectNetwork
    ? '#00E5CC'
    : '#F4A261';

  const tooltip = !isConnected
    ? 'Wallet not connected'
    : isCorrectNetwork
    ? 'Connected to correct network'
    : 'Wrong network — please switch';

  return (
    <div 
      className={`inline-flex w-2 h-2 rounded-full transition-all duration-300 ${isCorrectNetwork ? 'dot-pulse' : ''}`}
      style={{ backgroundColor: color }}
      title={tooltip}
    />
  );
};

const NetworkInfoBox = ({ networkName }: { networkName: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const network = (NETWORKS as any)[networkName];
  if (!network) return null;

  return (
    <div className="mt-2 border border-rialo-primary/30 rounded-lg bg-rialo-bg/50 overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-1.5 flex items-center justify-between text-[10px] font-bold text-rialo-primary uppercase tracking-wider hover:bg-rialo-primary/5 transition-colors"
      >
        <span className="flex items-center">
          <AlertCircle className="w-3 h-3 mr-1.5" />
          Network Details
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 text-[12px] text-rialo-text-sec border-t border-rialo-primary/10">
          <p className="leading-tight">To use this network, add it manually to your wallet using these details:</p>
          <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 font-mono">
            <span className="opacity-60">Chain ID:</span>
            <span className="text-rialo-text">{network.chainId} (0x{network.chainId.toString(16)})</span>
            <span className="opacity-60">RPC URL:</span>
            <span className="text-rialo-text break-all">{network.rpc}</span>
            <span className="opacity-60">Symbol:</span>
            <span className="text-rialo-text">{network.symbol}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const ExplorerButton = ({ networkName }: { networkName: string }) => {
  if (networkName === 'Rialo Mainnet') {
    return (
      <div className="mt-4">
        <button
          disabled
          className="w-full sm:w-auto border border-gray-500/30 text-gray-500 text-[13px] font-medium py-2 px-4 rounded-lg cursor-default opacity-50"
        >
          Explorer not available yet
        </button>
      </div>
    );
  }

  if (networkName === 'Rialo Testnet') {
    return (
      <div className="mt-4 space-y-2">
        <button
          onClick={() => window.open('https://sepolia.etherscan.io', '_blank')}
          className="w-full sm:w-auto border border-[#00E5CC] text-[#00E5CC] hover:bg-[#00E5CC] hover:text-[#0A0A0F] text-[13px] font-medium py-2 px-4 rounded-lg transition-all"
        >
          View on Explorer →
        </button>
        <p className="text-[#141414] text-[11px]">
          Transactions on Rialo Testnet are visible on the Sepolia block explorer
        </p>
      </div>
    );
  }

  return null;
};

const TickerBar = () => {
  const items = [
    'ORACLE-FREE FEEDS', 'SUB-SECOND FINALITY', 'REAL-WORLD REACTIVE', 
    'BUILT BY MYSTIQUEMIDE', 'POWERED BY RIALO', 'AI-POWERED SIMULATION', 'CIPHER RUN'
  ];
  const doubledItems = [...items, ...items];

  return (
    <div className="w-full bg-[#080810] border-b border-white/4 h-9 overflow-hidden flex items-center relative z-[900]">
      <div className="flex whitespace-nowrap animate-ticker">
        {doubledItems.map((item, i) => (
          <div key={i} className="flex items-center gap-10 px-5">
            <span className="font-mono text-[11px] text-white/30 tracking-[0.1em] uppercase">
              {item}
            </span>
            <span className="text-[#00E5CC] text-[11px]"></span>
          </div>
        ))}
      </div>
    </div>
  );
};

function AppContent() {
  const { isConnected, address, type } = useAppConnection();
  const { disconnect: evmDisconnect } = useDisconnect();
  const { disconnect: solanaDisconnect } = useWallet();
  const { openConnectModal } = useConnectModal();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { sendTransaction, data: hash, error: sendError, reset: resetSend } = useSendTransaction();
  const { isLoading: isWaiting, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });
  
  const [activeView, setActiveView] = useState<'home' | 'validator' | 'simulator'>('home');
  const [validationData, setValidationData] = useState({
    idea_title: '',
    description: '',
    domain: '',
    data_sources: '',
    desired_outcome: ''
  });
  const [scenario, setScenario] = useState({
    trigger_event: '',
    data_feed: '',
    condition_logic: '',
    outcome: '',
    network: 'Rialo Testnet'
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txErrorMessage, setTxErrorMessage] = useState<string | null>(null);
  const [confirmationType, setConfirmationType] = useState<'scenario' | 'idea' | null>(null);

  const getCurrentChainId = async () => {
    if (!window.ethereum) return null;
    try {
      const chainId = await (window.ethereum as any).request({ method: 'eth_chainId' });
      return parseInt(chainId, 16);
    } catch (err) {
      console.error('Error getting chain ID:', err);
      return null;
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      getCurrentChainId().then(id => setCurrentChainId(id));

      const handleChainChanged = (chainId: string) => {
        setCurrentChainId(parseInt(chainId, 16));
      };

      (window.ethereum as any).on('chainChanged', handleChainChanged);
      return () => {
        (window.ethereum as any).removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const switchNetwork = async (networkName: string) => {
    const network = (NETWORKS as any)[networkName];
    if (!network || !window.ethereum || !isConnected) return;

    console.log('Switching to network:', networkName, 'chainId:', network.chainId);

    try {
      await (window.ethereum as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }]
      });
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await (window.ethereum as any).request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${network.chainId.toString(16)}`,
              chainName: network.displayName,
              rpcUrls: [network.rpc],
              nativeCurrency: { name: network.symbol, symbol: network.symbol, decimals: 18 },
              blockExplorerUrls: [network.explorer]
            }]
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      }
    }
  };

  const handleSimulateIdea = async () => {
    const { idea_title, description } = validationData;
    if (!idea_title.trim() || !description.trim()) return;

    // 1. CHECK WALLET
    if (!isConnected) {
      setError('Please connect your wallet to validate on-chain');
      return;
    }

    // 2. CHECK NETWORK (Sepolia: 11155111)
    if (type === 'EVM' && chainId !== 11155111) {
      try {
        switchChain({ chainId: 11155111 });
        return; // Wait for network switch
      } catch (err) {
        setError('Failed to switch to Sepolia network. Please switch manually.');
        return;
      }
    }

    // 3. SHOW CONFIRMATION MODAL
    setConfirmationType('idea');
    setShowConfirmModal(true);
    setTxStatus('idle');
    setTxErrorMessage(null);
    setTxHash(null);
  };

  const handleSimulateScenario = async () => {
    const { trigger_event, data_feed, condition_logic, outcome } = scenario;
    if (!trigger_event || !data_feed || !condition_logic || !outcome) return;

    // 1. CHECK WALLET
    if (!isConnected) {
      setError('Please connect your wallet to simulate on-chain');
      return;
    }

    // 2. CHECK NETWORK (Sepolia: 11155111)
    if (type === 'EVM' && chainId !== 11155111) {
      try {
        switchChain({ chainId: 11155111 });
        return; // Wait for network switch
      } catch (err) {
        setError('Failed to switch to Sepolia network. Please switch manually.');
        return;
      }
    }

    // 3. SHOW CONFIRMATION MODAL
    setConfirmationType('scenario');
    setShowConfirmModal(true);
    setTxStatus('idle');
    setTxErrorMessage(null);
    setTxHash(null);
  };

  const executeValidation = async (confirmedHash: string) => {
    setIsSimulating(true);
    setResult(null);
    setError(null);

    try {
      const data = await validateIdea(
        validationData.idea_title,
        validationData.description,
        validationData.domain,
        validationData.data_sources,
        validationData.desired_outcome
      );
      setResult({ ...data, txHash: confirmedHash });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Validation failed. Rialo is still being tested — try again in a moment.');
    } finally {
      setIsSimulating(false);
    }
  };

  const executeSimulation = async (confirmedHash: string) => {
    setIsSimulating(true);
    setResult(null);
    setError(null);

    try {
      const data = await simulateScenario(
        scenario.trigger_event,
        scenario.data_feed,
        scenario.condition_logic,
        scenario.outcome,
        scenario.network,
        confirmedHash
      );

      setResult({ ...data, selected_network: scenario.network, txHash: confirmedHash });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Simulation failed. Rialo is still being tested — try again in a moment.');
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    if (isConfirmed && hash && showConfirmModal) {
      setShowConfirmModal(false);
      setTxHash(hash);
      if (confirmationType === 'scenario') {
        executeSimulation(hash);
      } else if (confirmationType === 'idea') {
        executeValidation(hash);
      }
    }
  }, [isConfirmed, hash, confirmationType]);

  useEffect(() => {
    if (sendError && showConfirmModal) {
      setTxStatus('error');
      if (sendError.message.includes('User rejected')) {
        setTxErrorMessage('Transaction rejected. Simulation cancelled.');
      } else {
        setTxErrorMessage('Transaction failed on Rialo Testnet. Please check your test ETH balance.');
      }
    }
  }, [sendError]);

  const handleConfirmTx = async () => {
    setTxStatus('pending');
    try {
      const label = confirmationType === 'scenario' ? 'RialoSim' : 'RialoVal';
      const value = confirmationType === 'scenario' ? scenario.trigger_event : validationData.idea_title;
      
      sendTransaction({
        to: address as `0x${string}`,
        value: 0n,
        data: '0x' + Buffer.from(`${label}:${value.slice(0, 20)}`).toString('hex')
      });
      
      // Set a timeout for 30 seconds
      setTimeout(() => {
        if (txStatus === 'pending' && !hash) {
          setTxStatus('error');
          setTxErrorMessage('Network is slow. Please try again.');
        }
      }, 30000);
    } catch (err) {
      setTxStatus('error');
      setTxErrorMessage('Transaction failed. Please try again.');
    }
  };

  const resetSimulator = () => {
    setError(null);
    setIsSimulating(false);
  };

  const handleCopy = () => {
    if (result?.tweet_draft) {
      navigator.clipboard.writeText(result.tweet_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (result?.tweet_draft) {
      const text = encodeURIComponent(result.tweet_draft);
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }
  };

  const handleDisconnect = () => {
    if (type === 'EVM') {
      evmDisconnect();
    } else {
      solanaDisconnect();
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-[1000] h-[64px] bg-black/80 backdrop-blur-[20px] border-b border-white/6">
        <div className="max-w-[1200px] mx-auto px-[24px] h-full flex items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center cursor-pointer" onClick={() => setActiveView('home')}>
            <img 
              src="https://cdn.prod.website-files.com/6883572e6ebf68cfe676dd65/6883572e6ebf68cfe676dd82_rialo-logo.svg" 
              alt="Rialo Logo" 
              className="h-[28px] w-auto"
              referrerPolicy="no-referrer"
            />
            <div className="w-[1px] h-[20px] bg-white/10 mx-[16px]" />
            <span className="font-heading font-semibold text-[16px] text-[#CAC5B9]">
              Cipher Run
            </span>
          </div>

          {/* Right Side */}
          <div className="flex items-center">
            <span className="font-sans text-[11px] text-white/30 mr-[20px] hidden md:block">
              Built by MystiqueMide
            </span>
            
            {isConnected ? (
              <div className="bg-[#00E5CC]/8 border border-[#00E5CC]/30 text-[#00E5CC] font-sans text-[13px] px-[20px] py-[8px] rounded-full flex items-center gap-2">
                <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <button 
                  onClick={handleDisconnect}
                  className="hover:text-white transition-colors"
                  title="Disconnect"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={openConnectModal}
                className="border border-[#00E5CC]/40 bg-transparent text-[#00E5CC] font-sans text-[13px] px-[20px] py-[8px] rounded-full hover:bg-[#00E5CC]/10 transition-all duration-200"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-[64px] flex-1 flex flex-col">
        <TickerBar />
        
        <motion.div
          key={activeView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          {!isConnected ? (
            <LandingPage />
          ) : (
            <>
              {/* Noise Overlay */}
              <div className="bg-noise"></div>

              {/* Main Content */}
              <main className="flex-1 relative flex flex-col items-center pb-12 px-4 sm:px-6 lg:px-8">
            {/* Animated Background Mesh */}
            <div className="bg-mesh">
              <div className="blob-1"></div>
              <div className="blob-2"></div>
            </div>

            <div className="max-w-4xl w-full z-10">
              {activeView === 'home' ? (
                <div className="flex flex-col items-center w-full">
                  {/* Hero Section */}
                  <section className="relative w-full min-h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-black bg-dot-grid">
                    {/* Teal Glow Blob */}
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
                      style={{ background: 'radial-gradient(ellipse, rgba(0,229,204,0.07) 0%, transparent 70%)' }}
                    />

                    <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                      <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="text-[36px] md:text-[80px] font-extrabold text-[#CAC5B9] tracking-[-0.03em] font-heading leading-tight"
                      >
                        Cipher Run
                      </motion.h1>

                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                    className="bg-[#0C0C14] border border-white/8 rounded-xl p-6 md:p-8 font-mono text-sm text-left max-w-[420px] mx-auto shadow-2xl"
                  >
                    <div className="space-y-1">
                      <div><span className="text-white">cipher</span><span className="text-white/20">.</span><span className="text-white">init</span><span className="text-white/20">({'{'}</span></div>
                      <div className="pl-4"><span className="text-[#00E5CC]">mode</span><span className="text-white/20">:</span> <span className="text-white/60">"simulation"</span><span className="text-white/20">,</span></div>
                      <div className="pl-4"><span className="text-[#00E5CC]">network</span><span className="text-white/20">:</span> <span className="text-white/60">"rialo-testnet"</span><span className="text-white/20">,</span></div>
                      <div className="pl-4"><span className="text-[#00E5CC]">oracle</span><span className="text-white/20">:</span> <span className="text-white/60">"reactive"</span></div>
                      <div><span className="text-white/20">{'}'})</span></div>
                      <div><span className="text-white">scenario</span><span className="text-white/20">.</span><span className="text-white">build</span><span className="text-white/20">(</span><span className="text-white/60">"real-world"</span><span className="text-white/20">)</span></div>
                      <div><span className="text-white">idea</span><span className="text-white/20">.</span><span className="text-white">validate</span><span className="text-white/20">(</span><span className="text-white/60">"feasibility: true"</span><span className="text-white/20">)</span></div>
                      <div className="flex items-center">
                        <span className="text-white">share</span><span className="text-white/20">.</span><span className="text-white">output</span><span className="text-white/20">(</span><span className="text-white/60">"to-CT"</span><span className="text-white/20">)</span>
                        <div className="w-[2px] h-4 bg-[#00E5CC] ml-1 cursor-blink"></div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.p 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.35 }}
                    className="text-white/50 text-[17px] max-w-[500px] mx-auto leading-[1.7] font-body"
                  >
                    Simulate real-world scenarios on Rialo. Validate your ideas with AI. Share your alpha.
                  </motion.p>

                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
                  >
                    <button 
                      onClick={() => setActiveView('simulator')}
                      className="w-full sm:w-auto bg-[#00E5CC] hover:bg-[#00FFE0] text-black font-bold text-sm py-3.5 px-8 rounded-full transition-all duration-200 hover:-translate-y-0.5 shadow-[0_8px_30px_rgba(0,229,204,0.25)] font-heading"
                    >
                      Build a Scenario
                    </button>
                    <button 
                      onClick={() => setActiveView('validator')}
                      className="w-full sm:w-auto bg-transparent border border-white/20 hover:border-white/50 text-white font-bold text-sm py-3.5 px-8 rounded-full transition-all duration-200 hover:-translate-y-0.5 font-heading"
                    >
                      Validate an Idea
                    </button>
                  </motion.div>
                </div>
              </section>

              {/* Stats Bar */}
              <motion.section 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.65 }}
                className="w-full bg-white/[0.02] border-y border-white/6 py-10 px-6"
              >
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
                  {[
                    { num: '< 500ms', label: 'Oracle Latency' },
                    { num: '12/12', label: 'Oracle Nodes' },
                    { num: '100%', label: 'AI Powered' },
                    { num: 'Free', label: 'To Use' }
                  ].map((stat, i) => (
                    <div key={i} className={`flex flex-col items-center text-center ${i % 2 === 0 ? 'border-r border-white/6 md:border-r' : 'md:border-r'} ${i === 3 ? 'md:border-r-0' : ''}`}>
                      <span className="text-2xl md:text-4xl font-bold text-white font-heading">{stat.num}</span>
                      <span className="text-[10px] md:text-[12px] text-white/35 font-medium uppercase tracking-[0.1em] mt-2 font-body">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* Feature Cards */}
              <section className="w-full max-w-[1000px] mx-auto py-20 px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.8 }}
                  onClick={() => setActiveView('simulator')}
                  className="group relative bg-[#0C0C14] border border-white/6 rounded-2xl p-10 cursor-pointer transition-all duration-300 hover:border-[#00E5CC]/25 hover:shadow-[0_0_40px_rgba(0,229,204,0.05)] hover:-translate-y-1"
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00E5CC] rounded-t-2xl" />
                  <Zap className="w-8 h-8 text-[#00E5CC]" />
                  <h3 className="text-2xl font-bold text-white mt-5 font-heading">Scenario Builder</h3>
                  <p className="text-white/45 text-sm leading-[1.7] mt-3 font-body">
                    Visualize how Rialo handles real-world triggers. Configure oracle feeds, set conditions, and simulate execution in seconds.
                  </p>
                  <div className="mt-8 flex items-center text-[#00E5CC] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.9 }}
                  onClick={() => setActiveView('validator')}
                  className="group relative bg-[#0C0C14] border border-white/6 rounded-2xl p-10 cursor-pointer transition-all duration-300 hover:border-[#00E5CC]/25 hover:shadow-[0_0_40px_rgba(0,229,204,0.05)] hover:-translate-y-1"
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00E5CC] rounded-t-2xl" />
                  <ShieldCheck className="w-8 h-8 text-[#00E5CC]" />
                  <h3 className="text-2xl font-bold text-white mt-5 font-heading">Idea Validator</h3>
                  <p className="text-white/45 text-sm leading-[1.7] mt-3 font-body">
                    Submit your Rialo use case idea and receive an AI-powered feasibility report. Score, requirements, edge cases, and a tweetable summary.
                  </p>
                  <div className="mt-8 flex items-center text-[#00E5CC] transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </motion.div>
              </section>
            </div>
          ) : activeView === 'simulator' ? (
            <div className="flex flex-col items-center w-full min-h-screen bg-black bg-dot-grid pt-8 pb-20 px-4">
              <div className="max-w-6xl w-full space-y-12">
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-white/30 font-body">
                    <button onClick={() => setActiveView('home')} className="hover:text-[#00E5CC] transition-colors">Home</button>
                    <span>&gt;</span>
                    <span className="text-white/60">Scenario Builder</span>
                  </div>
                  <h1 className="text-4xl md:text-[48px] font-extrabold text-[#CAC5B9] tracking-[-0.02em] font-heading">Scenario Builder</h1>
                  <p className="text-white/45 text-base max-w-[500px] leading-relaxed font-body">
                    Define a real-world trigger and simulate Rialo's reactive execution in a secure, sandbox environment.
                  </p>
                  <div className="w-12 h-[3px] bg-[#00E5CC] rounded-full mt-6" />
                </div>

                {error ? (
                  <div className="bg-[#0C0C14] border border-white/6 rounded-2xl p-10 text-center space-y-6 max-w-[680px] mx-auto">
                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-white/80 font-medium font-body">{error}</p>
                    <button
                      onClick={resetSimulator}
                      className="bg-[#00E5CC] hover:bg-[#00FFE0] text-black font-bold py-3 px-8 rounded-full transition-all font-heading"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Form Card */}
                    <div className="lg:col-span-5 w-full">
                      <div className="relative bg-[#0C0C14] border border-white/6 rounded-2xl p-5 md:p-10 shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00E5CC] rounded-t-2xl" />
                        <h3 className="text-lg font-bold text-white mb-8 font-heading">Configure Scenario</h3>
                        
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-[0.08em] font-body flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5" /> Trigger Event
                            </label>
                            <input
                              type="text"
                              className="w-full bg-[#080810] border border-white/8 rounded-lg px-4 py-3 text-sm text-[#CAC5B9] placeholder-white/20 focus:outline-none focus:border-[#00E5CC]/50 focus:ring-[3px] focus:ring-[#00E5CC]/8 transition-all font-body"
                              placeholder="e.g. BTC > $100k"
                              value={scenario.trigger_event}
                              onChange={(e) => setScenario({ ...scenario, trigger_event: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-[0.08em] font-body flex items-center gap-2">
                              <Database className="w-3.5 h-3.5" /> Data Feed
                            </label>
                            <input
                              type="text"
                              className="w-full bg-[#080810] border border-white/8 rounded-lg px-4 py-3 text-sm text-[#CAC5B9] placeholder-white/20 focus:outline-none focus:border-[#00E5CC]/50 focus:ring-[3px] focus:ring-[#00E5CC]/8 transition-all font-body"
                              placeholder="e.g. Binance Spot"
                              value={scenario.data_feed}
                              onChange={(e) => setScenario({ ...scenario, data_feed: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-[0.08em] font-body flex items-center gap-2">
                              <Code className="w-3.5 h-3.5" /> Condition Logic
                            </label>
                            <input
                              type="text"
                              className="w-full bg-[#080810] border border-white/8 rounded-lg px-4 py-3 text-sm text-[#CAC5B9] placeholder-white/20 focus:outline-none focus:border-[#00E5CC]/50 focus:ring-[3px] focus:ring-[#00E5CC]/8 transition-all font-body"
                              placeholder="e.g. If trigger == true"
                              value={scenario.condition_logic}
                              onChange={(e) => setScenario({ ...scenario, condition_logic: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-[0.08em] font-body flex items-center gap-2">
                              <Play className="w-3.5 h-3.5" /> Expected Outcome
                            </label>
                            <input
                              type="text"
                              className="w-full bg-[#080810] border border-white/8 rounded-lg px-4 py-3 text-sm text-[#CAC5B9] placeholder-white/20 focus:outline-none focus:border-[#00E5CC]/50 focus:ring-[3px] focus:ring-[#00E5CC]/8 transition-all font-body"
                              placeholder="e.g. Buy 1 ETH"
                              value={scenario.outcome}
                              onChange={(e) => setScenario({ ...scenario, outcome: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-[0.08em] font-body flex items-center gap-2">
                              <Globe className="w-3.5 h-3.5" />
                              <NetworkStatusDot isConnected={isConnected} currentChainId={currentChainId} targetNetworkName={scenario.network} />
                              Network
                              {scenario.network === 'Rialo Mainnet' && (
                                <span className="ml-2 px-2.5 py-1 rounded-full bg-[#F4A261]/10 text-[#F4A261] text-[11px] font-medium border border-[#F4A261]/30">
                                  COMING SOON
                                </span>
                              )}
                            </label>
                            <select
                              className="w-full bg-[#080810] border border-white/8 rounded-lg px-4 py-3 text-sm text-[#CAC5B9] focus:outline-none focus:border-[#00E5CC]/50 focus:ring-[3px] focus:ring-[#00E5CC]/8 transition-all custom-select font-body"
                              value={scenario.network}
                              onChange={(e) => {
                                const newNetwork = e.target.value;
                                setScenario({ ...scenario, network: newNetwork });
                                switchNetwork(newNetwork);
                                getCurrentChainId().then(id => setCurrentChainId(id));
                              }}
                            >
                              <option className="bg-[#0C0C14]">Rialo Testnet</option>
                              <option className="bg-[#0C0C14]">Rialo Mainnet</option>
                            </select>
                            <NetworkInfoBox networkName={scenario.network} />
                            {scenario.network === 'Rialo Testnet' && (
                              <div className="mt-2">
                                <a 
                                  href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[12px] text-white/30 hover:text-[#00E5CC] transition-colors flex items-center font-body"
                                >
                                  <span className="mr-1">💧</span>
                                  Need test ETH? Get free ETH from the faucet →
                                </a>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={handleSimulateScenario}
                            disabled={isSimulating || !scenario.trigger_event || !scenario.data_feed || !scenario.condition_logic || !scenario.outcome || scenario.network === 'Rialo Mainnet'}
                            className={`w-full font-bold py-4 rounded-full transition-all flex items-center justify-center mt-8 font-heading tracking-wider text-sm ${
                              scenario.network === 'Rialo Mainnet' 
                                ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                                : isSimulating 
                                  ? 'bg-[#00E5CC]/30 text-black/40 cursor-not-allowed' 
                                  : 'bg-[#00E5CC] hover:bg-[#00FFE0] text-black hover:-translate-y-0.5 shadow-[0_8px_30px_rgba(0,229,204,0.25)]'
                            }`}
                          >
                            {isSimulating ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                SIMULATING...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-2" />
                                SIMULATE
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Results Display */}
                    <div className="lg:col-span-7 flex justify-center">
                      {result ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="w-full max-w-[680px] bg-[#0C0C14] border border-[#00E5CC]/20 rounded-[16px] overflow-hidden shadow-2xl"
                        >
                          {/* Results Header Bar */}
                          <div className="bg-[#00E5CC]/[0.06] border-b border-[#00E5CC]/15 px-6 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-2 h-2 bg-[#00E5CC] rounded-full dot-pulse" />
                              <span className="font-mono text-[11px] font-semibold text-[#00E5CC] tracking-[0.15em] uppercase">
                                Simulation Complete
                              </span>
                            </div>
                            <span className="font-sans text-[11px] text-white/30">
                              {new Date(result.trigger_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>

                          {/* Stat Boxes Grid */}
                          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                              { label: 'Trigger Time', value: new Date(result.trigger_timestamp).toLocaleDateString() },
                              { 
                                label: 'Oracles', 
                                value: `${result.oracle_confirmation_count}/12`,
                                extra: (
                                  <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(result.oracle_confirmation_count / 12) * 100}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut" }}
                                      className="bg-[#00E5CC] h-full rounded-full"
                                    />
                                  </div>
                                )
                              },
                              { 
                                label: 'Latency', 
                                value: `${result.latency_ms}ms`,
                                extra: (
                                  <div className="flex items-center mt-2">
                                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                      result.latency_ms < 500 ? 'bg-[#00E5CC]' : 
                                      result.latency_ms <= 1000 ? 'bg-[#F4A261]' : 'bg-[#E63946]'
                                    }`} />
                                  </div>
                                )
                              },
                              { label: 'Gas Est.', value: `${result.gas_estimate_eth} ETH` },
                              { label: 'Network', value: result.selected_network },
                              { 
                                label: 'Status', 
                                value: (
                                  <span className={`px-3 py-1 rounded-full text-[12px] font-semibold font-sans border ${
                                    result.outcome_status === 'EXECUTED' ? 'bg-[#00E5CC]/10 border-[#00E5CC]/30 text-[#00E5CC]' :
                                    result.outcome_status === 'PENDING' ? 'bg-[#F4A261]/10 border-[#F4A261]/30 text-[#F4A261]' :
                                    'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]'
                                  }`}>
                                    {result.outcome_status}
                                  </span>
                                )
                              }
                            ].map((stat, i) => (
                              <motion.div 
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 + (i * 0.08) }}
                                className="bg-[#080810] border border-white/5 rounded-[10px] p-4 transition-colors hover:border-[#00E5CC]/20"
                              >
                                <div className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] mb-2">{stat.label}</div>
                                <div className="font-mono text-[18px] font-semibold text-white">{stat.value}</div>
                                {stat.extra}
                              </motion.div>
                            ))}

                            {/* TX Hash Row */}
                            {result.txHash && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 + (6 * 0.08) }}
                                className="col-span-2 sm:col-span-3"
                              >
                                <a 
                                  href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex items-center justify-between p-4 bg-[#080810] border border-white/5 rounded-[10px] transition-all hover:bg-[#00E5CC]/[0.05] hover:border-[#00E5CC]/20"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] mb-1">TX Hash</span>
                                    <span className="font-mono text-[13px] text-[#00E5CC]">
                                      {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}
                                    </span>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-[#00E5CC]/50 group-hover:text-[#00E5CC] transition-colors" />
                                </a>
                              </motion.div>
                            )}
                          </div>

                          {/* Execution Narrative Section */}
                          <div className="px-6 pb-6">
                            <div className="bg-[#080810] border border-white/5 rounded-[10px] p-6">
                              <div className="font-mono text-[10px] text-white/30 uppercase tracking-[0.15em] mb-3">Execution Narrative</div>
                              <p className="font-sans text-[13px] text-white/70 leading-[1.6]">
                                {result.narrative}
                              </p>
                            </div>
                          </div>

                          {/* Explorer Button */}
                          <div className="px-6 pb-6 flex justify-center">
                            <button
                              onClick={() => window.open(scenario.network === 'Rialo Testnet' ? `https://sepolia.etherscan.io/tx/${result.txHash}` : '#', '_blank')}
                              className="border border-[#00E5CC]/30 text-[#00E5CC] hover:bg-[#00E5CC]/[0.08] text-[13px] font-medium py-2 px-5 rounded-full transition-all hover:-translate-y-0.5 font-sans"
                            >
                              View on Explorer
                            </button>
                          </div>

                          {/* Share Buttons Row */}
                          <div className="border-t border-white/5 p-6 space-y-4">
                            <div className="space-y-2">
                              <div className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em]">Tweet Draft</div>
                              <div className="bg-[#080810] border border-white/5 rounded-[10px] p-4 font-sans text-sm text-white/70 leading-[1.6]">
                                {result.tweet_draft}
                              </div>
                            </div>
                            <div className="flex gap-3 flex-col sm:flex-row">
                              <button
                                onClick={handleCopy}
                                className={`flex-1 min-w-[140px] border border-[#00E5CC]/30 bg-transparent text-[#00E5CC] text-[13px] font-medium py-2.5 px-5 rounded-full transition-all flex items-center justify-center font-sans hover:bg-[#00E5CC]/[0.08] ${copied ? 'border-[#00E5CC]/60' : ''}`}
                              >
                                {copied ? 'Copied!' : 'Copy Tweet Draft'}
                              </button>
                              <button
                                onClick={handleShare}
                                className="flex-1 min-w-[140px] bg-black border border-white/15 hover:border-white/40 text-white text-[13px] font-medium py-2.5 px-5 rounded-full transition-all flex items-center justify-center font-sans"
                              >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share on X
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="h-full min-h-[500px] bg-[#0C0C14] border border-white/6 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center space-y-6 opacity-40">
                          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center border border-white/5">
                            <Cpu className="w-10 h-10 text-white/20" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-heading font-bold text-white uppercase tracking-widest text-sm">Simulation Engine Idle</h3>
                            <p className="text-xs text-white/30 max-w-xs leading-relaxed font-body">
                              Define your scenario parameters on the left and click Simulate to start the Rialo execution engine.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full min-h-screen bg-black bg-dot-grid pt-8 pb-20 px-4">
              <div className="max-w-4xl w-full space-y-12">
                {/* Header */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-white/30 font-body">
                    <button onClick={() => setActiveView('home')} className="hover:text-[#00E5CC] transition-colors">Home</button>
                    <span>&gt;</span>
                    <span className="text-white/60">Idea Validator</span>
                  </div>
                  <h1 className="text-4xl md:text-[48px] font-extrabold text-[#CAC5B9] tracking-[-0.02em] font-heading">Idea Validator</h1>
                  <p className="text-white/45 text-base max-w-[500px] leading-relaxed font-body">
                    Submit your reactive DeFi concept for instant feasibility analysis and architecture validation.
                  </p>
                  <div className="w-12 h-[3px] bg-[#00E5CC] rounded-full mt-6" />
                </div>

                {error ? (
                  <div className="bg-[#0C0C14] border border-white/6 rounded-2xl p-10 text-center space-y-6 max-w-[680px] mx-auto">
                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-white/80 font-medium font-body">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="bg-[#00E5CC] hover:bg-[#00FFE0] text-black font-bold py-3 px-8 rounded-full transition-all font-heading"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="w-full max-w-[800px] mx-auto">
                    <div className="relative bg-[#0C0C14] border border-white/6 rounded-2xl p-6 md:p-10 shadow-2xl">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00E5CC] rounded-t-2xl" />
                      <h3 className="text-lg font-bold text-white mb-8 font-heading">Validate Concept</h3>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-[0.08em] font-body flex items-center gap-2">
                              Idea Title
                            </label>
                            <input
                              type="text"
                              className="w-full bg-[#080810] border border-white/8 rounded-lg px-4 py-3 text-sm text-[#CAC5B9] placeholder-white/20 focus:outline-none focus:border-[#00E5CC]/50 focus:ring-[3px] focus:ring-[#00E5CC]/8 transition-all font-body"
                              placeholder="e.g. Rialo Dex"
                              value={validationData.idea_title}
                              onChange={(e) => setValidationData({ ...validationData, idea_title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-[0.08em] font-body flex items-center gap-2">
                              Domain
                            </label>
                            <input
                              type="text"
                              className="w-full bg-[#080810] border border-white/8 rounded-lg px-4 py-3 text-sm text-[#CAC5B9] placeholder-white/20 focus:outline-none focus:border-[#00E5CC]/50 focus:ring-[3px] focus:ring-[#00E5CC]/8 transition-all font-body"
                              placeholder="e.g. DeFi, Supply Chain"
                              value={validationData.domain}
                              onChange={(e) => setValidationData({ ...validationData, domain: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-medium text-white/40 uppercase tracking-[0.08em] font-body flex items-center gap-2">
                            Description
                          </label>
                          <textarea
                            className="w-full bg-[#080810] border border-white/8 rounded-lg px-4 py-3 text-sm text-[#CAC5B9] placeholder-white/20 focus:outline-none focus:border-[#00E5CC]/50 focus:ring-[3px] focus:ring-[#00E5CC]/8 transition-all min-h-[120px] resize-none font-body"
                            placeholder="Describe your use case in detail..."
                            value={validationData.description}
                            onChange={(e) => setValidationData({ ...validationData, description: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-[0.08em] font-body flex items-center gap-2">
                              Data Sources
                            </label>
                            <input
                              type="text"
                              className="w-full bg-[#080810] border border-white/8 rounded-lg px-4 py-3 text-sm text-[#CAC5B9] placeholder-white/20 focus:outline-none focus:border-[#00E5CC]/50 focus:ring-[3px] focus:ring-[#00E5CC]/8 transition-all font-body"
                              placeholder="e.g. Weather API, Stock Prices"
                              value={validationData.data_sources}
                              onChange={(e) => setValidationData({ ...validationData, data_sources: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-[0.08em] font-body flex items-center gap-2">
                              Desired Outcome
                            </label>
                            <input
                              type="text"
                              className="w-full bg-[#080810] border border-white/8 rounded-lg px-4 py-3 text-sm text-[#CAC5B9] placeholder-white/20 focus:outline-none focus:border-[#00E5CC]/50 focus:ring-[3px] focus:ring-[#00E5CC]/8 transition-all font-body"
                              placeholder="e.g. Automatic insurance payout"
                              value={validationData.desired_outcome}
                              onChange={(e) => setValidationData({ ...validationData, desired_outcome: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-medium text-white/40 uppercase tracking-[0.08em] font-body flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" />
                            <NetworkStatusDot isConnected={isConnected} currentChainId={currentChainId} targetNetworkName={scenario.network} />
                            Network
                            {scenario.network === 'Rialo Mainnet' && (
                              <span className="ml-2 px-2.5 py-1 rounded-full bg-[#F4A261]/10 text-[#F4A261] text-[11px] font-medium border border-[#F4A261]/30">
                                COMING SOON
                              </span>
                            )}
                          </label>
                          <select
                            className="w-full bg-[#080810] border border-white/8 rounded-lg px-4 py-3 text-sm text-[#CAC5B9] focus:outline-none focus:border-[#00E5CC]/50 focus:ring-[3px] focus:ring-[#00E5CC]/8 transition-all custom-select font-body"
                            value={scenario.network}
                            onChange={(e) => {
                              const newNetwork = e.target.value;
                              setScenario({ ...scenario, network: newNetwork });
                              switchNetwork(newNetwork);
                              getCurrentChainId().then(id => setCurrentChainId(id));
                            }}
                          >
                            <option className="bg-[#0C0C14]">Rialo Testnet</option>
                            <option className="bg-[#0C0C14]">Rialo Mainnet</option>
                          </select>
                          <NetworkInfoBox networkName={scenario.network} />
                        </div>

                        <button
                          onClick={handleSimulateIdea}
                          disabled={!validationData.idea_title.trim() || !validationData.description.trim() || isSimulating || scenario.network === 'Rialo Mainnet'}
                          className={`w-full font-bold py-4 rounded-full transition-all flex items-center justify-center mt-8 font-heading tracking-wider text-sm ${
                            scenario.network === 'Rialo Mainnet' 
                              ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                              : isSimulating 
                                ? 'bg-[#00E5CC]/30 text-black/40 cursor-not-allowed' 
                                : 'bg-[#00E5CC] hover:bg-[#00FFE0] text-black hover:-translate-y-0.5 shadow-[0_8px_30px_rgba(0,229,204,0.25)]'
                          }`}
                        >
                          {isSimulating ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              SIMULATING...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              SIMULATE
                            </>
                          )}
                        </button>
                      </div>
                                   {/* Validation Result */}
                    {result && (
                      <div className="mt-12 flex justify-center">
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="w-full max-w-[680px] bg-[#0C0C14] border border-[#00E5CC]/20 rounded-[16px] overflow-hidden shadow-2xl"
                        >
                          {/* Results Header Bar */}
                          <div className="bg-[#00E5CC]/[0.06] border-b border-[#00E5CC]/15 px-6 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-2 h-2 bg-[#00E5CC] rounded-full dot-pulse" />
                              <span className="font-mono text-[11px] font-semibold text-[#00E5CC] tracking-[0.15em] uppercase">
                                Validation Complete
                              </span>
                            </div>
                            <span className="font-sans text-[11px] text-white/30">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>

                          <div className="p-8 flex flex-col items-center">
                            {/* Feasibility Score Circle */}
                            <div className="relative w-40 h-40 flex flex-col items-center justify-center mb-6">
                              <svg className="w-full h-full -rotate-90">
                                <circle
                                  cx="80"
                                  cy="80"
                                  r="70"
                                  fill="transparent"
                                  stroke="rgba(255,255,255,0.06)"
                                  strokeWidth="4"
                                />
                                <motion.circle
                                  cx="80"
                                  cy="80"
                                  r="70"
                                  fill="transparent"
                                  stroke={
                                    result.feasibility_score >= 75 ? '#00E5CC' : 
                                    result.feasibility_score >= 50 ? '#F4A261' : '#E63946'
                                  }
                                  strokeWidth="4"
                                  strokeDasharray="439.8"
                                  initial={{ strokeDashoffset: 439.8 }}
                                  animate={{ strokeDashoffset: 439.8 - (result.feasibility_score / 100) * 439.8 }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-heading text-5xl font-extrabold" style={{ 
                                  color: result.feasibility_score >= 75 ? '#00E5CC' : 
                                         result.feasibility_score >= 50 ? '#F4A261' : '#E63946' 
                                }}>
                                  {result.feasibility_score}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-center space-y-3">
                              <div className="font-sans text-[12px] text-white/40 uppercase tracking-[0.1em]">Feasibility Score</div>
                              <div className={`px-4 py-1 rounded-full text-[12px] font-semibold font-sans border inline-flex ${
                                result.feasibility_score >= 75 ? 'bg-[#00E5CC]/10 border-[#00E5CC]/30 text-[#00E5CC]' :
                                result.feasibility_score >= 50 ? 'bg-[#F4A261]/10 border-[#F4A261]/30 text-[#F4A261]' :
                                'bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]'
                              }`}>
                                {result.feasibility_score >= 75 ? 'Highly Feasible' : 
                                 result.feasibility_score >= 50 ? 'Moderately Feasible' : 'Needs Rethinking'}
                              </div>
                            </div>
                          </div>

                          {/* Report Grid */}
                          <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { 
                                title: 'Recommendation', 
                                fullWidth: true,
                                content: <p className="text-white/70 text-[13px] leading-[1.6]">{result.recommendation}</p> 
                              },
                              { 
                                title: 'Required Rialo Feeds', 
                                content: (
                                  <ul className="space-y-2">
                                    {result.required_rialo_feeds?.map((feed: string, i: number) => (
                                      <li key={i} className="text-[13px] text-white/60 flex items-start">
                                        <span className="text-[#00E5CC] mr-2">▸</span>
                                        {feed}
                                      </li>
                                    ))}
                                  </ul>
                                )
                              },
                              { 
                                title: 'Estimated Latency', 
                                content: <p className="text-white/70 text-[13px] leading-[1.6]">{result.estimated_latency_range}</p> 
                              },
                              { 
                                title: 'Edge Cases', 
                                content: (
                                  <ul className="space-y-2">
                                    {result.edge_cases?.map((ec: string, i: number) => (
                                      <li key={i} className="text-[13px] text-white/60 flex items-start">
                                        <span className="text-[#00E5CC] mr-2">▸</span>
                                        {ec}
                                      </li>
                                    ))}
                                  </ul>
                                )
                              },
                              { 
                                title: 'Suggested Trigger Logic', 
                                content: (
                                  <div className="bg-black border border-white/5 rounded-lg p-4 font-mono text-xs text-white/70 whitespace-pre-wrap">
                                    {result.suggested_trigger_logic}
                                  </div>
                                )
                              }
                            ].map((box, i) => (
                              <motion.div 
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 + (i * 0.08) }}
                                className={`bg-[#080810] border border-white/5 rounded-[10px] p-6 transition-colors hover:border-[#00E5CC]/20 ${box.fullWidth ? 'md:col-span-2' : ''}`}
                              >
                                <div className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em] mb-3">{box.title}</div>
                                {box.content}
                              </motion.div>
                            ))}
                          </div>

                          {/* Explorer Button */}
                          <div className="px-8 pb-8 flex justify-center">
                            <button
                              onClick={() => window.open(scenario.network === 'Rialo Testnet' ? `https://sepolia.etherscan.io/tx/${result.txHash}` : '#', '_blank')}
                              className="border border-[#00E5CC]/30 text-[#00E5CC] hover:bg-[#00E5CC]/[0.08] text-[13px] font-medium py-2 px-5 rounded-full transition-all hover:-translate-y-0.5 font-sans"
                            >
                              View on Explorer
                            </button>
                          </div>

                          {/* Share Buttons Row */}
                          <div className="border-t border-white/5 p-8 space-y-4">
                            <div className="space-y-2">
                              <div className="font-mono text-[10px] text-white/30 uppercase tracking-[0.1em]">Tweet Draft</div>
                              <div className="bg-[#080810] border border-white/5 rounded-[10px] p-4 font-sans text-sm text-white/70 leading-[1.6]">
                                {result.tweet_draft}
                              </div>
                            </div>
                            <div className="flex gap-3 flex-col sm:flex-row">
                              <button
                                onClick={handleCopy}
                                className={`flex-1 min-w-[140px] border border-[#00E5CC]/30 bg-transparent text-[#00E5CC] text-[13px] font-medium py-2.5 px-5 rounded-full transition-all flex items-center justify-center font-sans hover:bg-[#00E5CC]/[0.08] ${copied ? 'border-[#00E5CC]/60' : ''}`}
                              >
                                {copied ? 'Copied!' : 'Copy Tweet Draft'}
                              </button>
                              <button
                                onClick={handleShare}
                                className="flex-1 min-w-[140px] bg-black border border-white/15 hover:border-white/40 text-white text-[13px] font-medium py-2.5 px-5 rounded-full transition-all flex items-center justify-center font-sans"
                              >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share on X
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !isWaiting && setShowConfirmModal(false)}></div>
          <div className="bg-[#0C0C14] border border-white/6 rounded-2xl w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00E5CC] rounded-t-2xl" />
            
            {txStatus === 'pending' || isWaiting ? (
              <div className="py-8 flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-[#00E5CC]/10 border-t-[#00E5CC] rounded-full animate-spin"></div>
                  <Zap className="w-8 h-8 text-[#00E5CC] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white font-heading">Recording on Rialo Testnet...</h3>
                  <p className="text-white/40 text-sm font-body">Waiting for block confirmation</p>
                </div>
              </div>
            ) : txStatus === 'error' ? (
              <div className="py-4 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white font-heading">Transaction Failed</h3>
                    <p className="text-white/40 text-sm font-body">{txErrorMessage || 'An unexpected error occurred.'}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {txErrorMessage?.includes('faucet') && (
                    <a 
                      href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full bg-[#00E5CC]/10 text-[#00E5CC] font-bold py-4 rounded-full text-center hover:bg-[#00E5CC]/20 transition-all font-heading tracking-wider text-sm border border-[#00E5CC]/20"
                    >
                      VISIT FAUCET
                    </a>
                  )}
                  <button 
                    onClick={handleConfirmTx}
                    className="w-full bg-[#00E5CC] hover:bg-[#00FFE0] text-black font-bold py-4 rounded-full transition-all font-heading tracking-wider text-sm shadow-[0_8px_30px_rgba(0,229,204,0.25)]"
                  >
                    RETRY
                  </button>
                  <button 
                    onClick={() => setShowConfirmModal(false)}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-full transition-all font-heading tracking-wider text-sm"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white font-heading">
                      {confirmationType === 'scenario' ? 'Confirm Simulation' : 'Confirm Validation'}
                    </h3>
                    <p className="text-white/40 text-sm font-body">
                      {confirmationType === 'scenario' 
                        ? 'This will record your scenario on Rialo Testnet' 
                        : 'This will record your idea on Rialo Testnet'}
                    </p>
                  </div>
                  <button onClick={() => setShowConfirmModal(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-white/30" />
                  </button>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-5 space-y-4 font-body text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 font-bold uppercase tracking-wider">From</span>
                    <span className="text-white font-medium">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 font-bold uppercase tracking-wider">Network</span>
                    <span className="text-white font-medium">Rialo Testnet (Sepolia)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 font-bold uppercase tracking-wider">Action</span>
                    <span className="text-white font-medium">
                      {confirmationType === 'scenario' ? 'Record Scenario Hash' : 'Record Idea Hash'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 font-bold uppercase tracking-wider">Estimated Gas</span>
                    <span className="text-[#00E5CC] font-bold font-mono">~0.0001 ETH</span>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <span className="text-white/30 block mb-2 font-bold uppercase tracking-wider">Data</span>
                    <span className="text-[#00E5CC] break-all font-mono opacity-80">
                      {confirmationType === 'scenario' 
                        ? scenario.trigger_event.slice(0, 40) 
                        : validationData.idea_title.slice(0, 40)}...
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-full transition-all font-heading tracking-wider text-sm"
                  >
                    REJECT
                  </button>
                  <button 
                    onClick={handleConfirmTx}
                    className="flex-1 bg-[#00E5CC] hover:bg-[#00FFE0] text-black font-bold py-4 rounded-full transition-all font-heading tracking-wider text-sm shadow-[0_8px_30px_rgba(0,229,204,0.25)]"
                  >
                    CONFIRM
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )}

      {/* Footer */}
      <footer className="bg-black border-t border-white/6 pt-12 pb-8 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center md:text-left">
            {/* Left Column */}
            <div className="flex flex-col items-center md:items-start">
              <img 
                src="https://cdn.prod.website-files.com/6883572e6ebf68cfe676dd65/6883572e6ebf68cfe676dd82_rialo-logo.svg" 
                alt="Rialo Logo" 
                className="h-6 w-auto"
                referrerPolicy="no-referrer"
              />
              <div className="font-heading font-semibold text-sm text-white mt-3">Cipher Run</div>
              <p className="text-[12px] text-white/30 mt-1.5 font-sans">A community tool built for the Rialo ecosystem.</p>
              <p className="text-[11px] text-white/20 mt-1.5 font-sans italic">Not affiliated with Rialo Labs.</p>
            </div>

            {/* Center Column */}
            <div className="flex flex-col items-center justify-center">
              <p className="text-[13px] text-white/40 font-sans">Built by MystiqueMide</p>
              <p className="text-[12px] text-white/20 font-sans mt-0.5">for the Rialo community</p>
            </div>

            {/* Right Column */}
            <div className="flex flex-col items-center md:items-end">
              <div className="font-mono text-[10px] text-white/20 uppercase tracking-[0.1em] mb-3">FOLLOW</div>
              <div className="flex flex-col items-center md:items-end gap-2">
                <a 
                  href="https://x.com/RialoHQ" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[13px] text-white/35 hover:text-[#00E5CC] transition-all duration-200 font-sans"
                >
                  @RialoHQ
                </a>
                <a 
                  href="https://x.com/MystiqueMide" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[13px] text-white/35 hover:text-[#00E5CC] transition-all duration-200 font-sans"
                >
                  @MystiqueMide
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/4 mt-10 pt-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-white/20 font-sans">© 2026 Cipher Run. Powered by Rialo Protocol.</p>
            <div className="bg-[#00E5CC]/[0.06] border border-[#00E5CC]/15 text-[#00E5CC]/50 font-mono text-[10px] px-2.5 py-1 rounded-full">
              Rialo Testnet
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  </div>
</div>
);
}

export default function App() {
  return (
    <WalletProviders>
      <AppContent />
    </WalletProviders>
  );
}
