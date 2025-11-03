// Network Configuration
export const NETWORKS = {
  MOCA_TESTNET: 'moca-testnet',
  ARBITRUM_SEPOLIA: 'arbitrum-sepolia',
  ARBITRUM_MAINNET: 'arbitrum-one'
};

// Network URLs
export const NETWORK_URLS = {
  [NETWORKS.MOCA_TESTNET]: "https://testnet-rpc.mocachain.org/",
  [NETWORKS.ARBITRUM_SEPOLIA]: "https://sepolia-rollup.arbitrum.io/rpc",
  [NETWORKS.ARBITRUM_MAINNET]: "https://arb1.arbitrum.io/rpc"
};

// Explorer URLs
export const EXPLORER_URLS = {
  [NETWORKS.MOCA_TESTNET]: "https://testnet-scan.mocachain.org/",
  [NETWORKS.ARBITRUM_SEPOLIA]: "https://sepolia.arbiscan.io",
  [NETWORKS.ARBITRUM_MAINNET]: "https://arbiscan.io"
};

// Default network (Moca Chain Testnet for user interactions)
export const DEFAULT_NETWORK = NETWORKS.MOCA_TESTNET;

// Casino Contract Configuration
export const CASINO_CONTRACT_CONFIG = {
  [NETWORKS.MOCA_TESTNET]: {
    casinoContract: process.env.NEXT_PUBLIC_MOCA_CASINO_CONTRACT || "",
    treasuryAddress: process.env.NEXT_PUBLIC_MOCA_TREASURY_ADDRESS || "",
    rouletteModule: "roulette",
    minesModule: "mines",
    wheelModule: "wheel",
    plinkoModule: "plinko"
  }
};

// Entropy Contract Configuration (Arbitrum Sepolia for backend entropy generation)
export const ENTROPY_CONTRACT_CONFIG = {
  [NETWORKS.ARBITRUM_SEPOLIA]: {
    entropyContract: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_CASINO_CONTRACT || "",
    pythEntropyContract: process.env.NEXT_PUBLIC_PYTH_ENTROPY_CONTRACT || "",
    pythEntropyProvider: process.env.NEXT_PUBLIC_PYTH_ENTROPY_PROVIDER || "",
    treasuryAddress: process.env.ARBITRUM_TREASURY_ADDRESS || ""
  }
};

// Token Configuration
export const TOKEN_CONFIG = {
  MOCA: {
    name: "MOCA",
    symbol: "MOCA",
    decimals: 18,
    type: "native"
  },
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    type: "native"
  }
};

// Network Information
export const NETWORK_INFO = {
  [NETWORKS.MOCA_TESTNET]: {
    name: "Moca Chain Testnet",
    chainId: 222888,
    nativeCurrency: TOKEN_CONFIG.MOCA,
    explorer: EXPLORER_URLS[NETWORKS.MOCA_TESTNET],
    rpcUrl: NETWORK_URLS[NETWORKS.MOCA_TESTNET]
  },
  [NETWORKS.ARBITRUM_SEPOLIA]: {
    name: "Arbitrum Sepolia",
    chainId: 421614,
    nativeCurrency: TOKEN_CONFIG.ETH,
    explorer: EXPLORER_URLS[NETWORKS.ARBITRUM_SEPOLIA],
    rpcUrl: NETWORK_URLS[NETWORKS.ARBITRUM_SEPOLIA]
  },
  [NETWORKS.ARBITRUM_MAINNET]: {
    name: "Arbitrum One",
    chainId: 42161,
    nativeCurrency: TOKEN_CONFIG.ETH,
    explorer: EXPLORER_URLS[NETWORKS.ARBITRUM_MAINNET],
    rpcUrl: NETWORK_URLS[NETWORKS.ARBITRUM_MAINNET]
  }
};

// Export default configuration
export default {
  NETWORKS,
  NETWORK_URLS,
  EXPLORER_URLS,
  DEFAULT_NETWORK,
  CASINO_CONTRACT_CONFIG,
  ENTROPY_CONTRACT_CONFIG,
  TOKEN_CONFIG,
  NETWORK_INFO
}; 