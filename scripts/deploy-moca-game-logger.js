const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🚀 Deploying MocaGameLogger contract to Moca Chain...');

  // Get the treasury address from environment
  const treasuryAddress = process.env.MOCA_TREASURY_ADDRESS || process.env.TREASURY_ADDRESS;
  
  if (!treasuryAddress) {
    throw new Error('Treasury address not found in environment variables');
  }

  console.log('🏦 Treasury address:', treasuryAddress);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log('📍 Signer address:', signer.address);

  // Get provider and check balance
  const provider = signer.provider;
  const balance = await provider.getBalance(signer.address);
  console.log('💰 Signer balance:', ethers.formatEther(balance), 'MOCA');
  
  if (balance === 0n) {
    throw new Error('Insufficient balance for deployment. Please fund the treasury wallet.');
  }

  // Get the contract factory
  const MocaGameLogger = await ethers.getContractFactory('MocaGameLogger');

  // Deploy the contract - let ethers handle nonce automatically
  console.log('📝 Deploying contract...');
  const mocaGameLogger = await MocaGameLogger.deploy(treasuryAddress, {
    gasLimit: 3000000,
    gasPrice: ethers.parseUnits('1', 'gwei') // Much lower gas price for MOCA
  });

  // Wait for deployment
  console.log('⏳ Waiting for deployment confirmation...');
  await mocaGameLogger.waitForDeployment();
  
  const contractAddress = await mocaGameLogger.getAddress();
  console.log('✅ MocaGameLogger deployed to:', contractAddress);

  // Verify deployment
  console.log('🔍 Verifying deployment...');
  const contractInfo = await mocaGameLogger.getContractInfo();
  console.log('📋 Contract Info:');
  console.log('  - Contract Address:', contractInfo.contractAddress);
  console.log('  - Treasury Address:', contractInfo.treasuryAddress);
  console.log('  - Total Logs:', contractInfo.totalLogsCount.toString());

  console.log('\n🎉 Deployment completed successfully!');
  console.log('\n📋 Summary:');
  console.log('  - Contract Address:', contractAddress);
  console.log('  - Network: Moca Chain Testnet');
  console.log('  - Treasury Address:', treasuryAddress);
  console.log('  - Explorer URL: https://testnet-scan.mocachain.org/address/' + contractAddress);
  
  console.log('\n🔧 Next steps:');
  console.log('1. Update .env file with contract address:');
  console.log(`   NEXT_PUBLIC_MOCA_GAME_LOGGER_CONTRACT=${contractAddress}`);
  console.log('2. Restart your application to use the new contract');
  console.log('3. Test game logging through the API endpoints');

  return contractAddress;
}

// Execute deployment
main()
  .then((contractAddress) => {
    console.log('\n✅ Deployment script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });