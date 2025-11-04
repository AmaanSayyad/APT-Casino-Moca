/**
 * Test Moca Game Logger API
 * Tests the API endpoints for logging games to Moca Chain
 */

// Using built-in fetch (Node.js 18+)

async function testMocaAPI() {
  try {
    console.log('🎮 Testing Moca Game Logger API...\n');

    const baseUrl = 'http://localhost:3001';
    
    // Test 1: Check API status
    console.log('📊 Test 1: Checking API status...');
    try {
      const response = await fetch(`${baseUrl}/api/log-to-moca-contract`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ API is ready');
        console.log('📋 Contract Address:', data.stats?.contractAddress || 'N/A');
        console.log('📊 Total Logs:', data.stats?.totalLogs || '0');
        console.log('🌐 Network:', data.network?.name || 'N/A');
      } else {
        console.log('❌ API not ready:', data.error);
      }
    } catch (error) {
      console.log('❌ API status check failed:', error.message);
    }

    console.log('\n🎲 Test 2: Logging a test game...');
    
    // Test game data
    const testGameData = {
      gameId: `test_game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gameType: 'ROULETTE',
      userAddress: '0x025182b20Da64b5997d09a5a62489741F68d9B96', // Treasury address as test user
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
          isBlack: false
        }
      },
      entropyProof: {
        requestId: 'test_request_123',
        transactionHash: '0x1234567890abcdef',
        randomValue: '12345678901234567890'
      }
    };

    console.log(`🎯 Game ID: ${testGameData.gameId}`);
    console.log(`🎮 Game Type: ${testGameData.gameType}`);
    console.log(`👤 User: ${testGameData.userAddress}`);
    console.log(`💰 Bet: ${testGameData.betAmount} MOCA`);
    console.log(`🏆 Payout: ${testGameData.payoutAmount} MOCA`);

    try {
      const response = await fetch(`${baseUrl}/api/log-to-moca-contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testGameData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Game logged successfully!');
        console.log(`🔗 Transaction Hash: ${result.transactionHash}`);
        console.log(`📦 Block Number: ${result.blockNumber}`);
        console.log(`⛽ Gas Used: ${result.gasUsed}`);
        console.log(`🔍 Explorer: ${result.mocaExplorerUrl}`);
        console.log(`🌐 Network: ${result.network}`);
        
        if (result.eventData) {
          console.log('📊 Event Data:');
          console.log(`  - Game ID: ${result.eventData.gameId}`);
          console.log(`  - Game Type: ${result.eventData.gameType}`);
          console.log(`  - User: ${result.eventData.userAddress}`);
          console.log(`  - Bet Amount: ${result.eventData.betAmount}`);
          console.log(`  - Payout: ${result.eventData.payoutAmount}`);
          console.log(`  - Is Win: ${result.eventData.isWin}`);
          console.log(`  - Timestamp: ${new Date(Number(result.eventData.timestamp) * 1000).toISOString()}`);
        }
      } else {
        console.log('❌ Failed to log game:', result.error);
      }
    } catch (error) {
      console.log('❌ API call failed:', error.message);
    }

    console.log('\n📊 Test 3: Checking updated stats...');
    try {
      const response = await fetch(`${baseUrl}/api/log-to-moca-contract`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Updated stats retrieved');
        console.log('📊 Total Logs:', data.stats?.totalLogs || '0');
        console.log('⛽ Total Gas Used:', data.stats?.totalGasUsed || '0');
        console.log('👤 Last Logger:', data.stats?.lastLogger || 'N/A');
        console.log('📈 Average Gas Per Log:', data.stats?.averageGasPerLog || '0');
      } else {
        console.log('❌ Failed to get updated stats:', data.error);
      }
    } catch (error) {
      console.log('❌ Stats check failed:', error.message);
    }

    console.log('\n🎉 Moca API test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testMocaAPI().catch(console.error);