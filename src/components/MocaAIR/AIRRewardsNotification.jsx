"use client";

import React, { useEffect, useState } from 'react';
import { FaCoins, FaStar, FaTimes } from 'react-icons/fa';

/**
 * AIR Rewards Notification
 * Shows rewards earned after a game
 */
const AIRRewardsNotification = ({ rewards, onClose, autoClose = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [autoClose, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300); // Wait for animation
    }
  };

  if (!rewards || !isVisible) return null;

  return (
    <div className={`fixed top-20 right-4 z-50 transition-all duration-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-2xl p-4 min-w-[300px] border border-purple-400/30">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <FaStar className="text-yellow-300 text-sm" />
            </div>
            <h3 className="text-white font-bold text-lg">Rewards Earned!</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Rewards */}
        <div className="space-y-2">
          {/* AIR Reward */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCoins className="text-yellow-300" />
              <span className="text-white text-sm">AIR Reward</span>
            </div>
            <span className="text-white font-bold text-lg">
              +{rewards.airReward}
            </span>
          </div>

          {/* Realm Points */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaStar className="text-purple-300" />
              <span className="text-white text-sm">Realm Points</span>
            </div>
            <span className="text-white font-bold text-lg">
              +{rewards.realmPoints}
            </span>
          </div>

          {/* Multiplier */}
          {rewards.multiplier && rewards.multiplier !== 1 && (
            <div className="text-center pt-2 border-t border-white/20">
              <span className="text-white/80 text-xs">
                Multiplier: <span className="font-bold text-yellow-300">{rewards.multiplier}x</span>
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {autoClose && (
          <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full transition-all"
              style={{
                animation: `shrink ${autoClose}ms linear`,
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default AIRRewardsNotification;
