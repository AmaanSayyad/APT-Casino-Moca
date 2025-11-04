/**
 * Test Moca Game Logger Contract
 * Tests the deployed MocaGameLogger contract functionality
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Contract ABI (minimal for testing)
const MOCA_GAME_LOGGER_ABI = [
  "function logGame(string gameId, string gameType, address userAddress, uint256 betAmount, uint256 payoutAmount, bool isWin, string gameConfig, string resultData, string entropyProof) external",
  "function getGameLog(string gameId) external view returns (tuple(string gameId, string gameType, address userAddress, uint256 betAmount, uint256 payoutAmount, bool isWin, string gameConfig, string resultData, string entropyProof, uint256 timestamp, uint256 blockNumber))",
  "function getLoggerStats() external view returns (uint256 totalLogs, uint256 totalGasUsed, address lastLogger, uint256 averageGasPerLog)",
  "function getContractInfo() external view returns (address contractAddress, address treasuryAddress, uint256 totalLogsCount)",
  "event GameLogged(string indexed gameId, string indexed gameType, address indexed userAddress, uint256 betAmount, uint256 payoutAmount, bool isWin, uint256 timestamp)"
];

async function testMocaGameLogger() {
  try {
    console.log('🎮 Testing Moca Game Logger Contract...\n');

    // Network configuration
    const networkConfig = {
      chainId: 222888,
      name: 'Moca Chain Testnet',
      rpcUrl: process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || 'https://testnet-rpc.mocachain.org/',
      explorerUrl: process.env.NEXT_PUBLIC_MOCA_TESTNET_EXPLORER || 'https://testnet-scan.mocachain.org'
    };

    const contractAddress = process.env.NEXT_PUBLIC_MOCA_GAME_LOGGER_CONTRACT;
    
    if (!contractAddress) {
      throw new Error('NEXT_PUBLIC_MOCA_GAME_LOGGER_CONTRACT not set in .env');
    }

    console.log(`📋 Contract Address: ${contractAddress}`);
    console.log(`🌐 Network: ${networkConfig.name}`);
    console.log(`🔗 RPC: ${networkConfig.rpcUrl}\n`);

    // Create provider
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    
    // Test network connection
    console.log('🔍 Testing network connection...');
    const network = await provider.getNetwork();
    console.log(`✅ Connected to chain ID: ${network.chainId}`);
    
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 Current block: ${blockNumber}\n`);

    // Create treasury wallet
    const treasuryKey = process.env.MOCA_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY;
    if (!treasuryKey) {
      throw new Error('Treasury private key not found in .env');
    }

    const treasuryWallet = new ethers.Wallet(treasuryKey, provider);
    console.log(`🏦 Treasury Address: ${treasuryWallet.address}`);
    
    // Check treasury balance
    const balance = await provider.getBalance(treasuryWallet.address);
    console.log(`💰 Treasury Balance: ${ethers.formatEther(balance)} MOCA\n`);

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, MOCA_GAME_LOGGER_ABI, treasuryWallet);

    // Test 1: Get contract info
    console.log('📊 Test 1: Getting contract info...');
    try {
      const [contractAddr, treasuryAddr, totalLogs] = await contract.getContractInfo();
      console.log(`✅ Contract Address: ${contractAddr}`);
      console.log(`✅ Treasury Address: ${treasuryAddr}`);
      console.log(`✅ Total Logs: ${totalLogs.toString()}\n`);
    } catch (error) {
      console.error('❌ Failed to get contract info:', error.message);
    }

    // Test 2: Get logger stats
    console.log('📈 Test 2: Getting logger stats...');
    try {
      const [totalLogs, totalGasUsed, lastLogger, averageGasPerLog] = await contract.getLoggerStats();
      console.log(`✅ Total Logs: ${totalLogs.toString()}`);
      console.log(`✅ Total Gas Used: ${totalGasUsed.toString()}`);
      console.log(`✅ Last Logger: ${lastLogger}`);
      console.log(`✅ Average Gas Per Log: ${averageGasPerLog.toString()}\n`);
    } catch (error) {
      console.error('❌ Failed to get logger stats:', error.message);
    }

    // Test 3: Log a test game
    console.log('🎲 Test 3: Logging a test game...');
    try {
      const gameId = `test_game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const gameType = 'ROULETTE';
      const userAddress = treasuryWallet.address; // Use treasury as test user
      const betAmount = ethers.parseEther('0.01'); // 0.01 MOCA
      const payoutAmount = ethers.parseEther('0.35'); // 0.35 MOCA (win)
      const isWin = true;
      
      const gameConfig = JSON.stringify({
        betType: 'straight',
        betValue: 7,
        wheelType: 'european'
      });
      
      const resultData = JSON.stringify({
        number: 7,
        color: 'red',
        properties: {
          isEven: false,
          isOdd: true,
          isRed: true,
          isBlack: false
        }
      });
      
      const entropyProof = JSON.stringify({
        requestId: 'test_request_123',
        transactionHash: '0x1234567890abcdef',
        randomValue: '12345678901234567890'
      });

      console.log(`🎯 Game ID: ${gameId}`);
      console.log(`🎮 Game Type: ${gameType}`);
      console.log(`👤 User: ${userAddress}`);
      console.log(`💰 Bet: ${ethers.formatEther(betAmount)} MOCA`);
      console.log(`🏆 Payout: ${ethers.formatEther(payoutAmount)} MOCA`);

      // Send transaction
      const tx = await contract.logGame(
        gameId,
        gameType,
        userAddress,
        betAmount,
        payoutAmount,
        isWin,
        gameConfig,
        resultData,
        entropyProof
      );

      console.log(`📤 Transaction sent: ${tx.hash}`);
      console.log(`🔗 Explorer: ${networkConfig.explorerUrl}/tx/${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}\n`);

      // Test 4: Retrieve the logged game
      console.log('📖 Test 4: Retrieving logged game...');
      try {
        const gameLog = await contract.getGameLog(gameId);
        console.log(`✅ Retrieved game: ${gameLog.gameId}`);
        console.log(`✅ Game type: ${gameLog.gameType}`);
        console.log(`✅ User: ${gameLog.userAddress}`);
        console.log(`✅ Bet amount: ${ethers.formatEther(gameLog.betAmount)} MOCA`);
        console.log(`✅ Payout: ${ethers.formatEther(gameLog.payoutAmount)} MOCA`);
        console.log(`✅ Is win: ${gameLog.isWin}`);
        console.log(`✅ Timestamp: ${new Date(Number(gameLog.timestamp) * 1000).toISOString()}`);
        console.log(`✅ Block: ${gameLog.blockNumber.toString()}\n`);
      } catch (error) {
        console.error('❌ Failed to retrieve game log:', error.message);
      }

      // Test 5: Get updated stats
      console.log('📊 Test 5: Getting updated stats...');
      try {
        const [totalLogs, totalGasUsed, lastLogger, averageGasPerLog] = await contract.getLoggerStats();
        console.log(`✅ Updated Total Logs: ${totalLogs.toString()}`);
        console.log(`✅ Updated Total Gas Used: ${totalGasUsed.toString()}`);
        console.log(`✅ Last Logger: ${lastLogger}`);
        console.log(`✅ Updated Average Gas Per Log: ${averageGasPerLog.toString()}\n`);
      } catch (error) {
        console.error('❌ Failed to get updated stats:', error.message);
      }

    } catch (error) {
      console.error('❌ Failed to log test game:', error.message);
      if (error.data) {
        console.error('Error data:', error.data);
      }
    }

    console.log('🎉 Moca Game Logger test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testMocaGameLogger().catch(console.error);