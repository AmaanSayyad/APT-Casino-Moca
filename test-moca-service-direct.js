/**
 * Direct Test for MOCA Game Logger Service
 * Tests the service directly without requiring the Next.js server
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from multiple sources
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

// Also try to load from env.md if it exists
const envMdPath = join(__dirname, 'env.md');
try {
  const fs = (await import('fs')).default || (await import('fs'));
  if (fs.existsSync && fs.existsSync(envMdPath)) {
    const envMd = fs.readFileSync(envMdPath, 'utf8');
    const lines = envMd.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    });
  }
} catch (e) {
  // env.md doesn't exist or can't be read, that's okay
  console.log('⚠️ Could not load env.md:', e.message);
}

console.log('🔍 Environment Check:');
console.log(`   NEXT_PUBLIC_MOCA_GAME_LOGGER_CONTRACT: ${process.env.NEXT_PUBLIC_MOCA_GAME_LOGGER_CONTRACT || 'NOT SET'}`);
console.log(`   MOCA_TREASURY_PRIVATE_KEY: ${process.env.MOCA_TREASURY_PRIVATE_KEY ? 'SET' : 'NOT SET'}`);
console.log(`   MOCA_TREASURY_ADDRESS: ${process.env.MOCA_TREASURY_ADDRESS || 'NOT SET'}`);
console.log('');

// Import the service directly
import mocaGameLoggerService from './src/services/MocaGameLoggerService.js';

async function testMocaService() {
  console.log('🎮 Testing MOCA Game Logger Service Directly\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Initialize Service
    console.log('\n📊 Test 1: Initializing Service...');
    try {
      await mocaGameLoggerService.initialize();
      console.log('✅ Service initialized successfully');
      
      const serviceInfo = mocaGameLoggerService.getServiceInfo();
      console.log(`📋 Contract Address: ${serviceInfo.contractAddress || 'N/A'}`);
      console.log(`🌐 Network: ${serviceInfo.network || 'N/A'}`);
      console.log(`🔗 Chain ID: ${serviceInfo.chainId || 'N/A'}`);
      console.log(`🏦 Treasury: ${serviceInfo.treasuryAddress || 'N/A'}`);
      
      const networkConfig = mocaGameLoggerService.getNetworkConfig();
      console.log(`🌍 RPC URL: ${networkConfig.rpcUrl}`);
      console.log(`🔍 Explorer: ${networkConfig.explorerUrl}`);
    } catch (error) {
      console.log('❌ Service initialization failed:', error.message);
      console.error('Full error:', error);
      return;
    }

    // Test 2: Get Contract Stats
    console.log('\n📊 Test 2: Getting Contract Statistics...');
    try {
      const stats = await mocaGameLoggerService.getLoggerStats();
      console.log('✅ Contract Statistics:');
      console.log(`   Total Logs: ${stats.totalLogs}`);
      console.log(`   Total Gas Used: ${stats.totalGasUsed}`);
      console.log(`   Average Gas/Log: ${stats.averageGasPerLog}`);
      console.log(`   Last Logger: ${stats.lastLogger}`);
    } catch (error) {
      console.log('❌ Failed to get stats:', error.message);
      console.log('⚠️ This might be normal if the contract is not deployed yet');
    }

    // Test 3: Log a Test Game
    console.log('\n🎲 Test 3: Logging a Test Game...');
    
    const testGameId = `test_game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const testUserAddress = process.env.MOCA_TREASURY_ADDRESS || process.env.TREASURY_ADDRESS || '0x025182b20Da64b5997d09a5a62489741F68d9B96';
    
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
    
    try {
      const result = await mocaGameLoggerService.logGameResult(testGameData);
      
      if (result.success) {
        console.log('\n✅ Game logged successfully!');
        console.log(`🔗 Transaction Hash: ${result.transactionHash}`);
        console.log(`📦 Block Number: ${result.blockNumber}`);
        console.log(`⛽ Gas Used: ${result.gasUsed}`);
        console.log(`🌐 Explorer URL: ${result.mocaExplorerUrl}`);
        console.log(`🆔 Game ID: ${result.gameId}`);
        console.log(`🎮 Game Type: ${result.gameType}`);
        
        if (result.eventData) {
          console.log('\n📊 Event Data:');
          console.log(`   Game Type: ${result.eventData.gameType}`);
          console.log(`   User: ${result.eventData.userAddress}`);
          console.log(`   Bet: ${result.eventData.betAmount} wei`);
          console.log(`   Payout: ${result.eventData.payoutAmount} wei`);
          console.log(`   Win: ${result.eventData.isWin}`);
          console.log(`   Timestamp: ${new Date(Number(result.eventData.timestamp) * 1000).toISOString()}`);
        }

        // Test 4: Retrieve the logged game
        console.log('\n📖 Test 4: Retrieving Logged Game...');
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait a bit for block confirmation
          
          const gameLog = await mocaGameLoggerService.getGameLog(testGameId);
          console.log('✅ Game retrieved successfully:');
          console.log(`   Game ID: ${gameLog.gameId}`);
          console.log(`   Game Type: ${gameLog.gameType}`);
          console.log(`   User: ${gameLog.userAddress}`);
          console.log(`   Bet: ${ethers.formatEther(gameLog.betAmount)} MOCA`);
          console.log(`   Payout: ${ethers.formatEther(gameLog.payoutAmount)} MOCA`);
          console.log(`   Win: ${gameLog.isWin}`);
          console.log(`   Timestamp: ${new Date(Number(gameLog.timestamp) * 1000).toISOString()}`);
          console.log(`   Block Number: ${gameLog.blockNumber}`);
        } catch (error) {
          console.log('❌ Failed to retrieve game:', error.message);
          console.log('⚠️ This might be normal if the transaction is still pending');
        }

        // Test 5: Get Updated Stats
        console.log('\n📊 Test 5: Getting Updated Statistics...');
        try {
          const updatedStats = await mocaGameLoggerService.getLoggerStats();
          console.log('✅ Updated Statistics:');
          console.log(`   Total Logs: ${updatedStats.totalLogs}`);
          console.log(`   Total Gas Used: ${updatedStats.totalGasUsed}`);
          console.log(`   Average Gas/Log: ${updatedStats.averageGasPerLog}`);
        } catch (error) {
          console.log('❌ Failed to get updated stats:', error.message);
        }

      } else {
        console.log('\n❌ Failed to log game:', result.error);
        console.log('⚠️ Error details:', result);
      }
    } catch (error) {
      console.log('\n❌ Logging failed:', error.message);
      console.error('Full error:', error);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('\n💡 Tip: Check the transaction on MOCA Explorer if logging was successful\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
testMocaService().catch(console.error);

