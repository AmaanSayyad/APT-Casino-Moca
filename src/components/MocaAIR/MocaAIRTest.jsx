"use client";

import React, { useEffect, useState } from 'react';
import { useMocaAIR } from '@/hooks/useMocaAIR';
import { useAccount } from 'wagmi';

/**
 * Moca AIR Test Component
 * Test the AIR integration and display status
 */
const MocaAIRTest = () => {
  const { address, isConnected } = useAccount();
  const { 
    isInitialized, 
    isLoading, 
    error, 
    rewards,
    trackGameActivity,
    getStatus 
  } = useMocaAIR();

  const [status, setStatus] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isInitialized) {
      const serviceStatus = getStatus();
      setStatus(serviceStatus);
    }
  }, [isInitialized, getStatus]);

  const handleTestTracking = async () => {
    const result = await trackGameActivity({
      gameType: 'ROULETTE',
      betAmount: 10,
      won: true,
      winAmount: 20
    });

    setTestResult(result);
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          Please connect your wallet to test Moca AIR integration
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Moca AIR Integration Test
        </h2>
        <p className="text-gray-600 text-sm">
          Test the AIR credential system integration
        </p>
      </div>

      {/* Status Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Initialized:</span>
            <span className={`font-medium ${isInitialized ? 'text-green-600' : 'text-red-600'}`}>
              {isInitialized ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Wallet Connected:</span>
            <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          {address && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-mono text-xs text-gray-900">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Section */}
      {status && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Partner ID:</span>
              <span className="font-mono text-xs text-gray-900">
                {status.partnerId?.slice(0, 8)}...
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Environment:</span>
              <span className="font-medium text-gray-900">{status.environment}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Widget URL:</span>
              <span className="text-xs text-gray-600 truncate max-w-xs">
                {status.config?.widgetUrl}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Current Rewards */}
      <div className="bg-purple-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Rewards</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">AIR Reward</p>
            <p className="text-2xl font-bold text-purple-600">{rewards.airReward}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">Realm Points</p>
            <p className="text-2xl font-bold text-blue-600">{rewards.realmPoints}</p>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <div>
        <button
          onClick={handleTestTracking}
          disabled={!isInitialized || isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Testing...' : 'Test Activity Tracking'}
        </button>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`rounded-lg p-4 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className="text-lg font-semibold mb-2">
            {testResult.success ? '✅ Test Successful' : '❌ Test Failed'}
          </h3>
          {testResult.success ? (
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                <strong>AIR Reward:</strong> {testResult.rewards?.airReward}
              </p>
              <p className="text-gray-700">
                <strong>Realm Points:</strong> {testResult.rewards?.realmPoints}
              </p>
              <p className="text-gray-700">
                <strong>Multiplier:</strong> {testResult.rewards?.multiplier}x
              </p>
            </div>
          ) : (
            <p className="text-red-800 text-sm">{testResult.error}</p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">ℹ️ Information</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• This test simulates a game activity tracking</li>
          <li>• Rewards are calculated based on bet amount and game outcome</li>
          <li>• AIR rewards: 10 AIR per MOCA bet + 20% win bonus</li>
          <li>• Realm points: 1 per game + 5 per win</li>
          <li>• Game type multipliers apply (ROULETTE: 1.0x)</li>
        </ul>
      </div>
    </div>
  );
};

export default MocaAIRTest;
