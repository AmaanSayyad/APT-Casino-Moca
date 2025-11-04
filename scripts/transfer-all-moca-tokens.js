const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('💰 Transferring ALL MOCA tokens from old treasury to new treasury...\n');

  // Old treasury credentials (from user)
  const oldTreasuryAddress = process.env.MOCA_OLD_TREASURY_ADDRESS || '0x025182b20Da64b5997d09a5a62489741F68d9B96';
  const oldTreasuryPrivateKey = process.env.MOCA_OLD_TREASURY_PRIVATE_KEY || '0x73e0cfb4d786d6e542533e18eb78fb5c727ab802b89c6850962042a8f0835f0c';
  
  // New treasury address (from user)
  const newTreasuryAddress = process.env.MOCA_TREASURY_ADDRESS || '0xA4d1836D0D182634D5b0Edd927760a899124164C';
  
  console.log('🏦 Old Treasury:', oldTreasuryAddress);
  console.log('🏦 New Treasury:', newTreasuryAddress);

  // Create provider for Moca Chain
  const provider = new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || 'https://testnet-rpc.mocachain.org/'
  );

  // Create wallet instance for old treasury
  const oldTreasuryWallet = new ethers.Wallet(oldTreasuryPrivateKey, provider);
  
  // Verify wallet address matches
  if (oldTreasuryWallet.address.toLowerCase() !== oldTreasuryAddress.toLowerCase()) {
    console.error('❌ Wallet address mismatch!');
    console.error('   Expected:', oldTreasuryAddress);
    console.error('   Got:', oldTreasuryWallet.address);
    throw new Error('Private key does not match the treasury address');
  }
  
  console.log('✅ Wallet verified:', oldTreasuryWallet.address);

  // Check balance of old treasury
  console.log('\n📊 Checking balances...');
  const balance = await provider.getBalance(oldTreasuryAddress);
  const balanceInMoca = ethers.formatEther(balance);
  
  console.log('💰 Old Treasury Balance:', balanceInMoca, 'MOCA');

  if (balance === 0n) {
    console.log('⚠️ Old treasury has no MOCA to transfer');
    return;
  }

  // Get current nonce for old treasury
  // Query the network directly to get the most accurate nonce
  let nonce;
  try {
    // Try to get the account nonce from the network directly
    const accountInfo = await provider.send('eth_getTransactionCount', [
      oldTreasuryAddress,
      'pending'
    ]);
    nonce = parseInt(accountInfo, 16);
    console.log('📊 Network pending nonce:', nonce);
  } catch (error) {
    // Fallback to ethers method
    const latestNonce = await provider.getTransactionCount(oldTreasuryAddress, 'latest');
    const pendingNonce = await provider.getTransactionCount(oldTreasuryAddress, 'pending');
    console.log('📊 Latest nonce:', latestNonce);
    console.log('📊 Pending nonce:', pendingNonce);
    nonce = Math.max(latestNonce, pendingNonce);
    console.log('📊 Using calculated nonce:', nonce);
  }

  // Get gas price
  const feeData = await provider.getFeeData();
  console.log('⛽ Gas price:', ethers.formatUnits(feeData.gasPrice || 0n, 'gwei'), 'gwei');
  
  // Estimate gas limit for transfer (standard is 21000, but we'll estimate)
  const gasLimit = 21000n;
  const gasCost = gasLimit * (feeData.gasPrice || feeData.maxFeePerGas || 0n);
  
  console.log('⛽ Estimated gas cost:', ethers.formatEther(gasCost), 'MOCA');

  // Calculate amount to transfer (leave some for gas)
  // Leave a small buffer (0.001 MOCA) for safety
  const buffer = ethers.parseEther('0.001');
  const transferAmount = balance > (gasCost + buffer) ? balance - gasCost - buffer : balance - gasCost;
  
  if (transferAmount <= 0n) {
    console.log('⚠️ Not enough MOCA to cover gas costs');
    console.log('   Balance:', ethers.formatEther(balance), 'MOCA');
    console.log('   Gas cost:', ethers.formatEther(gasCost), 'MOCA');
    return;
  }

  console.log('\n📤 Transfer Details:');
  console.log('   Amount:', ethers.formatEther(transferAmount), 'MOCA');
  console.log('   Gas limit:', gasLimit.toString());
  console.log('   Nonce:', nonce.toString());

  // Create transfer transaction
  const tx = {
    to: newTreasuryAddress,
    value: transferAmount,
    gasLimit: gasLimit,
    gasPrice: feeData.gasPrice || feeData.maxFeePerGas,
    nonce: nonce
  };

  console.log('\n📝 Sending transfer transaction...');
  
  try {
    // Send transaction - let ethers handle nonce automatically first
    // If that fails with nonce error, we'll retry with the correct nonce
    let txResponse;
    try {
      // First attempt - use explicit nonce
      txResponse = await oldTreasuryWallet.sendTransaction(tx);
    } catch (nonceError) {
      // If nonce error, extract expected nonce and retry
      const errorMessage = nonceError.message || nonceError.error?.message || '';
      const nonceMatch = errorMessage.match(/expected (\d+)/);
      
      if (nonceMatch) {
        const expectedNonce = parseInt(nonceMatch[1]);
        console.log(`⚠️ Nonce mismatch detected. Retrying with expected nonce: ${expectedNonce}`);
        
        // Update transaction with correct nonce
        tx.nonce = expectedNonce;
        txResponse = await oldTreasuryWallet.sendTransaction(tx);
      } else {
        // If we can't extract nonce, try without specifying it (let ethers handle it)
        console.log('⚠️ Retrying without explicit nonce (letting ethers handle it)...');
        delete tx.nonce;
        txResponse = await oldTreasuryWallet.sendTransaction(tx);
      }
    }
    
    console.log('✅ Transaction sent:', txResponse.hash);
    console.log('🔗 Explorer:', `https://testnet-scan.mocachain.org/tx/${txResponse.hash}`);

    // Wait for confirmation
    console.log('\n⏳ Waiting for confirmation...');
    const receipt = await txResponse.wait();
    
    console.log('\n✅ Transfer completed!');
    console.log('📦 Block:', receipt.blockNumber);
    console.log('⛽ Gas used:', receipt.gasUsed.toString());

    // Check new balances
    console.log('\n📊 Checking final balances...');
    const oldBalance = await provider.getBalance(oldTreasuryAddress);
    const newBalance = await provider.getBalance(newTreasuryAddress);
    
    console.log('\n💰 Final Balances:');
    console.log('🏦 Old Treasury:', ethers.formatEther(oldBalance), 'MOCA');
    console.log('🏦 New Treasury:', ethers.formatEther(newBalance), 'MOCA');

    console.log('\n🎉 Transfer completed successfully!');
    console.log('\n🔧 Next steps:');
    console.log('1. Update .env file with new treasury credentials');
    console.log('2. Verify the new treasury has received all MOCA tokens');
    
    return {
      txHash: txResponse.hash,
      oldBalance: ethers.formatEther(oldBalance),
      newBalance: ethers.formatEther(newBalance),
      transferredAmount: ethers.formatEther(transferAmount)
    };
  } catch (error) {
    console.error('\n❌ Transfer failed:', error.message);
    if (error.transaction) {
      console.error('   Transaction:', error.transaction);
    }
    if (error.receipt) {
      console.error('   Receipt:', error.receipt);
    }
    throw error;
  }
}

// Execute transfer
main()
  .then((result) => {
    if (result) {
      console.log('\n✅ Transfer script completed successfully');
      console.log('   Transferred:', result.transferredAmount, 'MOCA');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Transfer failed:', error);
    process.exit(1);
  });

