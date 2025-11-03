require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    'arbitrum-sepolia': {
      url: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: process.env.ARBITRUM_TREASURY_PRIVATE_KEY ? [process.env.ARBITRUM_TREASURY_PRIVATE_KEY] : [],
      chainId: 421614,
      timeout: 120000, // 2 minutes
      httpHeaders: {
        "User-Agent": "hardhat"
      }
    },
    'arbitrum-one': {
      url: process.env.NEXT_PUBLIC_ARBITRUM_ONE_RPC || "https://arb1.arbitrum.io/rpc",
      accounts: process.env.TREASURY_PRIVATE_KEY ? [process.env.TREASURY_PRIVATE_KEY] : [],
      chainId: 42161,
      timeout: 120000,
      httpHeaders: {
        "User-Agent": "hardhat"
      }
    },
    'moca-testnet': {
      url: process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || "https://testnet-rpc.mocachain.org/",
      accounts: process.env.MOCA_TREASURY_PRIVATE_KEY ? [process.env.MOCA_TREASURY_PRIVATE_KEY] : [],
      chainId: 222888,
      timeout: 120000,
      httpHeaders: {
        "User-Agent": "hardhat"
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ARBISCAN_API_KEY || "",
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};