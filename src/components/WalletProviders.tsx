import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, useAccount } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, sepolia } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useWallet, WalletProvider as SolanaWalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter, CoinbaseWalletAdapter, LedgerWalletAdapter, TrustWalletAdapter } from '@solana/wallet-adapter-wallets';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo, ReactNode, useEffect, useState } from 'react';

import '@rainbow-me/rainbowkit/styles.css';
import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient();

// EVM Config
const config = getDefaultConfig({
  appName: 'Cipher Run',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, arbitrum, optimism, sepolia],
  ssr: false,
});

export const WalletProviders = ({ children }: { children: ReactNode }) => {
  // Solana Config
  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), []);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new LedgerWalletAdapter(),
      new TrustWalletAdapter(),
    ],
    []
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#00FF00',
          borderRadius: 'medium',
        })}>
          <ConnectionProvider endpoint={endpoint}>
            <SolanaWalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                {children}
              </WalletModalProvider>
            </SolanaWalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export const useAppConnection = () => {
  const { isConnected: isEvmConnected, address: evmAddress, isConnecting: isEvmConnecting, isReconnecting: isEvmReconnecting } = useAccount();
  const { connected: isSolanaConnected, publicKey: solanaAddress, connecting: isSolanaConnecting } = useWallet();
  
  const isConnected = isEvmConnected || isSolanaConnected;
  const isConnecting = isEvmConnecting || isEvmReconnecting || isSolanaConnecting;

  return {
    isConnected,
    isConnecting,
    address: evmAddress || solanaAddress?.toBase58(),
    type: isEvmConnected ? 'EVM' : isSolanaConnected ? 'Solana' : null
  };
};
