/**
 * Game Result Logger Service
 * Automatically logs game results to Moca Chain after entropy generation
 */

import mocaGameLoggerService from './MocaGameLoggerService.js';

class GameResultLogger {
  constructor() {
    this.isEnabled = true;
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
  }

  /**
   * Log game result after entropy generation
   * @param {Object} gameData - Complete game data
   * @returns {Promise<Object>} Log result
   */
  async logGameResult(gameData) {
    if (!this.isEnabled) {
      console.log('🎮 GAME LOGGER: Logging disabled, skipping...');
      return { success: false, reason: 'disabled' };
    }

    try {
      console.log(`🎮 GAME LOGGER: Logging ${gameData.gameType} result...`);

      // Prepare game result for Moca logging
      const mocaGameResult = this.prepareGameResultForMoca(gameData);

      // Log to Moca Chain with retry logic
      let lastError = null;
      for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
        try {
          console.log(`🎮 GAME LOGGER: Attempt ${attempt}/${this.retryAttempts}...`);
          
          const result = await mocaGameLoggerService.logGameResult(mocaGameResult);
          
          console.log('✅ GAME LOGGER: Successfully logged to Moca Chain');
          console.log('🆔 Game ID:', result.gameId);
          console.log('🔗 Moca TX:', result.transactionHash);

          return {
            success: true,
            gameId: result.gameId,
            mocaTransactionHash: result.transactionHash,
            mocaExplorerUrl: result.mocaExplorerUrl,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed
          };

        } catch (error) {
          lastError = error;
          console.warn(`⚠️ GAME LOGGER: Attempt ${attempt} failed:`, error.message);
          
          if (attempt < this.retryAttempts) {
            console.log(`⏳ GAME LOGGER: Retrying in ${this.retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          }
        }
      }

      // All attempts failed
      console.error('❌ GAME LOGGER: All retry attempts failed:', lastError?.message);
      return {
        success: false,
        error: lastError?.message || 'Unknown error',
        attempts: this.retryAttempts
      };

    } catch (error) {
      console.error('❌ GAME LOGGER: Unexpected error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepare game result data for Moca logging
   * @param {Object} gameData - Original game data
   * @returns {Object} Formatted game result
   */
  prepareGameResultForMoca(gameData) {
    const {
      player,
      gameType,
      gameConfig,
      gameResult,
      betAmount,
      winAmount,
      multiplier,
      entropyProof,
      timestamp
    } = gameData;

    // Determine game sub-type based on game config
    const gameSubType = this.determineGameSubType(gameType, gameConfig);

    // Create game data JSON
    const gameDataJson = {
      gameConfig: gameConfig,
      gameResult: gameResult,
      timestamp: timestamp || Date.now(),
      version: '1.0'
    };

    return {
      player: player,
      gameType: gameType.toUpperCase(),
      gameSubType: gameSubType,
      betAmount: betAmount.toString(),
      won: parseFloat(winAmount) > 0,
      winAmount: winAmount.toString(),
      multiplier: multiplier.toString(),
      entropyTxHash: entropyProof?.transactionHash || null,
      entropySequenceNumber: entropyProof?.sequenceNumber || 0,
      randomValue: entropyProof?.randomValue || gameResult?.randomValue || 0,
      gameData: JSON.stringify(gameDataJson)
    };
  }

  /**
   * Determine game sub-type from game configuration
   * @param {string} gameType - Game type
   * @param {Object} gameConfig - Game configuration
   * @returns {string} Game sub-type
   */
  determineGameSubType(gameType, gameConfig) {
    switch (gameType.toUpperCase()) {
      case 'MINES':
        return `${gameConfig.minesCount || 9}-mines`;
      
      case 'PLINKO':
        return gameConfig.riskLevel || 'medium';
      
      case 'ROULETTE':
        if (gameConfig.betType) {
          return gameConfig.betType;
        }
        if (gameConfig.bets && gameConfig.bets.length > 0) {
          return `multiple-${gameConfig.bets.length}`;
        }
        return 'unknown';
      
      case 'WHEEL':
        return gameConfig.segments ? `${gameConfig.segments}-segments` : 'fortune';
      
      default:
        return 'unknown';
    }
  }

  /**
   * Log multiple game results in batch
   * @param {Array} gameDataArray - Array of game data objects
   * @returns {Promise<Array>} Array of log results
   */
  async logGameResultsBatch(gameDataArray) {
    console.log(`🎮 GAME LOGGER: Logging batch of ${gameDataArray.length} games...`);
    
    const results = [];
    
    for (let i = 0; i < gameDataArray.length; i++) {
      const gameData = gameDataArray[i];
      console.log(`🎮 GAME LOGGER: Processing game ${i + 1}/${gameDataArray.length}...`);
      
      try {
        const result = await this.logGameResult(gameData);
        results.push({
          index: i,
          gameType: gameData.gameType,
          ...result
        });
        
        // Small delay between batch items
        if (i < gameDataArray.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`❌ GAME LOGGER: Error processing game ${i + 1}:`, error);
        results.push({
          index: i,
          gameType: gameData.gameType,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ GAME LOGGER: Batch complete - ${successCount}/${gameDataArray.length} successful`);
    
    return results;
  }

  /**
   * Create enhanced game history entry with Moca log info
   * @param {Object} originalGameData - Original game data
   * @param {Object} mocaLogResult - Moca logging result
   * @returns {Object} Enhanced game history entry
   */
  createEnhancedGameHistoryEntry(originalGameData, mocaLogResult) {
    const baseEntry = {
      id: Date.now().toString(),
      gameType: originalGameData.gameType,
      player: originalGameData.player,
      betAmount: originalGameData.betAmount,
      winAmount: originalGameData.winAmount,
      multiplier: originalGameData.multiplier,
      won: parseFloat(originalGameData.winAmount) > 0,
      timestamp: originalGameData.timestamp || Date.now(),
      entropyProof: originalGameData.entropyProof
    };

    // Add Moca log information if successful
    if (mocaLogResult.success) {
      baseEntry.mocaLogTx = mocaLogResult.mocaTransactionHash;
      baseEntry.mocaGameId = mocaLogResult.gameId;
      baseEntry.mocaExplorerUrl = mocaLogResult.mocaExplorerUrl;
      baseEntry.mocaBlockNumber = mocaLogResult.blockNumber;
    }

    return baseEntry;
  }

  /**
   * Enable/disable automatic logging
   * @param {boolean} enabled - Whether to enable logging
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🎮 GAME LOGGER: Automatic logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update retry configuration
   * @param {number} attempts - Number of retry attempts
   * @param {number} delay - Delay between retries in milliseconds
   */
  setRetryConfig(attempts, delay) {
    this.retryAttempts = attempts;
    this.retryDelay = delay;
    console.log(`🎮 GAME LOGGER: Retry config updated - ${attempts} attempts, ${delay}ms delay`);
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay,
      mocaContract: process.env.NEXT_PUBLIC_MOCA_GAME_LOGGER_CONTRACT
    };
  }
}

// Create singleton instance
const gameResultLogger = new GameResultLogger();

export default gameResultLogger;