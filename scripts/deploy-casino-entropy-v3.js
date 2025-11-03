const { ethers } = require('hardhat');

async function main() {
  console.log('🚀 Deploying CasinoEntropyConsumerV3 to Arbitrum Sepolia...');
  
  // Configuration
  const PYTH_ENTROPY_ADDRESS = '0x549ebba8036ab746611b4ffa1423eb0a4df61440';
  const PYTH_PROVIDER_ADDRESS = '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344'; // Correct provider
  const TREASURY_ADDRESS = '0xb424d2369F07b925D1218B08e56700AF5928287b';
  
  console.log('📋 Configuration:');
  console.log('  Pyth Entropy:', PYTH_ENTROPY_ADDRESS);
  console.log('  Provider:', PYTH_PROVIDER_ADDRESS);
  console.log('  Treasury:', TREASURY_ADDRESS);
  
  // Get the contract factory
  const CasinoEntropyConsumerV3 = await ethers.getContractFactory('CasinoEntropyConsumerV3');
  
  // Deploy the contract
  console.log('🔄 Deploying contract...');
  const contract = await CasinoEntropyConsumerV3.deploy(
    PYTH_ENTROPY_ADDRESS,
    PYTH_PROVIDER_ADDRESS,
    TREASURY_ADDRESS
  );
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log('✅ CasinoEntropyConsumerV3 deployed to:', contractAddress);
  
  // Verify the deployment
  console.log('🔍 Verifying deployment...');
  const contractInfo = await contract.getContractInfo();
  console.log('  Contract Address:', contractInfo.contractAddress);
  console.log('  Treasury Address:', contractInfo.treasuryAddress);
  console.log('  Entropy Address:', contractInfo.entropyAddress);
  console.log('  Provider Address:', contractInfo.providerAddress);
  
  // Check entropy fee
  const fee = await contract.entropyFee();
  console.log('  Entropy Fee:', ethers.formatEther(fee), 'ETH');
  
  // Save deployment info
  const deploymentInfo = {
    network: 'arbitrum-sepolia',
    chainId: '421614',
    contractAddress: contractAddress,
    pythEntropyAddress: PYTH_ENTROPY_ADDRESS,
    providerAddress: PYTH_PROVIDER_ADDRESS,
    treasuryAddress: TREASURY_ADDRESS,
    deployer: TREASURY_ADDRESS,
    deploymentTime: new Date().toISOString(),
    transactionHash: contract.deploymentTransaction().hash
  };
  
  const fs = require('fs');
  const deploymentFile = `deployments/casino-entropy-v3-arbitrum-sepolia-${Date.now()}.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log('💾 Deployment info saved to:', deploymentFile);
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Update .env file with new contract address:');
  console.log(`   NEXT_PUBLIC_ARBITRUM_SEPOLIA_CASINO_CONTRACT=${contractAddress}`);
  console.log('2. Test entropy generation with the new contract');
  
  return contractAddress;
}

main()
  .then((address) => {
    console.log('✅ Deployment completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });