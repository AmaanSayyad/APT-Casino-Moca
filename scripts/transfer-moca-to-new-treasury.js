const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('💰 Transferring MOCA from old treasury to new treasury...');

  // Old treasury credentials
  const oldTreasuryAddress = process.env.MOCA_OLD_TREASURY_ADDRESS;
  const oldTreasuryPrivateKey = process.env.MOCA_OLD_TREASURY_PRIVATE_KEY;
  
  // New treasury address
  const newTreasuryAddress = process.env.MOCA_TREASURY_ADDRESS || '0xA4d1836D0D182634D5b0Edd927760a899124164C';
  
  if (!oldTreasuryAddress || !oldTreasuryPrivateKey) {
    throw new Error('Old treasury credentials not found in environment variables. Please set MOCA_OLD_TREASURY_ADDRESS and MOCA_OLD_TREASURY_PRIVATE_KEY');
  }
  
  if (!newTreasuryAddress) {
    throw new Error('New treasury address not found. Please set MOCA_TREASURY_ADDRESS');
  }

  console.log('🏦 Old Treasury:', oldTreasuryAddress);
  console.log('🏦 New Treasury:', newTreasuryAddress);

  // Create provider for Moca Chain
  const provider = new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || 'https://testnet-rpc.mocachain.org/'
  );

  // Create wallet instance for old treasury
  const oldTreasuryWallet = new ethers.Wallet(oldTreasuryPrivateKey, provider);

  // Check balance of old treasury
  const balance = await provider.getBalance(oldTreasuryAddress);
  const balanceInMoca = ethers.formatEther(balance);
  
  console.log('💰 Old Treasury Balance:', balanceInMoca, 'MOCA');

  if (balance === 0n) {
    console.log('⚠️ Old treasury has no MOCA to transfer');
    return;
  }

  // Calculate gas cost for transfer
  const gasPrice = await provider.getFeeData();
  const gasLimit = 21000n; // Standard transfer gas limit
  const gasCost = gasLimit * gasPrice.gasPrice;
  
  console.log('⛽ Estimated gas cost:', ethers.formatEther(gasCost), 'MOCA');

  // Calculate amount to transfer (leave some for gas)
  const transferAmount = balance - gasCost - ethers.parseEther('0.001'); // Leave extra 0.001 MOCA buffer
  
  if (transferAmount <= 0n) {
    console.log('⚠️ Not enough MOCA to cover gas costs');
    return;
  }

  console.log('📤 Transferring:', ethers.formatEther(transferAmount), 'MOCA');

  // Get current nonce for old treasury
  const latestNonce = await provider.getTransactionCount(oldTreasuryAddress, 'latest');
  const pendingNonce = await provider.getTransactionCount(oldTreasuryAddress, 'pending');
  console.log('📊 Latest nonce:', latestNonce);
  console.log('📊 Pending nonce:', pendingNonce);
  
  // Use the pending nonce (or latest if no pending)
  const nonce = pendingNonce > latestNonce ? pendingNonce : latestNonce;
  console.log('📊 Using nonce:', nonce);

  // Create transfer transaction
  const tx = {
    to: newTreasuryAddress,
    value: transferAmount,
    gasLimit: gasLimit,
    gasPrice: gasPrice.gasPrice,
    nonce: nonce
  };

  console.log('📝 Sending transfer transaction...');
  
  // Send transaction
  const txResponse = await oldTreasuryWallet.sendTransaction(tx);
  console.log('📤 Transaction sent:', txResponse.hash);
  console.log('🔗 Explorer:', `https://testnet-scan.mocachain.org/tx/${txResponse.hash}`);

  // Wait for confirmation
  console.log('⏳ Waiting for confirmation...');
  const receipt = await txResponse.wait();
  
  console.log('✅ Transfer completed!');
  console.log('📦 Block:', receipt.blockNumber);
  console.log('⛽ Gas used:', receipt.gasUsed.toString());

  // Check new balances
  const oldBalance = await provider.getBalance(oldTreasuryAddress);
  const newBalance = await provider.getBalance(newTreasuryAddress);
  
  console.log('\n💰 Final Balances:');
  console.log('🏦 Old Treasury:', ethers.formatEther(oldBalance), 'MOCA');
  console.log('🏦 New Treasury:', ethers.formatEther(newBalance), 'MOCA');

  console.log('\n🎉 Transfer completed successfully!');
  console.log('\n🔧 Next steps:');
  console.log('1. Update .env file with new treasury credentials');
  console.log('2. Deploy contract using new treasury');
  
  return {
    txHash: txResponse.hash,
    oldBalance: ethers.formatEther(oldBalance),
    newBalance: ethers.formatEther(newBalance)
  };
}

// Execute transfer
main()
  .then((result) => {
    console.log('\n✅ Transfer script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Transfer failed:', error);
    process.exit(1);
  });