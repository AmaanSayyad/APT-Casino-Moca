/**
 * Complete Test for MOCA Game Logger System
 * Tests the full flow: API endpoint, service, and contract interaction
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testMocaGameLogger() {
  console.log('🎮 Testing MOCA Game Logger System\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Check API Status
    console.log('\n📊 Test 1: Checking API Status...');
    try {
      const statusResponse = await fetch(`${BASE_URL}/api/log-to-moca-contract`);
      const statusData = await statusResponse.json();
      
      if (statusData.success) {
        console.log('✅ API is ready');
        console.log(`📋 Contract Address: ${statusData.stats?.contractAddress || 'N/A'}`);
        console.log(`📊 Total Logs: ${statusData.stats?.totalLogs || '0'}`);
        console.log(`🌐 Network: ${statusData.network?.name || 'N/A'}`);
        console.log(`🔗 Explorer: ${statusData.contractExplorerUrl || 'N/A'}`);
      } else {
        console.log('❌ API not ready:', statusData.error);
        return;
      }
    } catch (error) {
      console.log('❌ API status check failed:', error.message);
      console.log('⚠️ Make sure the Next.js server is running on', BASE_URL);
      return;
    }

    // Test 2: Log a Test Game
    console.log('\n🎲 Test 2: Logging a Test Game to MOCA Contract...');
    
    const testGameId = `test_game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testUserAddress = '0x025182b20Da64b5997d09a5a62489741F68d9B96'; // Treasury address from env
    
    const testGameData = {
      gameId: testGameId,
      gameType: 'ROULETTE',
      userAddress: testUserAddress,
      betAmount: '0.01', // 0.01 MOCA
      payoutAmount: '0.35', // 0.35 MOCA (win)
      isWin: true,
      gameConfig: {
        betType: 'straight',
        betValue: 7,
        wheelType: 'european'
      },
      resultData: {
        number: 7,
        color: 'red',
        properties: {
          isEven: false,
          isOdd: true,
          isRed: true,
          isBlack: false,
          isHigh: false,
          isLow: true,
          dozen: 1,
          column: 1
        }
      },
      entropyProof: {
        requestId: `test_request_${Date.now()}`,
        transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
        randomValue: '1234567890123456789012345678901234567890'
      }
    };

    console.log(`🎯 Game ID: ${testGameData.gameId}`);
    console.log(`🎮 Game Type: ${testGameData.gameType}`);
    console.log(`👤 User: ${testGameData.userAddress}`);
    console.log(`💰 Bet: ${testGameData.betAmount} MOCA`);
    console.log(`🏆 Payout: ${testGameData.payoutAmount} MOCA`);
    
    const logResponse = await fetch(`${BASE_URL}/api/log-to-moca-contract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testGameData)
    });

    const logResult = await logResponse.json();
    
    if (logResult.success) {
      console.log('\n✅ Game logged successfully!');
      console.log(`🔗 Transaction Hash: ${logResult.transactionHash}`);
      console.log(`📦 Block Number: ${logResult.blockNumber}`);
      console.log(`⛽ Gas Used: ${logResult.gasUsed}`);
      console.log(`🌐 Explorer URL: ${logResult.mocaExplorerUrl}`);
      console.log(`🆔 Game ID: ${logResult.gameId}`);
      
      if (logResult.eventData) {
        console.log('\n📊 Event Data:');
        console.log(`   Game Type: ${logResult.eventData.gameType}`);
        console.log(`   User: ${logResult.eventData.userAddress}`);
        console.log(`   Bet: ${logResult.eventData.betAmount} wei`);
        console.log(`   Payout: ${logResult.eventData.payoutAmount} wei`);
        console.log(`   Win: ${logResult.eventData.isWin}`);
        console.log(`   Timestamp: ${logResult.eventData.timestamp}`);
      }
    } else {
      console.log('\n❌ Failed to log game:', logResult.error);
      return;
    }

    // Test 3: Retrieve Game History
    console.log('\n📖 Test 3: Retrieving Game History...');
    try {
      const historyResponse = await fetch(
        `${BASE_URL}/api/game-history?player=${testUserAddress}&limit=5`
      );
      const historyData = await historyResponse.json();
      
      if (historyData.success) {
        console.log(`✅ Retrieved ${historyData.games?.length || 0} games`);
        if (historyData.games && historyData.games.length > 0) {
          const latestGame = historyData.games[0];
          console.log(`\n📋 Latest Game:`);
          console.log(`   Game ID: ${latestGame.gameId}`);
          console.log(`   Type: ${latestGame.gameType}`);
          console.log(`   Bet: ${latestGame.betAmount} MOCA`);
          console.log(`   Payout: ${latestGame.payoutAmount} MOCA`);
          console.log(`   Win: ${latestGame.isWin}`);
          console.log(`   MOCA TX: ${latestGame.mocaTransactionHash || 'N/A'}`);
          console.log(`   Explorer: ${latestGame.mocaExplorerUrl || 'N/A'}`);
        }
        
        if (historyData.stats) {
          console.log(`\n📊 Statistics:`);
          console.log(`   Total Games: ${historyData.stats.totalGames}`);
          console.log(`   Total Bet: ${historyData.stats.totalBetAmount} MOCA`);
          console.log(`   Total Won: ${historyData.stats.totalWinAmount} MOCA`);
          console.log(`   House Edge: ${historyData.stats.houseEdge}`);
        }
      } else {
        console.log('❌ Failed to retrieve history:', historyData.error);
      }
    } catch (error) {
      console.log('❌ History retrieval failed:', error.message);
    }

    // Test 4: Get Contract Stats
    console.log('\n📊 Test 4: Getting Contract Statistics...');
    try {
      const statsResponse = await fetch(`${BASE_URL}/api/log-to-moca-contract`);
      const statsData = await statsResponse.json();
      
      if (statsData.success && statsData.stats) {
        console.log('✅ Contract Statistics:');
        console.log(`   Total Logs: ${statsData.stats.totalLogs}`);
        console.log(`   Total Gas Used: ${statsData.stats.totalGasUsed}`);
        console.log(`   Average Gas/Log: ${statsData.stats.averageGasPerLog || 'N/A'}`);
        console.log(`   Last Logger: ${statsData.stats.lastLogger || 'N/A'}`);
      }
    } catch (error) {
      console.log('❌ Failed to get stats:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log(`\n💡 Tip: Check the transaction on MOCA Explorer:`);
    console.log(`   ${logResult.mocaExplorerUrl}\n`);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('Stack:', error.stack);
  }
}

// Run tests
testMocaGameLogger().catch(console.error);

