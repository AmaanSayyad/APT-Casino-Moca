/**
 * Moca Chain Contract Logger Service
 * Logs game results to Moca Chain using MocaGameLogger smart contract
 */

import { ethers } from 'ethers';
import { TREASURY_CONFIG } from '../config/treasury.js';

// MocaGameLogger contract ABI (only the functions we need)
const MOCA_GAME_LOGGER_ABI = [
  "function logGame(string gameId, string gameType, address userAddress, uint256 betAmount, uint256 payoutAmount, bool isWin, string gameConfig, string resultData, string entropyProof) external",
  "function getGameLog(string gameId) external view returns (tuple(string gameId, string gameType, address userAddress, uint256 betAmount, uint256 payoutAmount, bool isWin, string gameConfig, string resultData, string entropyProof, uint256 timestamp, uint256 blockNumber))",
  "function getLoggerStats() external view returns (uint256 totalLogs, uint256 totalGasUsed, address lastLogger, uint256 averageGasPerLog)",
  "function getUserLogCount(address user) external view returns (uint256)",
  "function getGameTypeLogCount(string gameType) external view returns (uint256)",
  "function getUserGames(address userAddress, uint256 offset, uint256 limit) external view returns (string[] memory gameIds)",
  "function getGamesByType(string gameType, uint256 offset, uint256 limit) external view returns (string[] memory gameIds)",
  "function getRecentGames(uint256 offset, uint256 limit) external view returns (string[] memory gameIds)",
  "event GameLogged(string indexed gameId, string indexed gameType, address indexed userAddress, uint256 betAmount, uint256 payoutAmount, bool isWin, uint256 timestamp)"
];

class MocaGameLoggerService {
  constructor() {
    this.provider = null;
    this.treasuryWallet = null;
    this.contract = null;
    this.isInitialized = false;
    
    // Moca Chain Testnet configuration
    this.networkConfig = {
      chainId: 222888, // Moca Chain testnet
      name: 'Moca Chain Testnet',
      rpcUrl: process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || TREASURY_CONFIG.MOCA.NETWORK.RPC_URL || 'https://testnet-rpc.mocachain.org/',
      explorerUrl: process.env.NEXT_PUBLIC_MOCA_TESTNET_EXPLORER || TREASURY_CONFIG.MOCA.NETWORK.EXPLORER_URL || 'https://testnet-scan.mocachain.org'
    };
    
    // Contract address from environment
    this.contractAddress = process.env.NEXT_PUBLIC_MOCA_GAME_LOGGER_CONTRACT || null;
  }

  /**
   * Initialize the Moca Contract logger
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('🎮 MOCA CONTRACT LOGGER: Initializing...');
      
      if (!this.contractAddress) {
        throw new Error('MocaGameLogger contract address not configured. Please set NEXT_PUBLIC_MOCA_GAME_LOGGER_CONTRACT in environment variables.');
      }
      
      // Create provider for Moca Chain Testnet
      this.provider = new ethers.JsonRpcProvider(this.networkConfig.rpcUrl);
      
      // Create treasury wallet using MOCA treasury config
      // Try multiple sources for the private key
      const treasuryPrivateKey = 
        process.env.MOCA_TREASURY_PRIVATE_KEY || 
        process.env.TREASURY_PRIVATE_KEY ||
        TREASURY_CONFIG.MOCA?.PRIVATE_KEY || 
        TREASURY_CONFIG.PRIVATE_KEY;
        
      if (treasuryPrivateKey) {
        this.treasuryWallet = new ethers.Wallet(treasuryPrivateKey, this.provider);
        console.log('🏦 MOCA CONTRACT LOGGER: Treasury wallet initialized');
        console.log(`📍 Treasury address: ${this.treasuryWallet.address}`);
      } else {
        throw new Error('Moca treasury private key not found. Please set MOCA_TREASURY_PRIVATE_KEY or TREASURY_PRIVATE_KEY in environment variables.');
      }

      // Create contract instance
      this.contract = new ethers.Contract(
        this.contractAddress,
        MOCA_GAME_LOGGER_ABI,
        this.treasuryWallet
      );
      
      console.log('📋 MOCA CONTRACT LOGGER: Contract initialized at', this.contractAddress);

      // Verify contract is accessible
      try {
        const [totalLogs] = await this.contract.getLoggerStats();
        console.log(`📊 MOCA CONTRACT LOGGER: Current total logs: ${totalLogs.toString()}`);
      } catch (error) {
        console.warn('⚠️ MOCA CONTRACT LOGGER: Could not fetch contract stats (contract may not be deployed yet):', error.message);
      }

      this.isInitialized = true;
      console.log('✅ MOCA CONTRACT LOGGER: Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ MOCA CONTRACT LOGGER: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Log game result to Moca Chain using smart contract
   * @param {Object} gameResult - Game result data
   * @returns {Promise<Object>} Transaction result
   */
  async logGameResult(gameResult) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📝 MOCA CONTRACT LOGGER: Logging game result...', {
        gameType: gameResult.gameType,
        userAddress: gameResult.userAddress,
        gameId: gameResult.gameId,
        betAmount: gameResult.betAmount,
        payoutAmount: gameResult.payoutAmount
      });

      // Prepare contract parameters
      const gameId = gameResult.gameId || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const gameType = (gameResult.gameType || 'UNKNOWN').toUpperCase();
      const userAddress = gameResult.userAddress || ethers.ZeroAddress;
      
      // Convert bet amounts to wei (they come as strings representing ether amounts)
      let betAmount, payoutAmount;
      try {
        const betEther = parseFloat(gameResult.betAmount) || 0;
        const payoutEther = parseFloat(gameResult.payoutAmount) || 0;
        
        // If amounts are very small, treat them as already in wei
        if (betEther < 1e-15) {
          betAmount = BigInt(Math.floor(betEther * 1e18));
        } else {
          betAmount = ethers.parseEther(betEther.toString());
        }
        
        if (payoutEther < 1e-15) {
          payoutAmount = BigInt(Math.floor(payoutEther * 1e18));
        } else {
          payoutAmount = ethers.parseEther(payoutEther.toString());
        }
      } catch (error) {
        console.warn('⚠️ Amount parsing failed, using 0:', error);
        betAmount = BigInt(0);
        payoutAmount = BigInt(0);
      }
      
      const isWin = gameResult.isWin || false;
      
      // Truncate JSON strings if they're too long to avoid gas issues
      // Max ~500KB per string to stay within reasonable gas limits
      const maxStringLength = 500000;
      const gameConfigStr = JSON.stringify(gameResult.gameConfig || {});
      const resultDataStr = JSON.stringify(gameResult.resultData || {});
      const entropyProofStr = JSON.stringify(gameResult.entropyProof || {});
      
      const gameConfig = gameConfigStr.length > maxStringLength 
        ? gameConfigStr.substring(0, maxStringLength) + '...'
        : gameConfigStr;
      const resultData = resultDataStr.length > maxStringLength
        ? resultDataStr.substring(0, maxStringLength) + '...'
        : resultDataStr;
      const entropyProof = entropyProofStr.length > maxStringLength
        ? entropyProofStr.substring(0, maxStringLength) + '...'
        : entropyProofStr;

      console.log('📤 MOCA CONTRACT LOGGER: Calling contract with params:', {
        gameId,
        gameType,
        userAddress,
        betAmount: betAmount.toString(),
        payoutAmount: payoutAmount.toString(),
        isWin
      });

      // Call contract function with explicit gas limit
      // Skip gas estimation to avoid issues with large strings and nonce problems
      // Use a fixed high gas limit that should cover most cases
      const gasLimit = 5000000; // 5M gas limit (should be enough for large strings)
      const gasPrice = ethers.parseUnits('1', 'gwei');
      
      // Build transaction data manually to avoid estimation
      const txData = this.contract.interface.encodeFunctionData('logGame', [
        gameId,
        gameType,
        userAddress,
        betAmount,
        payoutAmount,
        isWin,
        gameConfig,
        resultData,
        entropyProof
      ]);
      
      // Get nonce manually - try 'latest' first, then 'pending' as fallback
      // Sometimes RPC doesn't track pending transactions correctly
      let nonce;
      try {
        // First try with 'latest' to get confirmed nonce
        const latestNonce = await this.provider.getTransactionCount(this.treasuryWallet.address, 'latest');
        // Then check pending to see if there are unconfirmed transactions
        const pendingNonce = await this.provider.getTransactionCount(this.treasuryWallet.address, 'pending');
        
        // Use the higher of the two (pending should be >= latest)
        nonce = Math.max(latestNonce, pendingNonce);
        
        console.log(`🔢 Nonce: latest=${latestNonce}, pending=${pendingNonce}, using=${nonce}`);
      } catch (error) {
        console.warn('⚠️ Failed to get nonce, using latest:', error.message);
        nonce = await this.provider.getTransactionCount(this.treasuryWallet.address, 'latest');
      }
      
      // Retry mechanism for nonce errors
      let retries = 3;
      let lastError = null;
      
      while (retries > 0) {
        try {
          // Create and send transaction
          const tx = await this.treasuryWallet.sendTransaction({
            to: this.contractAddress,
            data: txData,
            gasLimit: gasLimit,
            gasPrice: gasPrice,
            nonce: nonce
          });
          
          // Success - return the transaction
          return await this.handleTransactionSuccess(tx, gameId, gameType);
          
        } catch (error) {
          lastError = error;
          
          // Check if it's a nonce error
          const isNonceError = error.message && error.message.includes('invalid nonce') || 
                              (error.error && error.error.message && error.error.message.includes('invalid nonce'));
          
          if (isNonceError) {
            console.warn(`⚠️ Nonce error (attempt ${4 - retries}), updating nonce...`);
            
            // Try to extract expected nonce from error message
            const errorMsg = error.error?.message || error.message || '';
            const expectedNonceMatch = errorMsg.match(/expected (\d+)/);
            if (expectedNonceMatch) {
              const expectedNonce = parseInt(expectedNonceMatch[1], 10);
              console.log(`📌 Using expected nonce from error: ${expectedNonce}`);
              nonce = expectedNonce;
            } else {
              // Wait a bit and refresh nonce
              await new Promise(resolve => setTimeout(resolve, 1000));
              // Try pending, then latest, then use the higher one
              const pendingNonce = await this.provider.getTransactionCount(this.treasuryWallet.address, 'pending');
              const latestNonce = await this.provider.getTransactionCount(this.treasuryWallet.address, 'latest');
              nonce = Math.max(pendingNonce, latestNonce, nonce + 1);
              console.log(`🔄 Updated nonce: latest=${latestNonce}, pending=${pendingNonce}, using=${nonce}`);
            }
            
            retries--;
          } else {
            // Not a nonce error, throw immediately
            throw error;
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new Error('Failed to send transaction after retries');

    } catch (error) {
      console.error('❌ MOCA CONTRACT LOGGER: Failed to log game result:', error);
      
      // Return detailed error information
      return {
        success: false,
        error: error.message || 'Unknown error',
        transactionHash: null,
        blockNumber: null,
        mocaExplorerUrl: null,
        contractAddress: this.contractAddress,
        network: 'moca-testnet'
      };
    }
  }

  /**
   * Handle successful transaction
   * @private
   */
  async handleTransactionSuccess(tx, gameId, gameType) {
    console.log('📤 MOCA CONTRACT LOGGER: Transaction sent:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log('✅ MOCA CONTRACT LOGGER: Game result logged successfully');
    console.log(`🔗 Transaction: ${tx.hash}`);
    console.log(`📦 Block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);

    // Parse events
    const gameLoggedEvent = receipt.logs.find(log => {
      try {
        const parsed = this.contract.interface.parseLog(log);
        return parsed && parsed.name === 'GameLogged';
      } catch {
        return false;
      }
    });

    let eventData = null;
    if (gameLoggedEvent) {
      try {
        const parsed = this.contract.interface.parseLog(gameLoggedEvent);
        eventData = {
          gameId: parsed.args.gameId,
          gameType: parsed.args.gameType,
          userAddress: parsed.args.userAddress,
          betAmount: parsed.args.betAmount.toString(),
          payoutAmount: parsed.args.payoutAmount.toString(),
          isWin: parsed.args.isWin,
          timestamp: parsed.args.timestamp.toString()
        };
        console.log('📊 MOCA CONTRACT LOGGER: Event data:', eventData);
      } catch (error) {
        console.warn('⚠️ MOCA CONTRACT LOGGER: Failed to parse event:', error);
      }
    }

    return {
      success: true,
      gameId: gameId,
      gameType: gameType,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      mocaExplorerUrl: `${this.networkConfig.explorerUrl}/tx/${tx.hash}`,
      contractAddress: this.contractAddress,
      eventData: eventData,
      network: 'moca-testnet',
      timestamp: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * Get game log from contract
   * @param {string} gameId - Game ID
   * @returns {Promise<Object>} Game log data
   */
  async getGameLog(gameId) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const gameLog = await this.contract.getGameLog(gameId);
      
      return {
        gameId: gameLog.gameId,
        gameType: gameLog.gameType,
        userAddress: gameLog.userAddress,
        betAmount: gameLog.betAmount.toString(),
        payoutAmount: gameLog.payoutAmount.toString(),
        isWin: gameLog.isWin,
        gameConfig: JSON.parse(gameLog.gameConfig || '{}'),
        resultData: JSON.parse(gameLog.resultData || '{}'),
        entropyProof: JSON.parse(gameLog.entropyProof || '{}'),
        timestamp: gameLog.timestamp.toString(),
        blockNumber: gameLog.blockNumber.toString()
      };

    } catch (error) {
      console.error('❌ MOCA CONTRACT LOGGER: Failed to get game log:', error);
      throw error;
    }
  }

  /**
   * Get logger statistics from contract
   * @returns {Promise<Object>} Logger statistics
   */
  async getLoggerStats() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const [totalLogs, totalGasUsed, lastLogger, averageGasPerLog] = await this.contract.getLoggerStats();
      
      return {
        totalLogs: totalLogs.toString(),
        totalGasUsed: totalGasUsed.toString(),
        lastLogger: lastLogger,
        averageGasPerLog: averageGasPerLog.toString(),
        contractAddress: this.contractAddress
      };

    } catch (error) {
      console.error('❌ MOCA CONTRACT LOGGER: Failed to get logger stats:', error);
      throw error;
    }
  }

  /**
   * Get user's log count
   * @param {string} userAddress - User address
   * @returns {Promise<string>} User log count
   */
  async getUserLogCount(userAddress) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const count = await this.contract.getUserLogCount(userAddress);
      return count.toString();

    } catch (error) {
      console.error('❌ MOCA CONTRACT LOGGER: Failed to get user log count:', error);
      throw error;
    }
  }

  /**
   * Get game type log count
   * @param {string} gameType - Game type
   * @returns {Promise<string>} Game type log count
   */
  async getGameTypeLogCount(gameType) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const count = await this.contract.getGameTypeLogCount(gameType);
      return count.toString();

    } catch (error) {
      console.error('❌ MOCA CONTRACT LOGGER: Failed to get game type log count:', error);
      throw error;
    }
  }

  /**
   * Get user's games with pagination
   * @param {string} userAddress - User address
   * @param {number} offset - Starting index
   * @param {number} limit - Number of games to return
   * @returns {Promise<string[]>} Array of game IDs
   */
  async getUserGames(userAddress, offset = 0, limit = 20) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const gameIds = await this.contract.getUserGames(userAddress, offset, limit);
      return gameIds;

    } catch (error) {
      console.error('❌ MOCA CONTRACT LOGGER: Failed to get user games:', error);
      throw error;
    }
  }

  /**
   * Get games by type with pagination
   * @param {string} gameType - Game type
   * @param {number} offset - Starting index
   * @param {number} limit - Number of games to return
   * @returns {Promise<string[]>} Array of game IDs
   */
  async getGamesByType(gameType, offset = 0, limit = 20) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const gameIds = await this.contract.getGamesByType(gameType.toUpperCase(), offset, limit);
      return gameIds;

    } catch (error) {
      console.error('❌ MOCA CONTRACT LOGGER: Failed to get games by type:', error);
      throw error;
    }
  }

  /**
   * Get recent games with pagination
   * @param {number} offset - Starting index
   * @param {number} limit - Number of games to return
   * @returns {Promise<string[]>} Array of game IDs
   */
  async getRecentGames(offset = 0, limit = 20) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const gameIds = await this.contract.getRecentGames(offset, limit);
      return gameIds;

    } catch (error) {
      console.error('❌ MOCA CONTRACT LOGGER: Failed to get recent games:', error);
      throw error;
    }
  }

  /**
   * Get network configuration
   * @returns {Object} Network configuration
   */
  getNetworkConfig() {
    return this.networkConfig;
  }

  /**
   * Get explorer URL for transaction
   * @param {string} txHash - Transaction hash
   * @returns {string} Explorer URL
   */
  getExplorerUrl(txHash) {
    if (!txHash) return this.networkConfig.explorerUrl;
    return `${this.networkConfig.explorerUrl}/tx/${txHash}`;
  }

  /**
   * Get contract explorer URL
   * @returns {string} Contract explorer URL
   */
  getContractExplorerUrl() {
    if (!this.contractAddress) return null;
    return `${this.networkConfig.explorerUrl}/address/${this.contractAddress}`;
  }

  /**
   * Get service info
   * @returns {Object} Service information
   */
  getServiceInfo() {
    return {
      name: 'MocaGameLoggerService',
      network: this.networkConfig.name,
      chainId: this.networkConfig.chainId,
      contractAddress: this.contractAddress,
      isInitialized: this.isInitialized,
      treasuryAddress: this.treasuryWallet?.address || null
    };
  }
}

// Create singleton instance
const mocaGameLoggerService = new MocaGameLoggerService();

export default mocaGameLoggerService;
