// Network utilities for Moca Chain Testnet
import { mocaChainTestnet } from '@/config/chains';

export const MOCA_CHAIN_TESTNET_CONFIG = {
  chainId: '0x366a8', // 222888 in hex
  chainName: 'Moca Chain Testnet',
  nativeCurrency: {
    name: 'MOCA',
    symbol: 'MOCA',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.mocachain.org/'],
  blockExplorerUrls: ['https://testnet-scan.mocachain.org/'],
};

export const switchToMocaChainTestnet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Try to switch to Moca Chain Testnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MOCA_CHAIN_TESTNET_CONFIG.chainId }],
    });
  } catch (switchError) {
    // If the chain is not added, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [MOCA_CHAIN_TESTNET_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add Moca Chain Testnet to MetaMask');
      }
    } else {
      throw new Error('Failed to switch to Moca Chain Testnet');
    }
  }
};

export const isMocaChainTestnet = (chainId) => {
  return chainId === 222888 || chainId === '0x366a8' || chainId === '0x366A8';
};

export const formatMocaBalance = (balance, decimals = 5) => {
  const numBalance = parseFloat(balance || '0');
  return `${numBalance.toFixed(decimals)} MOCA`;
};

export const getMocaChainTestnetExplorerUrl = (txHash) => {
  return `https://testnet-scan.mocachain.org/tx/${txHash}`;
};

// Legacy exports for backward compatibility
export const MONAD_TESTNET_CONFIG = MOCA_CHAIN_TESTNET_CONFIG;
export const switchToMonadTestnet = switchToMocaChainTestnet;
export const isMonadTestnet = isMocaChainTestnet;
export const formatMonBalance = formatMocaBalance;
export const getMonadTestnetExplorerUrl = getMocaChainTestnetExplorerUrl;