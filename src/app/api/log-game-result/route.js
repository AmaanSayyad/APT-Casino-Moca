import gameResultLogger from '../../../services/GameResultLogger.js';

export async function POST(request) {
  try {
    console.log('🎮 API: Logging game result...');
    
    // Parse request body
    const gameData = await request.json();
    
    // Validate required fields
    const requiredFields = ['player', 'gameType', 'betAmount', 'winAmount', 'multiplier'];
    for (const field of requiredFields) {
      if (!gameData[field] && gameData[field] !== 0) {
        return Response.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }
    
    // Log the game result
    const result = await gameResultLogger.logGameResult(gameData);
    
    if (result.success) {
      console.log('✅ API: Game result logged successfully');
      
      // Create enhanced game history entry
      const enhancedEntry = gameResultLogger.createEnhancedGameHistoryEntry(gameData, result);
      
      return Response.json({
        success: true,
        gameId: result.gameId,
        mocaTransactionHash: result.mocaTransactionHash,
        mocaExplorerUrl: result.mocaExplorerUrl,
        enhancedGameEntry: enhancedEntry
      });
    } else {
      console.error('❌ API: Failed to log game result:', result.error);
      
      return Response.json({
        success: false,
        error: result.error,
        attempts: result.attempts
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ API: Error logging game result:', error);
    
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Return service status
    const status = gameResultLogger.getStatus();
    
    return Response.json({
      success: true,
      status: status
    });
    
  } catch (error) {
    console.error('❌ API: Error getting status:', error);
    
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}