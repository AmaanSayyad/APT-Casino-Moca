"use client";

import React from 'react';
import { useMocaStack } from '@/hooks/useMocaStack';
import { FaTrophy, FaStar, FaCoins } from 'react-icons/fa';

/**
 * Moca Stack Widget
 * Displays user's AIR balance, Realm Points, and Moca ID
 */
const MocaStackWidget = () => {
  const { mocaId, airBalance, realmData, isLoading, isEnabled, isAvailable } = useMocaStack();

  // Don't render if Moca Stack is not enabled
  if (!isEnabled || !isAvailable) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-purple-500/20 rounded w-3/4"></div>
            <div className="h-4 bg-purple-500/20 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <FaStar className="text-white text-sm" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Moca Stack</h3>
            {mocaId && (
              <p className="text-white/60 text-xs">ID: {mocaId.mocaId?.slice(0, 8)}...</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* AIR Balance */}
        <div className="bg-black/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FaCoins className="text-yellow-400 text-sm" />
            <span className="text-white/60 text-xs">AIR Balance</span>
          </div>
          <p className="text-white font-bold text-lg">{airBalance.toLocaleString()}</p>
        </div>

        {/* Realm Points */}
        <div className="bg-black/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FaTrophy className="text-purple-400 text-sm" />
            <span className="text-white/60 text-xs">Realm Points</span>
          </div>
          <p className="text-white font-bold text-lg">{realmData.points.toLocaleString()}</p>
        </div>
      </div>

      {/* Level Progress */}
      {realmData.level && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/60 text-xs">Level {realmData.level}</span>
            {realmData.nextLevelPoints && (
              <span className="text-white/60 text-xs">
                {realmData.points} / {realmData.nextLevelPoints}
              </span>
            )}
          </div>
          <div className="w-full bg-black/30 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: realmData.nextLevelPoints
                  ? `${(realmData.points / realmData.nextLevelPoints) * 100}%`
                  : '0%'
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-white/40 text-xs text-center">
          Earn AIR rewards and Realm Points by playing games
        </p>
      </div>
    </div>
  );
};

export default MocaStackWidget;
