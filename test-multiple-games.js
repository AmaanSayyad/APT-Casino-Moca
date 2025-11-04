const fetch = require('node-fetch');

async function testMultipleGames() {
  try {
    console.log('🎮 Testing Multiple Game Types...');
    
    const games = [
      {
        player: '0x025182b20Da64b5997d09a5a62489741F68d9B96',
        gameType: 'MINES',
        gameSubType: '9-mines',
        betAmount: '0.5',
        won: false,
        winAmount: '0',
        multiplier: '0',
        entropyTxHash: '0xa480b6a039f2c449e071fc4a162c59a71de3e5bd99f98aed0f34b645bedffcd5',
        entropySequenceNumber: '1762212768881',
        randomValue: '123456',
        gameData: JSON.stringify({
          minesCount: 9,
          revealedTiles: [1, 5, 8],
          hitMine: true
        })
      },
      {
        player: '0x025182b20Da64b5997d09a5a62489741F68d9B96',
        gameType: 'PLINKO',
        gameSubType: 'high-risk',
        betAmount: '2.0',
        won: true,
        winAmount: '5.6',
        multiplier: '2.8',
        entropyTxHash: '0xbe3c718eda0aae09c4ee054cc136cbc5cc7d14b6a5f4c6dc410468bda7a8c31b',
        entropySequenceNumber: '1762212768882',
        randomValue: '789012',
        gameData: JSON.stringify({
          riskLevel: 'high',
          ballPath: [0, 1, 0, 1, 1, 0, 1],
          finalSlot: 1000
        })
      },
      {
        player: '0x025182b20Da64b5997d09a5a62489741F68d9B96',
        gameType: 'WHEEL',
        gameSubType: 'fortune',
        betAmount: '1.5',
        won: true,
        winAmount: '7.5',
        multiplier: '5.0',
        entropyTxHash: '0xbe3c718eda0aae09c4ee054cc136cbc5cc7d14b6a5f4c6dc410468bda7a8c31b',
        entropySequenceNumber: '1762212768883',
        randomValue: '345678',
        gameData: JSON.stringify({
          wheelType: 'fortune',
          segments: 20,
          winningSegment: 5,
          segmentMultiplier: 5.0
        })
      }
    ];
    
    // Log all games
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      console.log(`\n📊 Logging ${game.gameType} game...`);
      
      const response = await fetch('http://localhost:3000/api/game-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(game)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error:', response.status, errorText);
        continue;
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${game.gameType} logged! Game ID: ${result.result.gameId}`);
        console.log(`🔗 Moca TX: ${result.result.transactionHash}`);
      } else {
        console.error(`❌ ${game.gameType} Error:`, result.error);
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Wait for all transactions to be processed
    console.log('\n⏳ Waiting for all transactions to be processed...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Get game history
    console.log('\n📜 Getting complete game history...');
    
    const historyResponse = await fetch('http://localhost:3000/api/game-history?limit=10');
    
    if (!historyResponse.ok) {
      const errorText = await historyResponse.text();
      console.error('❌ History HTTP error:', historyResponse.status, errorText);
      return;
    }
    
    const historyResult = await historyResponse.json();
    
    if (historyResult.success) {
      console.log('✅ Game history retrieved successfully!');
      console.log('📊 Statistics:');
      console.log(`   Total games: ${historyResult.stats.totalGames}`);
      console.log(`   Total bet amount: ${historyResult.stats.totalBetAmount} MOCA`);
      console.log(`   Total win amount: ${historyResult.stats.totalWinAmount} MOCA`);
      console.log(`   House edge: ${historyResult.stats.houseEdge}`);
      
      console.log('\n🎮 Game History:');
      historyResult.games.forEach((game, index) => {
        const icon = game.gameType === 'MINES' ? '💣' : 
                    game.gameType === 'PLINKO' ? '🎯' : 
                    game.gameType === 'ROULETTE' ? '🎰' : 
                    game.gameType === 'WHEEL' ? '🎡' : '🎮';
        
        console.log(`${index + 1}. ${icon} ${game.gameType} (${game.gameSubType})`);
        console.log(`   Result: ${game.won ? '🟢 WIN' : '🔴 LOSE'}`);
        console.log(`   Bet: ${parseFloat(game.betAmount).toFixed(4)} MOCA`);
        if (game.won) {
          console.log(`   Win: ${parseFloat(game.winAmount).toFixed(4)} MOCA (${game.multiplier}x)`);
        }
        console.log(`   Entropy: ${game.entropyTxHash ? '🔗 ETH' : '❌'} | Moca: 🔗 MOCA`);
        console.log(`   Date: ${new Date(game.timestamp).toLocaleString()}`);
        console.log('');
      });
      
    } else {
      console.error('❌ History Error:', historyResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMultipleGames();