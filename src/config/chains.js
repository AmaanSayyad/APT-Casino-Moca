/**
 * Custom Chain Definitions
 * Defines custom chains not included in wagmi/chains
 */

import { defineChain } from 'viem';

// Moca Chain Testnet Definition (Primary network for user interactions)
export const mocaChainTestnet = defineChain({
  id: 222888,
  name: 'Moca Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MOCA',
    symbol: 'MOCA',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.mocachain.org/'],
    },
    public: {
      http: ['https://testnet-rpc.mocachain.org/'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Moca Chain Testnet Explorer',
      url: 'https://testnet-scan.mocachain.org/',
    },
  },
  testnet: true,
});

// Arbitrum Sepolia (For entropy generation backend)
export const arbitrumSepolia = defineChain({
  id: 421614,
  name: 'Arbitrum Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
    public: {
      http: ['https://sepolia-rollup.arbitrum.io/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arbitrum Sepolia Explorer',
      url: 'https://sepolia.arbiscan.io',
    },
  },
  testnet: true,
});

export default {
  mocaChainTestnet,
  arbitrumSepolia,
};