import mocaGameLoggerService from '../../../services/MocaGameLoggerService.js';
import { ethers } from 'ethers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const player = searchParams.get('player');
    const gameType = searchParams.get('gameType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0); // Min 0

    console.log('📜 API: Getting game history...', { player, gameType, limit, offset });

    let games = [];
    let stats = {
      totalGames: '0',
      totalBetAmount: '0.0',
      totalWinAmount: '0.0',
      houseEdge: '0.00%'
    };

    try {
      // Initialize service
      await mocaGameLoggerService.initialize();
      console.log('✅ API: Service initialized for game history retrieval');

      let gameIds = [];

      // Get games based on filters
      if (player && ethers.isAddress(player)) {
        // Get user's games
        gameIds = await mocaGameLoggerService.getUserGames(player, offset, limit);
        console.log(`📊 API: Found ${gameIds.length} games for player ${player}`);
      } else if (gameType) {
        // Get games by type
        gameIds = await mocaGameLoggerService.getGamesByType(gameType.toUpperCase(), offset, limit);
        console.log(`📊 API: Found ${gameIds.length} ${gameType} games`);
      } else {
        // Get recent games
        gameIds = await mocaGameLoggerService.getRecentGames(offset, limit);
        console.log(`📊 API: Found ${gameIds.length} recent games`);
      }

      // Fetch detailed game data for each game ID
      const gamePromises = gameIds.map(async (gameId) => {
        try {
          const gameLog = await mocaGameLoggerService.getGameLog(gameId);
          
          // Convert wei amounts to ether for display
          const betAmountEth = ethers.formatEther(gameLog.betAmount);
          const payoutAmountEth = ethers.formatEther(gameLog.payoutAmount);
          const profitLoss = parseFloat(payoutAmountEth) - parseFloat(betAmountEth);

          // Try to get transaction hash from events if available
          // For now, we'll use the block number to construct a way to find the tx
          // In a real implementation, you might want to index events
          const mocaTransactionHash = gameLog.entropyProof?.transactionHash || null;
          const explorerUrl = mocaTransactionHash 
            ? mocaGameLoggerService.getExplorerUrl(mocaTransactionHash)
            : mocaGameLoggerService.getExplorerUrl('');
          
          return {
            id: gameLog.gameId,
            gameId: gameLog.gameId,
            gameType: gameLog.gameType,
            userAddress: gameLog.userAddress,
            betAmount: betAmountEth,
            payoutAmount: payoutAmountEth,
            profitLoss: profitLoss.toFixed(6),
            isWin: gameLog.isWin,
            gameConfig: gameLog.gameConfig,
            resultData: gameLog.resultData,
            entropyProof: gameLog.entropyProof,
            timestamp: parseInt(gameLog.timestamp) * 1000, // Convert to milliseconds
            blockNumber: gameLog.blockNumber,
            createdAt: new Date(parseInt(gameLog.timestamp) * 1000).toISOString(),
            mocaTransactionHash: mocaTransactionHash,
            mocaExplorerUrl: explorerUrl,
            mocaNetworkLog: mocaTransactionHash ? {
              transactionHash: mocaTransactionHash,
              blockNumber: gameLog.blockNumber,
              mocaExplorerUrl: explorerUrl,
              network: 'moca-testnet',
              timestamp: gameLog.timestamp
            } : null,
            verifiable: true,
            verificationNote: "This result was logged on Moca Chain - verifiable on-chain"
          };
        } catch (error) {
          console.warn(`⚠️ API: Failed to get details for game ${gameId}:`, error.message);
          return null;
        }
      });

      // Wait for all game details and filter out failed ones
      const gameResults = await Promise.all(gamePromises);
      games = gameResults.filter(game => game !== null);

      // Calculate statistics
      if (games.length > 0) {
        let totalBetAmount = 0;
        let totalWinAmount = 0;
        let totalWins = 0;

        games.forEach(game => {
          totalBetAmount += parseFloat(game.betAmount);
          totalWinAmount += parseFloat(game.payoutAmount);
          if (game.isWin) totalWins++;
        });

        const houseEdge = totalBetAmount > 0 ? 
          ((totalBetAmount - totalWinAmount) / totalBetAmount * 100) : 0;

        stats = {
          totalGames: games.length.toString(),
          totalBetAmount: totalBetAmount.toFixed(6),
          totalWinAmount: totalWinAmount.toFixed(6),
          houseEdge: `${houseEdge.toFixed(2)}%`,
          winRate: `${((totalWins / games.length) * 100).toFixed(2)}%`
        };
      }

      // Get additional stats from contract
      try {
        const contractStats = await mocaGameLoggerService.getLoggerStats();
        stats.contractStats = contractStats;
      } catch (error) {
        console.warn('⚠️ API: Failed to get contract stats:', error.message);
      }

    } catch (serviceError) {
      console.warn('⚠️ API: Service error:', serviceError.message);
      // Return empty results but don't fail the request
    }

    console.log(`✅ API: Retrieved ${games.length} games`);

    return Response.json({
      success: true,
      games: games,
      stats: stats,
      pagination: {
        offset: offset,
        limit: limit,
        total: games.length,
        hasMore: games.length === limit
      },
      serviceInfo: mocaGameLoggerService.getServiceInfo()
    });

  } catch (error) {
    console.error('❌ API: Error getting game history:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      games: [],
      stats: {
        totalGames: '0',
        totalBetAmount: '0.0',
        totalWinAmount: '0.0',
        houseEdge: '0.00%'
      }
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('🎮 API: Logging game result...');
    
    // Parse request body
    const gameResult = await request.json();
    
    // Validate required fields
    const requiredFields = ['gameType', 'userAddress', 'betAmount', 'payoutAmount'];
    for (const field of requiredFields) {
      if (gameResult[field] === undefined || gameResult[field] === null) {
        return Response.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Validate game type
    if (!['MINES', 'PLINKO', 'ROULETTE', 'WHEEL'].includes(gameResult.gameType.toUpperCase())) {
      return Response.json({
        success: false,
        error: 'Invalid game type. Must be MINES, PLINKO, ROULETTE, or WHEEL'
      }, { status: 400 });
    }

    // Validate Ethereum address
    if (!ethers.isAddress(gameResult.userAddress)) {
      return Response.json({
        success: false,
        error: 'Invalid user address format'
      }, { status: 400 });
    }

    // Initialize service
    await mocaGameLoggerService.initialize();
    
    // Log the game result with retry logic
    let result;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`🎮 API: Logging attempt ${attempts}/${maxAttempts}...`);
        
        result = await mocaGameLoggerService.logGameResult(gameResult);
        
        if (result.success) {
          break;
        } else {
          throw new Error(result.error || 'Unknown logging error');
        }
        
      } catch (attemptError) {
        console.warn(`⚠️ API: Attempt ${attempts} failed:`, attemptError.message);
        
        if (attempts === maxAttempts) {
          throw attemptError;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
    
    if (result.success) {
      console.log('✅ API: Game logged successfully');
      console.log('🆔 Game ID:', result.gameId);
      console.log('🔗 Moca TX:', result.transactionHash);
      
      return Response.json({
        success: true,
        gameId: result.gameId,
        gameType: result.gameType,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        mocaExplorerUrl: result.mocaExplorerUrl,
        contractAddress: result.contractAddress,
        eventData: result.eventData,
        attempts: attempts,
        network: result.network
      });
    } else {
      throw new Error(result.error || 'Failed to log game result');
    }
    
  } catch (error) {
    console.error('❌ API: Error logging game:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    }, { status: 500 });
  }
}

// Ensure Node.js runtime and no caching for this route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;