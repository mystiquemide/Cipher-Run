import { motion } from 'motion/react';
import { Zap, ShieldCheck, Globe, Activity, Wallet, ChevronRight, Loader2 } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAppConnection } from './WalletProviders';
import { useState } from 'react';

export const LandingPage = () => {
  const { openConnectModal } = useConnectModal();
  const { setVisible: setSolanaModalVisible } = useWalletModal();
  const { isConnected, isConnecting } = useAppConnection();
  const [showOptions, setShowOptions] = useState(false);

  if (isConnected) return null;

  return (
    <div className="flex-1 bg-rialo-bg text-rialo-text flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rialo-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rialo-secondary/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full text-center space-y-12 z-10"
      >
        {/* Logo & Title */}
        <div className="space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center p-4 bg-rialo-primary/10 rounded-3xl border border-rialo-primary/20 mb-4 shadow-[0_0_50px_rgba(20,20,20,0.1)]"
          >
            <img 
              src="https://cdn.prod.website-files.com/6883572e6ebf68cfe676dd65/6883572e6ebf68cfe676dd82_rialo-logo.svg" 
              alt="Rialo Logo" 
              className="w-12 h-12 brightness-0 invert"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <h1 className="text-4xl md:text-8xl font-heading font-black tracking-tighter text-[#CAC5B9] leading-[0.9]">
            CIPHER <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rialo-primary to-rialo-secondary">
              RUN
            </span>
          </h1>
          <p className="text-xl text-rialo-text-sec max-w-2xl mx-auto leading-relaxed font-sans">
            Simulate the future. Validate your ideas. 
            Connect your wallet to access the simulator and validator.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            { icon: ShieldCheck, title: "Secure", desc: "Enterprise-grade security with oracle-free feeds." },
            { icon: Globe, title: "Global", desc: "Access real-world data from any market, anywhere." },
            { icon: Activity, title: "Fast", desc: "Sub-second finality for real-time execution." }
          ].map((f, i) => (
            <div key={i} className="p-6 bg-rialo-card border border-rialo-border rounded-2xl hover:border-rialo-primary/30 transition-colors w-full">
              <f.icon className="w-6 h-6 text-rialo-primary mb-3" />
              <h3 className="font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-rialo-text-sec">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Connect Action */}
        <div className="pt-8">
          {isConnecting ? (
            <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-rialo-primary/20 border-t-rialo-primary rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-rialo-primary animate-pulse" />
                </div>
              </div>
              <p className="text-lg font-bold text-rialo-text tracking-widest uppercase animate-pulse">
                Connecting Wallet...
              </p>
              <p className="text-sm text-rialo-text-sec">
                Please approve the request in your wallet extension.
              </p>
            </div>
          ) : !showOptions ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowOptions(true)}
              className="bg-rialo-primary hover:bg-rialo-primary/90 text-rialo-bg font-black py-5 px-10 rounded-2xl text-xl transition-all flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(20,20,20,0.2)]"
            >
              <Wallet className="w-6 h-6 mr-3" />
              CONNECT WALLET
              <ChevronRight className="w-6 h-6 ml-2" />
            </motion.button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                onClick={() => openConnectModal?.()}
                className="flex-1 bg-rialo-card border border-rialo-border hover:border-rialo-primary p-6 rounded-2xl transition-all group text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Globe className="w-6 h-6 text-blue-500" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-rialo-text-sec group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-bold text-lg">EVM Wallets</h4>
                <p className="text-xs text-rialo-text-sec">MetaMask, Rabby, OKX, WalletConnect</p>
              </button>

              <button
                onClick={() => setSolanaModalVisible(true)}
                className="flex-1 bg-rialo-card border border-rialo-border hover:border-rialo-secondary p-6 rounded-2xl transition-all group text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Zap className="w-6 h-6 text-purple-500" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-rialo-text-sec group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-bold text-lg">Solana Wallets</h4>
                <p className="text-xs text-rialo-text-sec">Phantom, Backpack, Solflare</p>
              </button>
            </div>
          )}
          
          {showOptions && !isConnecting && (
            <button 
              onClick={() => setShowOptions(false)}
              className="mt-6 text-rialo-text-sec hover:text-rialo-text text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Footer Meta */}
        <div className="pt-12 pb-12 flex items-center justify-center gap-8 text-xs text-rialo-text-sec font-mono uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-rialo-primary rounded-full animate-pulse" />
            Network Status: Operational
          </div>
          <div>v1.0.4-beta</div>
        </div>
      </motion.div>
    </div>
  );
};
