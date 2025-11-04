import { NextResponse } from 'next/server';
import mocaGameLoggerService from '@/services/MocaGameLoggerService.js';

export async function POST(request) {
  try {
    const gameData = await request.json();
    
    console.log('📝 MOCA CONTRACT API: Received game data:', {
      gameId: gameData.gameId,
      gameType: gameData.gameType,
      userAddress: gameData.userAddress,
      betAmount: gameData.betAmount,
      payoutAmount: gameData.payoutAmount
    });

    // Validate input
    if (!gameData.gameType || !gameData.userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: gameType, userAddress' },
        { status: 400 }
      );
    }

    // Validate game type
    if (!['MINES', 'PLINKO', 'ROULETTE', 'WHEEL'].includes(gameData.gameType.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid game type. Must be MINES, PLINKO, ROULETTE, or WHEEL' },
        { status: 400 }
      );
    }

    // Log to contract
    const result = await mocaGameLoggerService.logGameResult(gameData);
    
    if (result.success) {
      console.log('✅ MOCA CONTRACT API: Game logged successfully:', result.transactionHash);
      return NextResponse.json(result);
    } else {
      console.error('❌ MOCA CONTRACT API: Failed to log game:', result.error);
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    console.error('❌ MOCA CONTRACT API: Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      transactionHash: null,
      mocaExplorerUrl: null,
      network: 'moca-testnet'
    }, { status: 500 });
  }
}

// GET endpoint to check contract status and stats
export async function GET() {
  try {
    const stats = await mocaGameLoggerService.getLoggerStats();
    const networkConfig = mocaGameLoggerService.getNetworkConfig();
    
    return NextResponse.json({
      success: true,
      stats: stats,
      network: networkConfig,
      contractExplorerUrl: mocaGameLoggerService.getContractExplorerUrl(),
      serviceInfo: mocaGameLoggerService.getServiceInfo(),
      status: 'ready'
    });
    
  } catch (error) {
    console.error('❌ MOCA CONTRACT API: Status check failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      status: 'error'
    }, { status: 500 });
  }
}

// Ensure Node.js runtime and no caching for this route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;