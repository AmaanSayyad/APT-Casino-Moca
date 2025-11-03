const fetch = require('node-fetch');

async function testEntropyAPI() {
  try {
    console.log('🎲 Testing Entropy API...');
    
    const response = await fetch('http://localhost:3000/api/generate-entropy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameType: 'ROULETTE',
        gameConfig: {
          betType: 'red',
          betAmount: '1.0'
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ HTTP error:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ API Success!');
      console.log('🎲 Random value:', result.randomValue);
      console.log('📊 Sequence number:', result.sequenceNumber);
      console.log('🔗 Transaction:', result.entropyProof.transactionHash);
      console.log('🌐 Explorer:', result.entropyProof.arbitrumExplorerUrl);
      console.log('🎯 Entropy Explorer:', result.entropyProof.explorerUrl);
    } else {
      console.error('❌ API Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testEntropyAPI();