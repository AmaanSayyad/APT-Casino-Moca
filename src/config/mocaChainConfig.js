// Moca Chain Testnet Configuration
export const mocaChainTestnetConfig = {
  id: 222888,
  name: 'Moca Chain Testnet',
  network: 'moca-testnet',
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
};

export const mocaChainTestnetTokens = {
  MOCA: {
    address: 'native',
    decimals: 18,
    symbol: 'MOCA',
    name: 'MOCA',
    isNative: true,
  },
};

export default mocaChainTestnetConfig;