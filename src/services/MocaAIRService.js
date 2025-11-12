/**
 * Moca AIR (Autonomous Incentive Rewards) Service
 * Official integration with @mocanetwork/airkit
 * 
 * Based on: https://github.com/MocaNetwork/air-credential-example
 */

import { AirService, BUILD_ENV } from '@mocanetwork/airkit';

class MocaAIRService {
  constructor() {
    this.airService = null;
    this.initialized = false;
    this.partnerId = process.env.NEXT_PUBLIC_MOCA_PARTNER_ID;
    this.environment = process.env.NEXT_PUBLIC_MOCA_ENV || BUILD_ENV.SANDBOX;
    
    // Environment configurations
    this.environmentConfigs = {
      [BUILD_ENV.STAGING]: {
        widgetUrl: 'https://credential-widget.test.air3.com',
        apiUrl: 'https://credential.api.test.air3.com',
      },
      [BUILD_ENV.SANDBOX]: {
        widgetUrl: 'https://credential-widget.sandbox.air3.com',
        apiUrl: 'https://credential.api.sandbox.air3.com',
      },
    };
  }

  /**
   * Initialize AIR Service
   */
  async initialize() {
    if (this.initialized) {
      console.log('✅ Moca AIR Service already initialized');
      return true;
    }

    try {
      console.log('🔧 Initializing Moca AIR Service...');

      if (!this.partnerId) {
        console.warn('⚠️ Partner ID not configured. AIR features will be limited.');
        return false;
      }

      const config = this.getEnvironmentConfig();

      // Initialize AirService
      this.airService = new AirService({
        partnerId: this.partnerId,
        widgetUrl: config.widgetUrl,
        apiUrl: config.apiUrl,
        theme: 'auto',
        locale: 'en',
      });

      // Set up event listeners
      this.setupEventListeners();

      this.initialized = true;
      console.log('✅ Moca AIR Service initialized successfully');
      console.log('📍 Environment:', this.environment);
      console.log('🔗 Widget URL:', config.widgetUrl);
      console.log('🔗 API URL:', config.apiUrl);

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Moca AIR Service:', error);
      return false;
    }
  }

  /**
   * Get environment configuration
   */
  getEnvironmentConfig() {
    return this.environmentConfigs[this.environment] || this.environmentConfigs[BUILD_ENV.SANDBOX];
  }

  /**
   * Setup event listeners for AIR widget
   */
  setupEventListeners() {
    if (!this.airService) return;

    // Listen for credential issuance completion
    this.airService.on('credential-issued', (data) => {
      console.log('🎉 Credential issued:', data);
      this.handleCredentialIssued(data);
    });

    // Listen for verification completion
    this.airService.on('verification-complete', (data) => {
      console.log('✅ Verification complete:', data);
      this.handleVerificationComplete(data);
    });

    // Listen for errors
    this.airService.on('error', (error) => {
      console.error('❌ AIR Service error:', error);
    });
  }

  /**
   * Handle credential issued event
   */
  handleCredentialIssued(data) {
    // Emit custom event for app to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('moca-credential-issued', { detail: data }));
    }
  }

  /**
   * Handle verification complete event
   */
  handleVerificationComplete(data) {
    // Emit custom event for app to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('moca-verification-complete', { detail: data }));
    }
  }

  /**
   * Issue a credential to user
   * @param {Object} params - Credential parameters
   * @returns {Promise<Object>}
   */
  async issueCredential(params) {
    if (!this.airService) {
      throw new Error('AIR Service not initialized');
    }

    const {
      authToken,
      credentialId,
      credentialSubject,
      issuerDid,
    } = params;

    try {
      console.log('📝 Issuing credential...');
      
      const result = await this.airService.issueCredential({
        authToken,
        credentialId,
        credentialSubject,
        issuerDid,
      });

      console.log('✅ Credential issued successfully');
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('❌ Failed to issue credential:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify a credential
   * @param {Object} params - Verification parameters
   * @returns {Promise<Object>}
   */
  async verifyCredential(params) {
    if (!this.airService) {
      throw new Error('AIR Service not initialized');
    }

    const {
      authToken,
      programId,
      redirectUrlForIssuer,
    } = params;

    try {
      console.log('🔍 Verifying credential...');
      
      const result = await this.airService.verifyCredential({
        authToken,
        programId,
        redirectUrlForIssuer,
      });

      console.log('✅ Credential verified successfully');
      return {
        success: true,
        data: result,
        status: result.status, // Compliant, NonCompliant, Pending, etc.
      };
    } catch (error) {
      console.error('❌ Failed to verify credential:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Issue gaming credential for player
   * @param {string} walletAddress - Player's wallet address
   * @param {Object} gameData - Game data
   * @returns {Promise<Object>}
   */
  async issueGamingCredential(walletAddress, gameData) {
    try {
      const credentialSubject = {
        walletAddress,
        gameType: gameData.gameType,
        totalGames: gameData.totalGames || 1,
        totalWins: gameData.totalWins || (gameData.won ? 1 : 0),
        totalBetAmount: gameData.betAmount,
        totalWinAmount: gameData.winAmount || 0,
        lastPlayedAt: Date.now(),
      };

      // This would require a JWT token from your backend
      // For now, we'll return a placeholder
      console.log('🎮 Gaming credential data prepared:', credentialSubject);

      return {
        success: true,
        message: 'Gaming credential prepared. Backend integration required for JWT.',
        credentialSubject,
      };
    } catch (error) {
      console.error('❌ Failed to prepare gaming credential:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Track player activity for AIR rewards
   * @param {string} walletAddress - Player's wallet address
   * @param {Object} activityData - Activity data
   * @returns {Promise<Object>}
   */
  async trackActivity(walletAddress, activityData) {
    try {
      console.log('📊 Tracking activity for:', walletAddress);
      console.log('📊 Activity data:', activityData);

      // Calculate rewards based on activity
      const rewards = this.calculateRewards(activityData);

      // Store activity (would typically be sent to backend)
      const activity = {
        walletAddress,
        ...activityData,
        rewards,
        timestamp: Date.now(),
      };

      console.log('🎁 Rewards calculated:', rewards);

      return {
        success: true,
        activity,
        rewards,
      };
    } catch (error) {
      console.error('❌ Failed to track activity:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate rewards based on activity
   * @param {Object} activityData - Activity data
   * @returns {Object} Rewards
   */
  calculateRewards(activityData) {
    const { gameType, betAmount, won, winAmount } = activityData;

    // Base rewards
    let airReward = Math.floor(betAmount * 10); // 10 AIR per MOCA bet
    let realmPoints = 1; // 1 point per game

    // Win bonuses
    if (won) {
      airReward += Math.floor(winAmount * 0.2); // 20% of win as bonus
      realmPoints += 5; // 5 bonus points for winning
    }

    // Game type multipliers
    const multipliers = {
      ROULETTE: 1.0,
      PLINKO: 1.2,
      MINES: 1.5,
      WHEEL: 1.1,
    };

    const multiplier = multipliers[gameType] || 1.0;
    airReward = Math.floor(airReward * multiplier);
    realmPoints = Math.floor(realmPoints * multiplier);

    return {
      airReward,
      realmPoints,
      multiplier,
    };
  }

  /**
   * Get service status
   * @returns {Object}
   */
  getStatus() {
    return {
      initialized: this.initialized,
      partnerId: this.partnerId,
      environment: this.environment,
      config: this.getEnvironmentConfig(),
    };
  }

  /**
   * Check if service is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.initialized && !!this.airService;
  }

  /**
   * Cleanup and destroy service
   */
  destroy() {
    if (this.airService) {
      // Remove event listeners if needed
      this.airService = null;
    }
    this.initialized = false;
    console.log('🧹 Moca AIR Service destroyed');
  }
}

// Export singleton instance
const mocaAIRService = new MocaAIRService();
export default mocaAIRService;
export { BUILD_ENV };
