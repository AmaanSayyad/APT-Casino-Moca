// Network utilities for Moca Testnet
import { mocaTestnet } from '@/config/chains';

export const MOCA_TESTNET_CONFIG = {
  chainId: '0x279f', // 10143 in hex
  chainName: 'Moca Testnet',
  nativeCurrency: {
    name: 'Moca',
    symbol: 'MOCA',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.moca.network'],
  blockExplorerUrls: ['https://testnet-scan.moca.network'],
};

export const switchToMocaTestnet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Try to switch to Moca Testnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MOCA_TESTNET_CONFIG.chainId }],
    });
  } catch (switchError) {
    // If the chain is not added, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [MOCA_TESTNET_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add Moca Testnet to MetaMask');
      }
    } else {
      throw new Error('Failed to switch to Moca Testnet');
    }
  }
};

export const isMocaTestnet = (chainId) => {
  return chainId === 10143 || chainId === '0x279f';
};

export const formatMocaBalance = (balance, decimals = 5) => {
  const numBalance = parseFloat(balance || '0');
  return `${numBalance.toFixed(decimals)} MOCA`;
};

export const getMocaTestnetExplorerUrl = (txHash) => {
  return `https://testnet-scan.moca.network/tx/${txHash}`;
};