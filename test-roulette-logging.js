const fetch = require('node-fetch');

async function testRouletteLogging() {
  try {
    console.log('🎰 Testing Roulette Moca Logging...');
    
    // Simulate a roulette game result
    const rouletteGame = {
      player: '0x025182b20Da64b5997d09a5a62489741F68d9B96',
      gameType: 'ROULETTE',
      gameSubType: 'red',
      betAmount: '1.0',
      won: true,
      winAmount: '2.0',
      multiplier: '2.0',
      entropyTxHash: '0x611b63d437c9bc7a11d1dd4609a46a2fc811fc03d14ac5bfeeae2d88cec152c3',
      entropySequenceNumber: '1762214389610',
      randomValue: '184900',
      gameData: JSON.stringify({
        winningNumber: 18,
        winningColor: 'red',
        totalBets: 1,
        winningBets: [{ name: 'Red', amount: 1.0, multiplier: 2.0 }],
        losingBets: []
      })
    };
    
    console.log('📊 Roulette game data:', rouletteGame);
    
    const response = await fetch('http://localhost:3000/api/game-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rouletteGame)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP error:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Roulette game logged successfully!');
      console.log('🆔 Game ID:', result.gameId);
      console.log('🔗 Moca TX:', result.transactionHash);
      console.log('🌐 Explorer:', result.mocaExplorerUrl);
      console.log('⛽ Gas used:', result.gasUsed);
      console.log('🔄 Attempts:', result.attempts);
    } else {
      console.error('❌ Roulette logging failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRouletteLogging();