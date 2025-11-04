const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('💰 Checking treasury balance...');

  const treasuryAddress = process.env.MOCA_TREASURY_ADDRESS;
  console.log('🏦 Treasury address:', treasuryAddress);

  // Create provider
  const provider = new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || 'https://testnet-rpc.mocachain.org/'
  );

  // Check balance
  const balance = await provider.getBalance(treasuryAddress);
  const balanceInMoca = ethers.formatEther(balance);
  
  console.log('💰 Balance:', balanceInMoca, 'MOCA');
  console.log('💰 Balance (wei):', balance.toString());

  // Check if balance is sufficient for deployment (with lower gas settings)
  const gasLimit = 3000000n;
  const gasPrice = ethers.parseUnits('1', 'gwei'); // 1 gwei
  const estimatedGasCost = gasLimit * gasPrice;
  console.log('⛽ Required for deployment:', ethers.formatEther(estimatedGasCost), 'MOCA');
  
  if (balance >= estimatedGasCost) {
    console.log('✅ Balance is sufficient for deployment');
  } else {
    console.log('❌ Balance is insufficient for deployment');
    console.log('💸 Need additional:', ethers.formatEther(estimatedGasCost - balance), 'MOCA');
  }

  return {
    balance: balanceInMoca,
    sufficient: balance >= estimatedGasCost
  };
}

main()
  .then((result) => {
    console.log('\n✅ Balance check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Balance check failed:', error);
    process.exit(1);
  });