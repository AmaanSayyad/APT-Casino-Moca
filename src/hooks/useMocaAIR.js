"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import mocaAIRService from '@/services/MocaAIRService';

/**
 * Hook for Moca AIR integration
 * Uses official @mocanetwork/airkit SDK
 */
export const useMocaAIR = () => {
  const { address, isConnected } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rewards, setRewards] = useState({ airReward: 0, realmPoints: 0 });

  // Initialize AIR Service
  useEffect(() => {
    const init = async () => {
      const enabled = process.env.NEXT_PUBLIC_ENABLE_MOCA_AIR === 'true';
      
      if (enabled) {
        const success = await mocaAIRService.initialize();
        setIsInitialized(success);
      }
    };

    init();
  }, []);

  // Listen for credential events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCredentialIssued = (event) => {
      console.log('🎉 Credential issued event:', event.detail);
      // Handle credential issued
    };

    const handleVerificationComplete = (event) => {
      console.log('✅ Verification complete event:', event.detail);
      // Handle verification complete
    };

    window.addEventListener('moca-credential-issued', handleCredentialIssued);
    window.addEventListener('moca-verification-complete', handleVerificationComplete);

    return () => {
      window.removeEventListener('moca-credential-issued', handleCredentialIssued);
      window.removeEventListener('moca-verification-complete', handleVerificationComplete);
    };
  }, []);

  /**
   * Track game activity and calculate rewards
   */
  const trackGameActivity = useCallback(async (gameData) => {
    if (!address || !isInitialized) {
      return { success: false, error: 'Not initialized or no wallet connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await mocaAIRService.trackActivity(address, gameData);
      
      if (result.success) {
        setRewards(result.rewards);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track activity';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [address, isInitialized]);

  /**
   * Issue gaming credential
   */
  const issueGamingCredential = useCallback(async (gameData) => {
    if (!address || !isInitialized) {
      return { success: false, error: 'Not initialized or no wallet connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await mocaAIRService.issueGamingCredential(address, gameData);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to issue credential';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [address, isInitialized]);

  /**
   * Get service status
   */
  const getStatus = useCallback(() => {
    return mocaAIRService.getStatus();
  }, []);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    rewards,
    isAvailable: mocaAIRService.isAvailable(),
    isConnected,
    address,

    // Actions
    trackGameActivity,
    issueGamingCredential,
    getStatus,
  };
};

export default useMocaAIR;
