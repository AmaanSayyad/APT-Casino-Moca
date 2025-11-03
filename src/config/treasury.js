// Casino Treasury Configuration
// This file contains the treasury wallet addresses and related configuration

// Multi-Network Treasury Configuration
export const TREASURY_CONFIG = {
  // Moca Chain Testnet Treasury Wallet (for deposits/withdrawals)
  MOCA: {
    ADDRESS: process.env.NEXT_PUBLIC_MOCA_TREASURY_ADDRESS || process.env.MOCA_TREASURY_ADDRESS || process.env.TREASURY_ADDRESS,
    PRIVATE_KEY: process.env.MOCA_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY,
    NETWORK: {
      CHAIN_ID: '0x366a8', // Moca Chain testnet (222888 in hex)
      CHAIN_NAME: 'Moca Chain Testnet',
      RPC_URL: process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || 'https://testnet-rpc.mocachain.org/',
      EXPLORER_URL: process.env.NEXT_PUBLIC_MOCA_TESTNET_EXPLORER || 'https://testnet-scan.mocachain.org/'
    }
  },
  
  // Arbitrum Sepolia Treasury Wallet (for entropy generation)
  ARBITRUM: {
    ADDRESS: process.env.ARBITRUM_TREASURY_ADDRESS,
    PRIVATE_KEY: process.env.ARBITRUM_TREASURY_PRIVATE_KEY,
    NETWORK: {
      CHAIN_ID: '0x66eee', // Arbitrum Sepolia (421614 in hex)
      CHAIN_NAME: 'Arbitrum Sepolia',
      RPC_URL: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
      EXPLORER_URL: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_EXPLORER || 'https://sepolia.arbiscan.io'
    }
  },
  
  // Backward compatibility (defaults to Moca for main operations)
  ADDRESS: process.env.NEXT_PUBLIC_MOCA_TREASURY_ADDRESS || process.env.MOCA_TREASURY_ADDRESS || process.env.TREASURY_ADDRESS,
  PRIVATE_KEY: process.env.MOCA_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY,
  
  // Network configuration for Moca Chain Testnet (for deposit/withdraw)
  NETWORK: {
    CHAIN_ID: '0x366a8', // Moca Chain testnet (222888 in hex)
    CHAIN_NAME: 'Moca Chain Testnet',
    RPC_URL: process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || 'https://testnet-rpc.mocachain.org/',
    EXPLORER_URL: process.env.NEXT_PUBLIC_MOCA_TESTNET_EXPLORER || 'https://testnet-scan.mocachain.org/'
  },
  
  // Gas settings for transactions
  GAS: {
    DEPOSIT_LIMIT: process.env.MOCA_GAS_LIMIT_DEPOSIT ? '0x' + parseInt(process.env.MOCA_GAS_LIMIT_DEPOSIT).toString(16) : '0x5208', // 21000 gas for simple MOCA transfer
    WITHDRAW_LIMIT: process.env.MOCA_GAS_LIMIT_WITHDRAW ? '0x' + parseInt(process.env.MOCA_GAS_LIMIT_WITHDRAW).toString(16) : '0x186A0', // 100000 gas for more complex operations
  },
  
  // Minimum and maximum deposit amounts (in MOCA)
  LIMITS: {
    MIN_DEPOSIT: parseFloat(process.env.MIN_DEPOSIT) || 0.001, // 0.001 MOCA minimum
    MAX_DEPOSIT: parseFloat(process.env.MAX_DEPOSIT) || 100, // 100 MOCA maximum
  }
};

// Helper function to validate treasury address
export const isValidTreasuryAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Helper function to get treasury info for specific network
export const getTreasuryInfo = (network = 'moca') => {
  if (network === 'arbitrum') {
    return {
      address: TREASURY_CONFIG.ARBITRUM.ADDRESS,
      network: TREASURY_CONFIG.ARBITRUM.NETWORK.CHAIN_NAME,
      chainId: TREASURY_CONFIG.ARBITRUM.NETWORK.CHAIN_ID
    };
  }
  
  return {
    address: TREASURY_CONFIG.MOCA.ADDRESS,
    network: TREASURY_CONFIG.MOCA.NETWORK.CHAIN_NAME,
    chainId: TREASURY_CONFIG.MOCA.NETWORK.CHAIN_ID
  };
};

// Helper function to get Moca treasury info
export const getMocaTreasuryInfo = () => getTreasuryInfo('moca');

// Helper function to get Arbitrum treasury info
export const getArbitrumTreasuryInfo = () => getTreasuryInfo('arbitrum');
