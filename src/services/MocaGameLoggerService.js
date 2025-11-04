/**
 * Moca Game Logger Service
 * Handles game result logging to Moca Chain
 */

import { ethers, JsonRpcProvider, Contract, Wallet } from 'ethers';
import { TREASURY_CONFIG } from '../config/treasury.js';

class MocaGameLoggerService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isInitialized = false;
    
    // Contract ABI for MocaGameLogger
    this.contractABI = [
      "function logGame(address player, uint8 gameType, string gameSubType, uint256 betAmount, bool won, uint256 winAmount, uint256 multiplier, bytes32 entropyTxHash, uint64 entropySequenceNumber, bytes32 randomValue, string gameData) external",
      "function getGame(uint256 gameId) external view returns (tuple(uint256 gameId, address player, uint8 gameType, string gameSubType, uint256 betAmount, bool won, uint256 winAmount, uint256 multiplier, bytes32 entropyTxHash, uint64 entropySequenceNumber, bytes32 randomValue, uint256 timestamp, uint256 blockNumber, string gameData))",
      "function getPlayerGames(address player, uint256 offset, uint256 limit) external view returns (uint256[] memory)",
      "function getGamesByType(uint8 gameType, uint256 offset, uint256 limit) external view returns (uint256[] memory)",
      "function getRecentGames(uint256 limit) external view returns (uint256[] memory)",
      "function getGameStats() external view returns (uint256 totalGamesCount, uint256 totalBetAmountSum, uint256 totalWinAmountSum, uint256 houseEdge)",
      "function getGameTypeStats(uint8 gameType) external view returns (uint256 count, uint256 wins, uint256 betAmount, uint256 winAmount, uint256 winRate)",
      "function totalGames() external view returns (uint256)",
      "event GameLogged(uint256 indexed gameId, address indexed player, uint8 indexed gameType, string gameSubType, uint256 betAmount, bool won, uint256 winAmount, bytes32 entropyTxHash)"
    ];
    
    // Game type mapping
    this.GAME_TYPES = {
      MINES: 0,
      PLINKO: 1,
      ROULETTE: 2,
      WHEEL: 3
    };
  }

  /**
   * Initialize the Moca Game Logger service
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      console.log('🎮 MOCA LOGGER: Initializing game logging service...');

      // Initialize Moca Chain provider
      const mocaRpcUrl = process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || 'https://testnet-rpc.mocachain.org/';
      this.provider = new JsonRpcProvider(mocaRpcUrl);
      
      // Create Moca treasury wallet for signing transactions
      const mocaTreasuryKey = process.env.MOCA_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY;
      if (mocaTreasuryKey) {
        this.signer = new Wallet(mocaTreasuryKey, this.provider);
        console.log('🏦 MOCA LOGGER: Using Moca treasury wallet for signing');
        console.log(`📍 Moca Treasury address: ${this.signer.address}`);
      } else {
        throw new Error('Moca treasury private key not found');
      }

      // Get contract address
      const contractAddress = process.env.NEXT_PUBLIC_MOCA_GAME_LOGGER_CONTRACT;
      
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('MocaGameLogger contract not deployed');
      }

      // Initialize contract
      this.contract = new Contract(
        contractAddress,
        this.contractABI,
        this.signer
      );

      this.isInitialized = true;
      console.log('✅ MOCA LOGGER: Service initialized successfully');
      console.log(`📋 MocaGameLogger: ${contractAddress}`);
      console.log(`📋 Network: Moca Chain Testnet`);
      
      return true;
    } catch (error) {
      console.error('❌ MOCA LOGGER: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Log a game result to Moca Chain
   * @param {Object} gameResult - Game result data
   * @returns {Promise<Object>} Transaction result
   */
  async logGameResult(gameResult) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🎮 MOCA LOGGER: Logging ${gameResult.gameType} game result...`);
      
      const {
        player,
        gameType,
        gameSubType = '',
        betAmount,
        won,
        winAmount = 0,
        multiplier = 0,
        entropyTxHash,
        entropySequenceNumber = 0,
        randomValue,
        gameData = '{}'
      } = gameResult;

      // Validate required fields
      if (!player || !ethers.isAddress(player)) {
        throw new Error('Invalid player address');
      }
      
      if (!gameType || !(gameType.toUpperCase() in this.GAME_TYPES)) {
        throw new Error('Invalid game type');
      }
      
      console.log('🎮 MOCA LOGGER: betAmount validation:', { betAmount, type: typeof betAmount, parsed: parseFloat(betAmount) });
      
      if (!betAmount || parseFloat(betAmount) <= 0) {
        throw new Error('Invalid bet amount');
      }

      // Convert game type to number
      const gameTypeNum = this.GAME_TYPES[gameType.toUpperCase()];
      
      // Convert amounts to wei if they're in ether
      const betAmountWei = typeof betAmount === 'string' && betAmount.includes('.') 
        ? ethers.parseEther(betAmount.toString())
        : BigInt(betAmount);
        
      const winAmountWei = typeof winAmount === 'string' && winAmount.includes('.')
        ? ethers.parseEther(winAmount.toString())
        : BigInt(winAmount);

      // Convert multiplier to integer (multiply by 100)
      const multiplierInt = Math.floor(parseFloat(multiplier) * 100);

      // Convert entropy data
      const entropyTxHashBytes32 = entropyTxHash && entropyTxHash !== 'fallback_no_tx' 
        ? entropyTxHash 
        : ethers.ZeroHash;
        
      const randomValueBytes32 = randomValue 
        ? (typeof randomValue === 'string' && randomValue.startsWith('0x') 
           ? randomValue 
           : ethers.zeroPadValue(ethers.toBeHex(BigInt(randomValue)), 32))
        : ethers.ZeroHash;

      console.log('📊 MOCA LOGGER: Game data:', {
        player,
        gameType: gameTypeNum,
        gameSubType,
        betAmount: ethers.formatEther(betAmountWei),
        won,
        winAmount: ethers.formatEther(winAmountWei),
        multiplier: multiplierInt / 100,
        entropyTxHash: entropyTxHashBytes32,
        entropySequenceNumber,
        randomValue: randomValueBytes32
      });

      // Call the contract
      const tx = await this.contract.logGame(
        player,
        gameTypeNum,
        gameSubType,
        betAmountWei,
        won,
        winAmountWei,
        multiplierInt,
        entropyTxHashBytes32,
        BigInt(entropySequenceNumber),
        randomValueBytes32,
        gameData
      );

      console.log('✅ MOCA LOGGER: Game logging transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ MOCA LOGGER: Transaction confirmed in block:', receipt.blockNumber);

      // Extract game ID from logs
      let gameId = null;
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'GameLogged') {
            gameId = parsedLog.args.gameId;
            break;
          }
        } catch (_) {
          // ignore non-matching logs
        }
      }

      const result = {
        success: true,
        gameId: gameId ? gameId.toString() : null,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        mocaExplorerUrl: `https://testnet-scan.mocachain.org/tx/${tx.hash}`,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: Date.now()
      };

      console.log('✅ MOCA LOGGER: Game logged successfully');
      console.log('🆔 Game ID:', result.gameId);
      console.log('🔗 Moca Explorer:', result.mocaExplorerUrl);

      return result;
      
    } catch (error) {
      console.error('❌ MOCA LOGGER: Error logging game:', error);
      throw error;
    }
  }

  /**
   * Get game history for a player
   * @param {string} playerAddress - Player address
   * @param {number} offset - Starting index
   * @param {number} limit - Number of games to return
   * @returns {Promise<Array>} Array of game results
   */
  async getPlayerGameHistory(playerAddress, offset = 0, limit = 10) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`📜 MOCA LOGGER: Getting game history for ${playerAddress}...`);
      
      // Get game IDs
      const gameIds = await this.contract.getPlayerGames(playerAddress, offset, limit);
      
      // Get game details
      const games = [];
      for (const gameId of gameIds) {
        try {
          const game = await this.contract.getGame(gameId);
          games.push(this.formatGameResult(game));
        } catch (error) {
          console.warn(`⚠️ MOCA LOGGER: Error getting game ${gameId}:`, error.message);
        }
      }

      console.log(`✅ MOCA LOGGER: Retrieved ${games.length} games for player`);
      return games;
      
    } catch (error) {
      console.error('❌ MOCA LOGGER: Error getting player history:', error);
      throw error;
    }
  }

  /**
   * Get recent games
   * @param {number} limit - Number of games to return
   * @returns {Promise<Array>} Array of recent game results
   */
  async getRecentGames(limit = 20) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`📜 MOCA LOGGER: Getting ${limit} recent games...`);
      
      // Get game IDs
      const gameIds = await this.contract.getRecentGames(limit);
      
      // Get game details
      const games = [];
      for (const gameId of gameIds) {
        try {
          const game = await this.contract.getGame(gameId);
          games.push(this.formatGameResult(game));
        } catch (error) {
          console.warn(`⚠️ MOCA LOGGER: Error getting game ${gameId}:`, error.message);
        }
      }

      console.log(`✅ MOCA LOGGER: Retrieved ${games.length} recent games`);
      return games;
      
    } catch (error) {
      console.error('❌ MOCA LOGGER: Error getting recent games:', error);
      throw error;
    }
  }

  /**
   * Get game statistics
   * @returns {Promise<Object>} Game statistics
   */
  async getGameStats() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const stats = await this.contract.getGameStats();
      
      return {
        totalGames: stats.totalGamesCount.toString(),
        totalBetAmount: ethers.formatEther(stats.totalBetAmountSum),
        totalWinAmount: ethers.formatEther(stats.totalWinAmountSum),
        houseEdge: (Number(stats.houseEdge) / 100).toFixed(2) + '%'
      };
      
    } catch (error) {
      console.error('❌ MOCA LOGGER: Error getting stats:', error);
      throw error;
    }
  }

  /**
   * Format game result for display
   * @param {Object} game - Raw game data from contract
   * @returns {Object} Formatted game result
   */
  formatGameResult(game) {
    const gameTypeNames = ['MINES', 'PLINKO', 'ROULETTE', 'WHEEL'];
    
    return {
      gameId: game.gameId.toString(),
      player: game.player,
      gameType: gameTypeNames[game.gameType] || 'UNKNOWN',
      gameSubType: game.gameSubType,
      betAmount: ethers.formatEther(game.betAmount),
      won: game.won,
      winAmount: ethers.formatEther(game.winAmount),
      multiplier: (Number(game.multiplier) / 100).toFixed(2),
      entropyTxHash: game.entropyTxHash !== ethers.ZeroHash ? game.entropyTxHash : null,
      entropySequenceNumber: game.entropySequenceNumber.toString(),
      randomValue: game.randomValue,
      timestamp: Number(game.timestamp) * 1000, // Convert to milliseconds
      blockNumber: game.blockNumber.toString(),
      gameData: game.gameData,
      mocaExplorerUrl: `https://testnet-scan.mocachain.org/block/${game.blockNumber}`,
      arbitrumExplorerUrl: game.entropyTxHash !== ethers.ZeroHash 
        ? `https://sepolia.arbiscan.io/tx/${game.entropyTxHash}` 
        : null,
      // Add Moca transaction info if available
      mocaLogTx: null, // This will be populated by the game logging process
      mocaGameId: game.gameId.toString(),
      mocaBlockNumber: game.blockNumber.toString()
    };
  }

  /**
   * Get contract info
   * @returns {Object} Contract information
   */
  getContractInfo() {
    return {
      contractAddress: process.env.NEXT_PUBLIC_MOCA_GAME_LOGGER_CONTRACT,
      network: 'Moca Chain Testnet',
      chainId: 222888,
      explorerUrl: `https://testnet-scan.mocachain.org/address/${process.env.NEXT_PUBLIC_MOCA_GAME_LOGGER_CONTRACT}`
    };
  }
}

// Create singleton instance
const mocaGameLoggerService = new MocaGameLoggerService();

export default mocaGameLoggerService;