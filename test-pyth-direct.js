const { ethers } = require('ethers');
require('dotenv').config();

async function testPythDirect() {
  try {
    console.log('🎲 Testing Pyth Entropy Direct Usage...');
    
    // Connect to Arbitrum Sepolia
    const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    
    // Pyth Entropy contract details
    const pythAddress = '0x549ebba8036ab746611b4ffa1423eb0a4df61440';
    const providerAddress = '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344';
    const treasuryKey = process.env.TREASURY_PRIVATE_KEY;
    
    console.log('📍 Pyth Entropy:', pythAddress);
    console.log('📍 Provider:', providerAddress);
    
    // Pyth Entropy ABI
    const pythABI = [
      "function requestWithCallback(address provider, bytes32 userRandomNumber) external payable returns (uint64)",
      "function getFee(address provider) external view returns (uint128)",
      "function getDefaultProvider() external view returns (address)",
      "function getRandomValue(address provider, uint64 sequenceNumber, bytes32 userRandomNumber) external view returns (bytes32)"
    ];
    
    // Create contract instance
    const pythContract = new ethers.Contract(pythAddress, pythABI, provider);
    
    // Check contract exists
    const code = await provider.getCode(pythAddress);
    console.log('✅ Pyth contract exists:', code !== '0x');
    
    // Get fee
    const fee = await pythContract.getFee(providerAddress);
    console.log('💰 Entropy fee:', ethers.formatEther(fee), 'ETH');
    
    // Get default provider
    const defaultProvider = await pythContract.getDefaultProvider();
    console.log('🔧 Default provider:', defaultProvider);
    console.log('✅ Provider matches:', providerAddress.toLowerCase() === defaultProvider.toLowerCase());
    
    // Create wallet
    const wallet = new ethers.Wallet(treasuryKey, provider);
    console.log('🏦 Treasury address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💳 Treasury balance:', ethers.formatEther(balance), 'ETH');
    console.log('✅ Can afford entropy:', balance >= fee);
    
    if (balance >= fee) {
      console.log('\n🚀 Attempting entropy request...');
      
      // Generate user random number
      const userRandomNumber = ethers.randomBytes(32);
      console.log('🎲 User random:', ethers.hexlify(userRandomNumber));
      
      // Connect wallet to contract
      const pythWithSigner = pythContract.connect(wallet);
      
      // Request entropy
      const tx = await pythWithSigner.requestWithCallback(providerAddress, userRandomNumber, {
        value: fee,
        gasLimit: 500000
      });
      
      console.log('✅ Transaction sent:', tx.hash);
      console.log('🔗 Arbitrum Explorer:', `https://sepolia.arbiscan.io/tx/${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      
      // Try to extract sequence number from logs
      console.log('📋 Transaction logs:', receipt.logs.length);
      
      for (let i = 0; i < receipt.logs.length; i++) {
        const log = receipt.logs[i];
        console.log(`Log ${i}:`, {
          address: log.address,
          topics: log.topics.slice(0, 2), // Show first 2 topics
          data: log.data.slice(0, 20) + '...' // Show first part of data
        });
      }
      
      console.log('✅ Pyth Entropy request completed successfully!');
      console.log('🎯 Check Entropy Explorer: https://entropy-explorer.pyth.network/?chain=arbitrum-sepolia&search=' + tx.hash);
      
    } else {
      console.log('⚠️ Insufficient balance for entropy request');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.data) {
      console.log('Error data:', error.data);
    }
  }
}

testPythDirect();