const fetch = require('node-fetch');

async function testMocaLogging() {
  try {
    console.log('🎮 Testing Moca Game Logging...');
    
    // Test different game types
    const testGames = [
      {
        player: '0x025182b20Da64b5997d09a5a62489741F68d9B96',
        gameType: 'WHEEL',
        gameSubType: '10-segments',
        betAmount: '1.0',
        won: true,
        winAmount: '2.5',
        multiplier: '2.5',
        entropyTxHash: '0xbe3c718eda0aae09c4ee054cc136cbc5cc7d14b6a5f4c6dc410468bda7a8c31b',
        entropySequenceNumber: '1762212768881',
        randomValue: '123456',
        gameData: JSON.stringify({
          segments: 10,
          riskLevel: 'medium',
          landedMultiplier: 2.5,
          wheelPosition: 45
        })
      },
      {
        player: '0x025182b20Da64b5997d09a5a62489741F68d9B96',
        gameType: 'PLINKO',
        gameSubType: 'high',
        betAmount: '0.5',
        won: false,
        winAmount: '0',
        multiplier: '0',
        entropyTxHash: '0xa480b6a039f2c449e071fc4a162c59a71de3e5bd99f98aed0f34b645bedffcd5',
        entropySequenceNumber: '1762212768882',
        randomValue: '789012',
        gameData: JSON.stringify({
          rows: 16,
          riskLevel: 'high',
          ballPath: [0, 1, 0, 1, 1, 0, 1],
          finalSlot: 0
        })
      },
      {
        player: '0x025182b20Da64b5997d09a5a62489741F68d9B96',
        gameType: 'MINES',
        gameSubType: '9-mines',
        betAmount: '2.0',
        won: true,
        winAmount: '4.0',
        multiplier: '2.0',
        entropyTxHash: '0xbe3c718eda0aae09c4ee054cc136cbc5cc7d14b6a5f4c6dc410468bda7a8c31b',
        entropySequenceNumber: '1762212768883',
        randomValue: '345678',
        gameData: JSON.stringify({
          minesCount: 9,
          revealedTiles: [1, 5, 8, 12],
          hitMine: false,
          gameBoard: Array(25).fill(0)
        })
      },
      {
        player: '0x025182b20Da64b5997d09a5a62489741F68d9B96',
        gameType: 'ROULETTE',
        gameSubType: 'red',
        betAmount: '1.5',
        won: true,
        winAmount: '3.0',
        multiplier: '2.0',
        entropyTxHash: '0xa480b6a039f2c449e071fc4a162c59a71de3e5bd99f98aed0f34b645bedffcd5',
        entropySequenceNumber: '1762212768884',
        randomValue: '901234',
        gameData: JSON.stringify({
          winningNumber: 18,
          winningColor: 'red',
          totalBets: 1,
          winningBets: [{ name: 'Red', amount: 1.5, multiplier: 2.0 }],
          losingBets: []
        })
      }
    ];
    
    console.log(`\n🎯 Testing ${testGames.length} different game types...`);
    
    for (let i = 0; i < testGames.length; i++) {
      const game = testGames[i];
      console.log(`\n📊 Testing ${game.gameType} (${i + 1}/${testGames.length})...`);
      
      try {
        const response = await fetch('http://localhost:3000/api/game-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(game)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ ${game.gameType} HTTP error:`, response.status, errorText);
          continue;
        }
        
        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ ${game.gameType} logged successfully!`);
          console.log(`🆔 Game ID: ${result.gameId}`);
          console.log(`🔗 Moca TX: ${result.transactionHash}`);
          console.log(`🌐 Explorer: ${result.mocaExplorerUrl}`);
          console.log(`⛽ Gas used: ${result.gasUsed}`);
        } else {
          console.error(`❌ ${game.gameType} API error:`, result.error);
        }
        
      } catch (error) {
        console.error(`❌ ${game.gameType} request failed:`, error.message);
      }
      
      // Wait between requests
      if (i < testGames.length - 1) {
        console.log('⏳ Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Wait for all transactions to be processed
    console.log('\n⏳ Waiting for all transactions to be processed...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test getting game history
    console.log('\n📜 Testing game history retrieval...');
    
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
      
      console.log('\n🎮 Recent Games:');
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
        console.log(`   Entropy TX: ${game.entropyTxHash ? '🔗 ETH' : '❌'} | Moca TX: ${game.mocaLogTx ? '🔗 MOCA' : '❌'}`);
        console.log(`   Date: ${new Date(game.timestamp).toLocaleString()}`);
        console.log('');
      });
      
      console.log('\n🔗 Contract Info:');
      console.log(`   Contract: ${historyResult.contractInfo.contractAddress}`);
      console.log(`   Network: ${historyResult.contractInfo.network}`);
      console.log(`   Explorer: ${historyResult.contractInfo.explorerUrl}`);
      
    } else {
      console.error('❌ History Error:', historyResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMocaLogging();