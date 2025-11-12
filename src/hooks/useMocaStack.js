"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import mocaStackService from '@/services/MocaStackService';

/**
 * Hook for Moca Stack integration
 * Provides AIR rewards, Moca ID, and Realm Points functionality
 */
export const useMocaStack = () => {
  const { address, isConnected } = useAccount();
  const [mocaId, setMocaId] = useState(null);
  const [airBalance, setAirBalance] = useState(0);
  const [realmData, setRealmData] = useState({ points: 0, level: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  // Initialize Moca Stack
  useEffect(() => {
    const init = async () => {
      const enabled = process.env.NEXT_PUBLIC_ENABLE_MOCA_STACK === 'true';
      setIsEnabled(enabled);

      if (enabled) {
        await mocaStackService.initialize();
      }
    };

    init();
  }, []);

  // Load user data when wallet connects
  useEffect(() => {
    if (isConnected && address && isEnabled) {
      loadUserData();
    }
  }, [isConnected, address, isEnabled]);

  /**
   * Load all user data from Moca Stack
   */
  const loadUserData = async () => {
    if (!address || !isEnabled) return;

    setIsLoading(true);
    try {
      // Load Moca ID
      const idData = await mocaStackService.getMocaId(address);
      setMocaId(idData);

      // Load AIR balance
      const balance = await mocaStackService.getAIRBalance(address);
      setAirBalance(balance);

      // Load Realm data
      const realm = await mocaStackService.getRealmData(address);
      setRealmData(realm);
    } catch (error) {
      console.error('Error loading Moca Stack data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Award AIR to user
   */
  const awardAIR = async (amount, reason) => {
    if (!address || !isEnabled) return null;

    try {
      const result = await mocaStackService.awardAIR(address, amount, reason);
      
      if (result.success) {
        // Update local balance
        setAirBalance(result.newBalance);
      }

      return result;
    } catch (error) {
      console.error('Error awarding AIR:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Track game activity for Realm Points
   */
  const trackGameActivity = async (gameData) => {
    if (!address || !isEnabled) return null;

    try {
      const result = await mocaStackService.trackGameActivity(address, gameData);
      
      if (result.success) {
        // Update local realm data
        setRealmData(prev => ({
          ...prev,
          points: result.totalRealmPoints
        }));
      }

      return result;
    } catch (error) {
      console.error('Error tracking game activity:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Refresh all user data
   */
  const refresh = async () => {
    await loadUserData();
  };

  return {
    // State
    mocaId,
    airBalance,
    realmData,
    isLoading,
    isEnabled,
    isAvailable: mocaStackService.isAvailable(),

    // Actions
    awardAIR,
    trackGameActivity,
    refresh,
    loadUserData
  };
};

export default useMocaStack;
