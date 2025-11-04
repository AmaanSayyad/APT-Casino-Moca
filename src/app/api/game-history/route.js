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
    let stats = null;

    try {
      // Initialize service first
      await mocaGameLoggerService.initialize();

      if (player && ethers.isAddress(player)) {
        // Get player-specific history
        games = await mocaGameLoggerService.getPlayerGameHistory(player, offset, limit);
      } else {
        // Get recent games
        games = await mocaGameLoggerService.getRecentGames(limit);
      }

      // Filter by game type if specified
      if (gameType && ['MINES', 'PLINKO', 'ROULETTE', 'WHEEL'].includes(gameType.toUpperCase())) {
        games = games.filter(game => game.gameType.toLowerCase() === gameType.toLowerCase());
      }

      // Get game statistics (with error handling)
      try {
        stats = await mocaGameLoggerService.getGameStats();
      } catch (statsError) {
        console.warn('⚠️ API: Could not get stats:', statsError.message);
        stats = {
          totalGames: '0',
          totalBetAmount: '0.0',
          totalWinAmount: '0.0',
          houseEdge: '0.00%'
        };
      }

    } catch (serviceError) {
      console.warn('⚠️ API: Service error, returning empty results:', serviceError.message);
      games = [];
      stats = {
        totalGames: '0',
        totalBetAmount: '0.0',
        totalWinAmount: '0.0',
        houseEdge: '0.00%'
      };
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
      contractInfo: mocaGameLoggerService.getContractInfo()
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
    const requiredFields = ['player', 'gameType', 'betAmount', 'won'];
    for (const field of requiredFields) {
      if (gameResult[field] === undefined || gameResult[field] === null) {
        return Response.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    // Validate player address
    if (!ethers.isAddress(gameResult.player)) {
      return Response.json({
        success: false,
        error: 'Invalid player address format'
      }, { status: 400 });
    }

    // Validate game type
    if (!['MINES', 'PLINKO', 'ROULETTE', 'WHEEL'].includes(gameResult.gameType.toUpperCase())) {
      return Response.json({
        success: false,
        error: 'Invalid game type. Must be MINES, PLINKO, ROULETTE, or WHEEL'
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
        transactionHash: result.transactionHash,
        mocaExplorerUrl: result.mocaExplorerUrl,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        attempts: attempts
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