'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const GameHistory = ({ playerAddress = null, gameType = null }) => {
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedGame, setSelectedGame] = useState(null);

  const GAMES_PER_PAGE = 10;

  useEffect(() => {
    fetchGameHistory();
  }, [playerAddress, gameType, currentPage]);

  const fetchGameHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: GAMES_PER_PAGE.toString(),
        offset: (currentPage * GAMES_PER_PAGE).toString()
      });

      if (playerAddress) {
        params.append('player', playerAddress);
      }

      if (gameType) {
        params.append('gameType', gameType);
      }

      const response = await fetch(`/api/game-history?${params}`);
      const data = await response.json();

      if (data.success) {
        setGames(data.games);
        setStats(data.stats);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGameTypeIcon = (gameType) => {
    switch (gameType) {
      case 'MINES': return '💣';
      case 'PLINKO': return '🎯';
      case 'ROULETTE': return '🎰';
      case 'WHEEL': return '🎡';
      default: return '🎮';
    }
  };

  const getGameTypeColor = (gameType) => {
    switch (gameType) {
      case 'MINES': return 'text-red-400';
      case 'PLINKO': return 'text-blue-400';
      case 'ROULETTE': return 'text-green-400';
      case 'WHEEL': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const GameDetailsModal = ({ game, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {getGameTypeIcon(game.gameType)}
            {game.gameType} Game Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm">Game ID</label>
              <p className="text-white font-mono">{game.gameId}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Player</label>
              <p className="text-white font-mono">{formatAddress(game.player)}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Bet Amount</label>
              <p className="text-white">{parseFloat(game.betAmount).toFixed(4)} MOCA</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Result</label>
              <p className={`font-bold ${game.won ? 'text-green-400' : 'text-red-400'}`}>
                {game.won ? 'WIN' : 'LOSE'}
              </p>
            </div>
            {game.won && (
              <>
                <div>
                  <label className="text-gray-400 text-sm">Win Amount</label>
                  <p className="text-green-400">{parseFloat(game.winAmount).toFixed(4)} MOCA</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Multiplier</label>
                  <p className="text-yellow-400">{game.multiplier}x</p>
                </div>
              </>
            )}
            <div>
              <label className="text-gray-400 text-sm">Date</label>
              <p className="text-white">{formatDate(game.timestamp)}</p>
            </div>
            <div>
              <label className="text-gray-400 text-sm">Block Number</label>
              <p className="text-white font-mono">{game.blockNumber}</p>
            </div>
          </div>

          {game.gameSubType && (
            <div>
              <label className="text-gray-400 text-sm">Game Sub-Type</label>
              <p className="text-white">{game.gameSubType}</p>
            </div>
          )}

          <div className="border-t border-gray-700 pt-4">
            <label className="text-gray-400 text-sm">Entropy Information</label>
            <div className="mt-2 space-y-2">
              {game.entropyTxHash && (
                <div>
                  <label className="text-gray-400 text-xs">Arbitrum Entropy TX</label>
                  <div className="flex items-center gap-2">
                    <p className="text-blue-400 font-mono text-sm">{formatAddress(game.entropyTxHash)}</p>
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">ETH</span>
                    {game.arbitrumExplorerUrl && (
                      <a
                        href={game.arbitrumExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs"
                      >
                        View on Arbitrum ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="text-gray-400 text-xs">Moca Game Log TX</label>
                <div className="flex items-center gap-2">
                  <p className="text-purple-400 font-mono text-sm">Block #{game.blockNumber}</p>
                  <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">MOCA</span>
                  {game.mocaExplorerUrl && (
                    <a
                      href={game.mocaExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 text-xs"
                    >
                      View on Moca ↗
                    </a>
                  )}
                </div>
              </div>
              {game.entropySequenceNumber !== '0' && (
                <div>
                  <label className="text-gray-400 text-xs">Entropy Sequence</label>
                  <p className="text-gray-300 font-mono text-sm">{game.entropySequenceNumber}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading game history: {error}</p>
          <button
            onClick={fetchGameHistory}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          {playerAddress ? 'Your Game History' : 'Recent Games'}
        </h2>
        {stats && (
          <div className="text-right">
            <p className="text-gray-400 text-sm">Total Games: {stats.totalGames}</p>
            <p className="text-gray-400 text-sm">House Edge: {stats.houseEdge}</p>
          </div>
        )}
      </div>

      {games.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">No games found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {games.map((game) => (
              <motion.div
                key={game.gameId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 cursor-pointer transition-colors"
                onClick={() => setSelectedGame(game)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getGameTypeIcon(game.gameType)}</span>
                    <div>
                      <p className={`font-semibold ${getGameTypeColor(game.gameType)}`}>
                        {game.gameType}
                        {game.gameSubType && <span className="text-gray-400 ml-2">({game.gameSubType})</span>}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {formatAddress(game.player)} • {formatDate(game.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-white">
                      {parseFloat(game.betAmount).toFixed(4)} MOCA
                    </p>
                    <div className="flex items-center gap-2">
                      <p className={`font-bold ${game.won ? 'text-green-400' : 'text-red-400'}`}>
                        {game.won ? `+${parseFloat(game.winAmount).toFixed(4)}` : '0.0000'}
                      </p>
                      {game.entropyTxHash && (
                        <div className="flex gap-1">
                          <span className="bg-blue-600 text-white text-xs px-1 py-0.5 rounded">ETH</span>
                          <span className="bg-purple-600 text-white text-xs px-1 py-0.5 rounded">MOCA</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-4 py-2 rounded"
            >
              Previous
            </button>
            <span className="bg-gray-800 text-white px-4 py-2 rounded">
              Page {currentPage + 1}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={games.length < GAMES_PER_PAGE}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-4 py-2 rounded"
            >
              Next
            </button>
          </div>
        </>
      )}

      {selectedGame && (
        <GameDetailsModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
};

export default GameHistory;