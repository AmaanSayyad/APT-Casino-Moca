/**
 * Game History Utilities for Moca Chain
 * Helper functions for saving and managing game results with VRF details and Moca Network logging
 * Based on 0G Network implementation
 */

/**
 * Save game result to history with VRF transaction hash and Moca Chain logging
 * @param {Object} gameData - Game result data
 * @returns {Promise<Object>} Saved game result
 */
export const saveGameResult = async (gameData) => {
  try {
    const {
      vrfRequestId,
      userAddress,
      gameType,
      gameConfig,
      resultData,
      betAmount,
      payoutAmount,
      vrfTransactionHash,
      vrfValue,
      clientBetId
    } = gameData;

    // Validate required fields
    if (!userAddress || !gameType || !gameConfig || !resultData) {
      throw new Error('Missing required game data fields');
    }

    // Prepare request body for local database
    const requestBody = {
      vrfRequestId,
      userAddress,
      gameType: gameType.toUpperCase(),
      gameConfig,
      resultData,
      betAmount: betAmount ? betAmount.toString() : null,
      payoutAmount: payoutAmount ? payoutAmount.toString() : null,
      clientBetId
    };

    // Make API request to save to local database
    const response = await fetch('/api/games/save-result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to save game result');
    }

    console.log('✅ Game result saved successfully:', data.data.gameResult.id);

    // Log to Moca Chain in background (don't wait for it)
    const gameId = clientBetId || data.data.gameResult.id;
    const mocaLogData = {
      gameId: gameId,
      gameType: gameType,
      userAddress: userAddress,
      betAmount: betAmount,
      payoutAmount: payoutAmount,
      isWin: payoutAmount && parseFloat(payoutAmount) > 0,
      gameConfig: gameConfig,
      resultData: resultData,
      entropyProof: {
        requestId: vrfRequestId,
        transactionHash: vrfTransactionHash,
        randomValue: vrfValue
      }
    };

    // Log to Moca Chain synchronously and wait for result
    console.log('🎮 Starting Moca Chain logging for game:', gameId);

    const postLog = async () => {
      // Try contract logger first, fallback to transaction logger
      const contractRes = await fetch('/api/log-to-moca-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mocaLogData)
      }).catch(() => null);
      
      if (contractRes && contractRes.ok) {
        const contractResult = await contractRes.json().catch(() => null);
        if (contractResult && contractResult.success) {
          console.log('✅ Used Moca contract logger successfully');
          return contractResult;
        }
      }
      
      // Fallback to transaction logger (if exists)
      console.log('⚠️ Moca contract logger failed, using transaction logger as fallback');
      const res = await fetch('/api/log-to-moca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mocaLogData)
      });
      return res.json().catch(() => ({ success: false, error: 'Invalid JSON from logger API' }));
    };

    let mocaResult;
    try {
      mocaResult = await postLog();
      if (!mocaResult?.success) {
        // brief retry once
        await new Promise(r => setTimeout(r, 1200));
        mocaResult = await postLog();
      }
    } catch (e) {
      mocaResult = { success: false, error: e?.message || 'Network error' };
    }

    console.log('🎮 Moca Chain logging result:', mocaResult);
    
    // Add Moca transaction info to the result
    const finalResult = {
      success: true,
      gameId: gameId,
      vrfDetails: data.data.vrfDetails,
      mocaNetworkLog: mocaResult.success ? {
        transactionHash: mocaResult.transactionHash,
        blockNumber: mocaResult.blockNumber,
        mocaExplorerUrl: mocaResult.mocaExplorerUrl,
        network: mocaResult.network,
        gameType: mocaResult.gameType,
        timestamp: mocaResult.timestamp
      } : {
        failed: true,
        error: mocaResult.error
      },
      message: 'Game result saved with VRF verification and Moca Chain logging'
    };

    if (mocaResult.success) {
      console.log('✅ Game result logged to Moca Chain:', mocaResult.transactionHash);
    } else {
      console.warn('⚠️ Failed to log to Moca Chain:', mocaResult.error);
    }

    return finalResult;

  } catch (error) {
    console.error('❌ Failed to save game result:', error);
    throw error;
  }
};

/**
 * Get Moca Network log for a game
 * @param {string} gameId - Game ID
 * @returns {Object|null} Moca Network log data
 */
export const getMocaNetworkLog = (gameData) => {
  if (!gameData) return null;
  
  // If gameData is just an ID (legacy), return null to show loading
  if (typeof gameData === 'string') {
    return null;
  }
  
  // Return the Moca network log from game data
  return gameData.mocaNetworkLog || null;
};

/**
 * Get user's game history
 * @param {string} userAddress - User's Ethereum address
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Game history data
 */
export const getUserHistory = async (userAddress, options = {}) => {
  try {
    const {
      gameType,
      limit = 50,
      offset = 0,
      includeVrfDetails = true
    } = options;

    const params = new URLSearchParams({
      userAddress,
      limit: limit.toString(),
      offset: offset.toString(),
      includeVrfDetails: includeVrfDetails.toString()
    });

    if (gameType && gameType !== 'all') {
      params.append('gameType', gameType);
    }

    const response = await fetch(`/api/games/history?${params}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch game history');
    }

    return data.data;

  } catch (error) {
    console.error('❌ Failed to fetch game history:', error);
    throw error;
  }
};

/**
 * Verify a specific game result
 * @param {string} gameId - Game result ID
 * @returns {Promise<Object>} Verification result
 */
export const verifyGameResult = async (gameId) => {
  try {
    const response = await fetch('/api/games/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameId })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to verify game result');
    }

    return data.data;

  } catch (error) {
    console.error('❌ Failed to verify game result:', error);
    throw error;
  }
};

/**
 * Format game result for display
 * @param {string} gameType - Game type
 * @param {Object} resultData - Game result data
 * @returns {Object} Formatted result
 */
export const formatGameResult = (gameType, resultData) => {
  switch (gameType.toUpperCase()) {
    case 'ROULETTE':
      return {
        primary: `${resultData.number}`,
        secondary: resultData.color?.toUpperCase(),
        details: {
          'Even/Odd': resultData.properties?.isEven ? 'EVEN' : 
                     resultData.properties?.isOdd ? 'ODD' : 'ZERO',
          'High/Low': resultData.properties?.isHigh ? 'HIGH' : 
                      resultData.properties?.isLow ? 'LOW' : 'ZERO',
          'Dozen': resultData.properties?.dozen || 'N/A',
          'Column': resultData.properties?.column || 'N/A'
        }
      };

    case 'MINES':
      return {
        primary: resultData.hitMine ? 'Hit Mine' : 'Safe',
        secondary: `${resultData.totalMines || 0} mines`,
        details: {
          'Revealed Tiles': resultData.revealedTiles?.length || 0,
          'Mine Positions': resultData.minePositions?.join(', ') || 'N/A',
          'Game Status': resultData.hitMine ? 'Lost' : 'Won'
        }
      };

    case 'PLINKO':
      return {
        primary: `Slot ${resultData.finalSlot}`,
        secondary: `${resultData.multiplier}x`,
        details: {
          'Rows': resultData.rows || 'N/A',
          'Ball Path': resultData.ballPath?.length ? 
                      `${resultData.ballPath.length} bounces` : 'N/A',
          'Final Multiplier': `${resultData.multiplier}x`
        }
      };

    case 'WHEEL':
      return {
        primary: `Segment ${resultData.segment}`,
        secondary: `${resultData.multiplier}x`,
        details: {
          'Color': resultData.color || 'N/A',
          'Total Segments': resultData.totalSegments || 'N/A',
          'Multiplier': `${resultData.multiplier}x`
        }
      };

    default:
      return {
        primary: 'Game Result',
        secondary: gameType,
        details: resultData
      };
  }
};

/**
 * Calculate game statistics
 * @param {Array} games - Array of game results
 * @returns {Object} Statistics
 */
export const calculateGameStats = (games) => {
  if (!games || games.length === 0) {
    return {
      totalGames: 0,
      totalWagered: '0',
      totalWon: '0',
      totalProfit: '0',
      winRate: 0,
      averageMultiplier: 0,
      gameTypeBreakdown: {}
    };
  }

  const stats = {
    totalGames: games.length,
    wins: 0,
    losses: 0,
    gameTypeBreakdown: {}
  };

  let totalWagered = BigInt(0);
  let totalWon = BigInt(0);
  let totalMultiplier = 0;

  games.forEach(game => {
    const betAmount = BigInt(game.betAmount || 0);
    const payoutAmount = BigInt(game.payoutAmount || 0);

    totalWagered += betAmount;
    totalWon += payoutAmount;
    totalMultiplier += parseFloat(game.multiplier || 0);

    // Win/loss tracking
    if (game.isWin) {
      stats.wins++;
    } else {
      stats.losses++;
    }

    // Game type breakdown
    const gameType = game.gameType;
    if (!stats.gameTypeBreakdown[gameType]) {
      stats.gameTypeBreakdown[gameType] = {
        count: 0,
        wagered: BigInt(0),
        won: BigInt(0),
        wins: 0,
        losses: 0
      };
    }

    const breakdown = stats.gameTypeBreakdown[gameType];
    breakdown.count++;
    breakdown.wagered += betAmount;
    breakdown.won += payoutAmount;
    
    if (game.isWin) {
      breakdown.wins++;
    } else {
      breakdown.losses++;
    }
  });

  // Convert BigInt to string for JSON serialization
  stats.totalWagered = totalWagered.toString();
  stats.totalWon = totalWon.toString();
  stats.totalProfit = (totalWon - totalWagered).toString();
  stats.winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames * 100).toFixed(2) : 0;
  stats.averageMultiplier = stats.totalGames > 0 ? (totalMultiplier / stats.totalGames).toFixed(2) : 0;

  // Convert breakdown BigInt values
  Object.keys(stats.gameTypeBreakdown).forEach(gameType => {
    const breakdown = stats.gameTypeBreakdown[gameType];
    breakdown.wagered = breakdown.wagered.toString();
    breakdown.won = breakdown.won.toString();
    breakdown.profit = (breakdown.won - breakdown.wagered).toString();
    breakdown.winRate = breakdown.count > 0 ? (breakdown.wins / breakdown.count * 100).toFixed(2) : 0;
  });

  return stats;
};

/**
 * Export game history to CSV
 * @param {Array} games - Array of game results
 * @param {string} userAddress - User address for filename
 * @returns {void}
 */
export const exportGameHistoryCSV = (games, userAddress) => {
  if (!games || games.length === 0) {
    throw new Error('No games to export');
  }

  const csvData = games.map(game => {
    const formattedResult = formatGameResult(game.gameType, game.resultData);
    
    return {
      'Date': new Date(game.createdAt).toISOString(),
      'Game Type': game.gameType,
      'Result': formattedResult.primary,
      'Details': formattedResult.secondary,
      'Bet Amount (MOCA)': (parseFloat(game.betAmount || 0) / 1e18).toFixed(6),
      'Payout (MOCA)': (parseFloat(game.payoutAmount || 0) / 1e18).toFixed(6),
      'Profit/Loss (MOCA)': (parseFloat(game.profitLoss || 0) / 1e18).toFixed(6),
      'Multiplier': game.multiplier?.toFixed(2) || '0.00',
      'Win/Loss': game.isWin ? 'WIN' : 'LOSS',
      'VRF Transaction': game.vrfDetails?.transactionHash || 'N/A',
      'Block Number': game.vrfDetails?.blockNumber || 'N/A',
      'VRF Value': game.vrfDetails?.vrfValue || 'N/A',
      'Game ID': game.id
    };
  });

  // Create CSV content
  const headers = Object.keys(csvData[0]);
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `game-history-${userAddress.slice(0, 8)}-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Get Moca Chain explorer URL for transaction
 * @param {string} transactionHash - Transaction hash
 * @param {string} network - Network name (default: moca-testnet)
 * @returns {string} Explorer URL
 */
export const getMocaExplorerUrl = (transactionHash, network = 'moca-testnet') => {
  const baseUrls = {
    'moca-testnet': 'https://testnet-scan.mocachain.org',
    'moca-mainnet': 'https://scan.mocachain.org'
  };

  const baseUrl = baseUrls[network] || baseUrls['moca-testnet'];
  return `${baseUrl}/tx/${transactionHash}`;
};

/**
 * Format MOCA amount for display
 * @param {string|number} amount - Amount in wei
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted amount
 */
export const formatMocaAmount = (amount, decimals = 6) => {
  if (!amount) return '0';
  const moca = parseFloat(amount) / 1e18;
  return moca.toFixed(decimals);
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatGameDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

/**
 * Get game type emoji
 * @param {string} gameType - Game type
 * @returns {string} Emoji
 */
export const getGameTypeEmoji = (gameType) => {
  const emojis = {
    ROULETTE: '🎰',
    MINES: '💣',
    PLINKO: '🏀',
    WHEEL: '🎡'
  };
  return emojis[gameType?.toUpperCase()] || '🎮';
};

/**
 * Get Moca Chain network info
 * @returns {Object} Network information
 */
export const getMocaNetworkInfo = () => {
  return {
    name: 'Moca Chain Testnet',
    chainId: 222888,
    currency: 'MOCA',
    explorerUrl: 'https://testnet-scan.mocachain.org',
    rpcUrl: 'https://testnet-rpc.mocachain.org/'
  };
};

export default {
  saveGameResult,
  getUserHistory,
  verifyGameResult,
  formatGameResult,
  calculateGameStats,
  exportGameHistoryCSV,
  getMocaExplorerUrl,
  formatMocaAmount,
  formatGameDate,
  getGameTypeEmoji,
  getMocaNetworkLog,
  getMocaNetworkInfo
};