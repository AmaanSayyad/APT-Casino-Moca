/**
 * Moca Stack Service
 * Integrates with Moca Stack for enhanced blockchain features
 * 
 * Features:
 * - AIR (Autonomous Incentive Rewards) integration
 * - Moca ID authentication
 * - Realm Points tracking
 * - Enhanced transaction processing
 */

import { ethers } from 'ethers';

class MocaStackService {
  constructor() {
    this.initialized = false;
    this.airApiKey = process.env.NEXT_PUBLIC_MOCA_AIR_API_KEY;
    this.airApiUrl = process.env.NEXT_PUBLIC_MOCA_AIR_API_URL || 'https://api.moca.network/air';
    this.mocaIdApiUrl = process.env.NEXT_PUBLIC_MOCA_ID_API_URL || 'https://api.moca.network/id';
    this.realmApiUrl = process.env.NEXT_PUBLIC_MOCA_REALM_API_URL || 'https://api.moca.network/realm';
  }

  /**
   * Initialize Moca Stack connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🔧 Initializing Moca Stack...');

      // Check if AIR credentials are available
      if (!this.airApiKey) {
        console.warn('⚠️ Moca AIR API key not found. Some features will be limited.');
        return false;
      }

      // Verify API connection
      const isConnected = await this.verifyConnection();
      
      if (isConnected) {
        this.initialized = true;
        console.log('✅ Moca Stack initialized successfully');
        return true;
      } else {
        console.error('❌ Failed to connect to Moca Stack');
        return false;
      }
    } catch (error) {
      console.error('❌ Moca Stack initialization error:', error);
      return false;
    }
  }

  /**
   * Verify connection to Moca Stack APIs
   */
  async verifyConnection() {
    try {
      const response = await fetch(`${this.airApiUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.airApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Connection verification failed:', error);
      return false;
    }
  }

  /**
   * Get or create Moca ID for user
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} Moca ID data
   */
  async getMocaId(walletAddress) {
    try {
      if (!this.airApiKey) {
        throw new Error('AIR API key not configured');
      }

      const response = await fetch(`${this.mocaIdApiUrl}/user/${walletAddress}`, {
        headers: {
          'Authorization': `Bearer ${this.airApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Moca ID: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        mocaId: data.mocaId,
        username: data.username,
        realmPoints: data.realmPoints || 0,
        level: data.level || 1,
        achievements: data.achievements || []
      };
    } catch (error) {
      console.error('Error fetching Moca ID:', error);
      return null;
    }
  }

  /**
   * Award AIR (Autonomous Incentive Rewards) to user
   * @param {string} walletAddress - User's wallet address
   * @param {number} amount - Amount of AIR to award
   * @param {string} reason - Reason for the reward
   * @returns {Promise<Object>} Reward transaction data
   */
  async awardAIR(walletAddress, amount, reason = 'gameplay') {
    try {
      if (!this.airApiKey) {
        throw new Error('AIR API key not configured');
      }

      const response = await fetch(`${this.airApiUrl}/reward`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.airApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          amount,
          reason,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to award AIR: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Awarded ${amount} AIR to ${walletAddress}`);
      
      return {
        success: true,
        transactionId: data.transactionId,
        amount: data.amount,
        newBalance: data.newBalance
      };
    } catch (error) {
      console.error('Error awarding AIR:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's AIR balance
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<number>} AIR balance
   */
  async getAIRBalance(walletAddress) {
    try {
      if (!this.airApiKey) {
        return 0;
      }

      const response = await fetch(`${this.airApiUrl}/balance/${walletAddress}`, {
        headers: {
          'Authorization': `Bearer ${this.airApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch AIR balance: ${response.statusText}`);
      }

      const data = await response.json();
      return data.balance || 0;
    } catch (error) {
      console.error('Error fetching AIR balance:', error);
      return 0;
    }
  }

  /**
   * Track game activity for Realm Points
   * @param {string} walletAddress - User's wallet address
   * @param {Object} gameData - Game activity data
   * @returns {Promise<Object>} Realm points update
   */
  async trackGameActivity(walletAddress, gameData) {
    try {
      if (!this.airApiKey) {
        return { success: false, message: 'AIR not configured' };
      }

      const response = await fetch(`${this.realmApiUrl}/activity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.airApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress,
          gameType: gameData.gameType,
          betAmount: gameData.betAmount,
          won: gameData.won,
          winAmount: gameData.winAmount,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to track activity: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        realmPointsEarned: data.pointsEarned,
        totalRealmPoints: data.totalPoints,
        levelUp: data.levelUp || false
      };
    } catch (error) {
      console.error('Error tracking game activity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's Realm Points and level
   * @param {string} walletAddress - User's wallet address
   * @returns {Promise<Object>} Realm data
   */
  async getRealmData(walletAddress) {
    try {
      if (!this.airApiKey) {
        return { points: 0, level: 1 };
      }

      const response = await fetch(`${this.realmApiUrl}/user/${walletAddress}`, {
        headers: {
          'Authorization': `Bearer ${this.airApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Realm data: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        points: data.realmPoints || 0,
        level: data.level || 1,
        rank: data.rank || null,
        nextLevelPoints: data.nextLevelPoints || 100
      };
    } catch (error) {
      console.error('Error fetching Realm data:', error);
      return { points: 0, level: 1 };
    }
  }

  /**
   * Enhanced transaction with Moca Stack features
   * @param {Object} txData - Transaction data
   * @returns {Promise<Object>} Enhanced transaction result
   */
  async enhancedTransaction(txData) {
    try {
      // Add Moca Stack metadata to transaction
      const enhancedTx = {
        ...txData,
        mocaStack: {
          version: '1.0',
          features: ['AIR', 'RealmPoints'],
          timestamp: Date.now()
        }
      };

      // Track transaction for rewards
      if (txData.walletAddress) {
        await this.trackGameActivity(txData.walletAddress, {
          gameType: txData.gameType,
          betAmount: txData.betAmount,
          won: txData.won,
          winAmount: txData.winAmount
        });
      }

      return enhancedTx;
    } catch (error) {
      console.error('Error enhancing transaction:', error);
      return txData;
    }
  }

  /**
   * Check if Moca Stack is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.initialized && !!this.airApiKey;
  }
}

// Export singleton instance
const mocaStackService = new MocaStackService();
export default mocaStackService;
