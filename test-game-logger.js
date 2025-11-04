const fetch = require('node-fetch');

async function testGameLogger() {
  try {
    console.log('🎮 Testing Moca Game Logger...');
    
    // Test game result data
    const gameResult = {
      player: '0x025182b20Da64b5997d09a5a62489741F68d9B96',
      gameType: 'ROULETTE',
      gameSubType: 'red',
      betAmount: '1.0',
      won: true,
      winAmount: '1.8',
      multiplier: '1.8',
      entropyTxHash: '0xa480b6a039f2c449e071fc4a162c59a71de3e5bd99f98aed0f34b645bedffcd5',
      entropySequenceNumber: '1762212768881',
      randomValue: '898784',
      gameData: JSON.stringify({
        betType: 'red',
        winningNumber: 18,
        winningColor: 'red'
      })
    };
    
    console.log('📊 Logging game result:', gameResult);
    
    // Log the game
    const logResponse = await fetch('http://localhost:3000/api/game-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameResult)
    });
    
    if (!logResponse.ok) {
      const errorText = await logResponse.text();
      console.error('❌ Log HTTP error:', logResponse.status, errorText);
      return;
    }
    
    const logResult = await logResponse.json();
    
    if (logResult.success) {
      console.log('✅ Game logged successfully!');
      console.log('🆔 Game ID:', logResult.result.gameId);
      console.log('🔗 Moca Explorer:', logResult.result.mocaExplorerUrl);
      console.log('⛽ Gas used:', logResult.result.gasUsed);
      
      // Wait a bit for the transaction to be processed
      console.log('⏳ Waiting for transaction to be processed...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Test getting game history
      console.log('\n📜 Testing game history retrieval...');
      
      const historyResponse = await fetch('http://localhost:3000/api/game-history?limit=5');
      
      if (!historyResponse.ok) {
        const errorText = await historyResponse.text();
        console.error('❌ History HTTP error:', historyResponse.status, errorText);
        return;
      }
      
      const historyResult = await historyResponse.json();
      
      if (historyResult.success) {
        console.log('✅ Game history retrieved successfully!');
        console.log('📊 Total games:', historyResult.stats.totalGames);
        console.log('💰 Total bet amount:', historyResult.stats.totalBetAmount, 'MOCA');
        console.log('🏆 Total win amount:', historyResult.stats.totalWinAmount, 'MOCA');
        console.log('🏠 House edge:', historyResult.stats.houseEdge);
        
        console.log('\n🎮 Recent games:');
        historyResult.games.forEach((game, index) => {
          console.log(`${index + 1}. ${game.gameType} - ${game.won ? 'WIN' : 'LOSE'} - ${game.betAmount} MOCA`);
          console.log(`   Player: ${game.player}`);
          console.log(`   Entropy TX: ${game.entropyTxHash || 'N/A'}`);
          console.log(`   Moca Block: ${game.blockNumber}`);
          console.log('');
        });
        
      } else {
        console.error('❌ History Error:', historyResult.error);
      }
      
    } else {
      console.error('❌ Log Error:', logResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGameLogger();