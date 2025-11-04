/**
 * Check deployed contract details
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const CONTRACT_ADDRESS = '0x51a9856C3b33EeFf291eb063316fc476C32C3a27';
const RPC_URL = process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || 'https://testnet-rpc.mocachain.org/';

// Minimal ABI to check treasury
const MINIMAL_ABI = [
  "function treasury() public view returns (address)",
  "function getContractInfo() external view returns (address contractAddress, address treasuryAddress, uint256 totalLogsCount)"
];

async function checkContract() {
  console.log('🔍 Checking MOCA Game Logger Contract\n');
  console.log('='.repeat(60));
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // Check if contract exists
  console.log(`📍 Contract Address: ${CONTRACT_ADDRESS}`);
  const code = await provider.getCode(CONTRACT_ADDRESS);
  if (code === '0x') {
    console.log('❌ Contract does not exist at this address!');
    return;
  }
  console.log('✅ Contract exists (code found)');
  
  // Try to read treasury address
  console.log('\n📊 Reading Contract State...');
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, MINIMAL_ABI, provider);
    
    // Try getContractInfo first
    try {
      const info = await contract.getContractInfo();
      console.log('✅ Contract Info:');
      console.log(`   Contract Address: ${info.contractAddress}`);
      console.log(`   Treasury Address: ${info.treasuryAddress}`);
      console.log(`   Total Logs: ${info.totalLogsCount.toString()}`);
      
      const expectedTreasury = process.env.MOCA_TREASURY_ADDRESS || process.env.TREASURY_ADDRESS || '0x025182b20Da64b5997d09a5a62489741F68d9B96';
      console.log(`\n🏦 Expected Treasury: ${expectedTreasury}`);
      console.log(`🏦 Contract Treasury: ${info.treasuryAddress}`);
      
      if (info.treasuryAddress.toLowerCase() !== expectedTreasury.toLowerCase()) {
        console.log('\n⚠️ TREASURY ADDRESS MISMATCH!');
        console.log('   This is why logging fails.');
        console.log(`\n   Update your .env with:`);
        console.log(`   MOCA_TREASURY_ADDRESS=${info.treasuryAddress}`);
      } else {
        console.log('\n✅ Treasury addresses match!');
      }
    } catch (error) {
      console.log('⚠️ getContractInfo not available, trying treasury()...');
      const treasury = await contract.treasury();
      console.log(`   Treasury Address: ${treasury}`);
      
      const expectedTreasury = process.env.MOCA_TREASURY_ADDRESS || process.env.TREASURY_ADDRESS || '0x025182b20Da64b5997d09a5a62489741F68d9B96';
      console.log(`\n🏦 Expected Treasury: ${expectedTreasury}`);
      console.log(`🏦 Contract Treasury: ${treasury}`);
      
      if (treasury.toLowerCase() !== expectedTreasury.toLowerCase()) {
        console.log('\n⚠️ TREASURY ADDRESS MISMATCH!');
        console.log('   This is why logging fails.');
        console.log(`\n   Update your .env with:`);
        console.log(`   MOCA_TREASURY_ADDRESS=${treasury}`);
      } else {
        console.log('\n✅ Treasury addresses match!');
      }
    }
  } catch (error) {
    console.log('❌ Could not read contract:', error.message);
    console.log('   This might indicate an ABI mismatch');
  }
  
  console.log('\n' + '='.repeat(60));
}

checkContract().catch(console.error);

