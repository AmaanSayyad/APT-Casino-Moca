// Test PythEntropyService
import PythEntropyService from './src/services/PythEntropyService.js';

async function testEntropyService() {
  try {
    console.log('🎲 Testing PythEntropyService...');
    
    // Initialize service
    await PythEntropyService.initialize('arbitrum-sepolia');
    
    console.log('✅ Service initialized');
    console.log('📍 Network:', PythEntropyService.getNetworkConfig());
    
    // Generate random for a game
    const result = await PythEntropyService.generateRandom('ROULETTE', {
      betType: 'red',
      betAmount: '1.0'
    });
    
    if (result.success) {
      console.log('✅ Random generation successful!');
      console.log('🎲 Random value:', result.randomValue);
      console.log('🔗 Transaction:', result.entropyProof.transactionHash);
      console.log('📊 Source:', result.metadata.source);
    } else {
      console.error('❌ Random generation failed');
    }
    
  } catch (error) {
    console.error('❌ Service test failed:', error.message);
  }
}

testEntropyService();