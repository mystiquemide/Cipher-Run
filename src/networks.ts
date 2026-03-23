export const NETWORKS = {
  'Rialo Mainnet': {
    displayName: 'Rialo Mainnet',
    chainId: null,
    rpc: null,
    symbol: 'ETH',
    explorer: null,
    faucet: null,
    active: false
  },
  'Rialo Testnet': {
    displayName: 'Rialo Testnet',
    chainId: 11155111,
    rpc: 'https://sepolia.infura.io',
    symbol: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
    faucet: 'https://faucet.quicknode.com/ethereum/sepolia',
    active: true
  }
}
