"use client";

import { useState, useCallback } from 'react';

/**
 * Hook for managing AIR rewards notifications
 */
export const useAIRRewards = () => {
  const [currentRewards, setCurrentRewards] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  /**
   * Show rewards notification
   * @param {Object} rewards - Rewards object with airReward, realmPoints, multiplier
   */
  const showRewards = useCallback((rewards) => {
    if (rewards && (rewards.airReward > 0 || rewards.realmPoints > 0)) {
      setCurrentRewards(rewards);
      setShowNotification(true);
    }
  }, []);

  /**
   * Hide rewards notification
   */
  const hideRewards = useCallback(() => {
    setShowNotification(false);
    // Clear rewards after animation
    setTimeout(() => {
      setCurrentRewards(null);
    }, 300);
  }, []);

  /**
   * Extract rewards from API response
   * @param {Object} response - API response
   * @returns {Object|null} Rewards object or null
   */
  const extractRewards = useCallback((response) => {
    if (response?.mocaAIRRewards) {
      return response.mocaAIRRewards;
    }
    return null;
  }, []);

  return {
    currentRewards,
    showNotification,
    showRewards,
    hideRewards,
    extractRewards,
  };
};

export default useAIRRewards;
