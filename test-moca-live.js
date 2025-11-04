/**
 * Live Test - MOCA Testnet Logging
 * Test if the contract logging actually works on MOCA testnet
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mocaGameLoggerService from './src/services/MocaGameLoggerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

async function testLiveLogging() {
  console.log('🎮 Testing MOCA Testnet Live Logging\n');
  console.log('='.repeat(60));
  
  try {
    // Initialize service
    console.log('\n📊 Initializing Service...');
    await mocaGameLoggerService.initialize();
    console.log('✅ Service initialized');
    
    const serviceInfo = mocaGameLoggerService.getServiceInfo();
    console.log(`📋 Contract: ${serviceInfo.contractAddress}`);
    console.log(`🏦 Treasury: ${serviceInfo.treasuryAddress}`);
    
    // Check if contract exists by trying to read a simple value
    console.log('\n🔍 Checking Contract Status...');
    try {
      const provider = mocaGameLoggerService.provider;
      const code = await provider.getCode(serviceInfo.contractAddress);
      if (code === '0x') {
        console.log('❌ Contract does not exist at this address!');
        return;
      }
      console.log('✅ Contract code found (deployed)');
    } catch (error) {
      console.log('❌ Could not check contract:', error.message);
      return;
    }
    
    // Try to get contract info directly
    console.log('\n📊 Checking Contract Info...');
    try {
      const contract = mocaGameLoggerService.contract;
      const contractInfo = await contract.getContractInfo();
      console.log('✅ Contract Info:');
      console.log(`   Contract Address: ${contractInfo.contractAddress}`);
      console.log(`   Treasury Address: ${contractInfo.treasuryAddress}`);
      console.log(`   Total Logs: ${contractInfo.totalLogsCount.toString()}`);
      
      // Check if treasury matches
      if (contractInfo.treasuryAddress.toLowerCase() !== serviceInfo.treasuryAddress.toLowerCase()) {
        console.log('\n⚠️ WARNING: Treasury address mismatch!');
        console.log(`   Contract Treasury: ${contractInfo.treasuryAddress}`);
        console.log(`   Service Treasury: ${serviceInfo.treasuryAddress}`);
        console.log('   This will cause logging to fail!');
      }
    } catch (error) {
      console.log('❌ Could not get contract info:', error.message);
      console.log('   This might indicate an ABI mismatch or contract issue');
    }
    
    // Try to log a test game
    console.log('\n🎲 Attempting to Log a Test Game...');
    const testGameData = {
      gameId: `live_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gameType: 'ROULETTE',
      userAddress: serviceInfo.treasuryAddress, // Use treasury as test user
      betAmount: '0.001', // Small amount for testing
      payoutAmount: '0.0035', // Small payout
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
        requestId: `live_test_request_${Date.now()}`,
        transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
        randomValue: '12345678901234567890'
      }
    };
    
    console.log(`🎯 Game ID: ${testGameData.gameId}`);
    console.log(`👤 User: ${testGameData.userAddress}`);
    
    const result = await mocaGameLoggerService.logGameResult(testGameData);
    
    if (result.success) {
      console.log('\n✅ SUCCESS! Game logged to MOCA Testnet!');
      console.log(`🔗 Transaction Hash: ${result.transactionHash}`);
      console.log(`📦 Block Number: ${result.blockNumber}`);
      console.log(`⛽ Gas Used: ${result.gasUsed}`);
      console.log(`🌐 Explorer: ${result.mocaExplorerUrl}`);
      
      // Wait a bit and try to retrieve
      console.log('\n📖 Verifying: Retrieving logged game...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      try {
        const gameLog = await mocaGameLoggerService.getGameLog(testGameData.gameId);
        console.log('✅ Game retrieved successfully!');
        console.log(`   Game ID: ${gameLog.gameId}`);
        console.log(`   Game Type: ${gameLog.gameType}`);
        console.log(`   Bet: ${ethers.formatEther(gameLog.betAmount)} MOCA`);
        console.log(`   Payout: ${ethers.formatEther(gameLog.payoutAmount)} MOCA`);
        console.log(`   Win: ${gameLog.isWin}`);
      } catch (error) {
        console.log('⚠️ Could not retrieve game (might need more time):', error.message);
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ MOCA TESTNET LOGGING IS WORKING!');
      console.log(`\n🔗 View on Explorer: ${result.mocaExplorerUrl}\n`);
      
    } else {
      console.log('\n❌ FAILED to log game');
      console.log(`Error: ${result.error}`);
      console.log('\nPossible issues:');
      console.log('1. Treasury address mismatch');
      console.log('2. Insufficient gas');
      console.log('3. Contract ABI mismatch');
      console.log('4. Network/RPC issues');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLiveLogging().catch(console.error);

