const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
  console.log('🔍 Checking nonce status...');

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log('📍 Signer address:', signer.address);

  // Get provider
  const provider = signer.provider;
  
  // Get different nonce values
  const latestNonce = await provider.getTransactionCount(signer.address, 'latest');
  const pendingNonce = await provider.getTransactionCount(signer.address, 'pending');
  
  console.log('📊 Latest nonce:', latestNonce);
  console.log('📊 Pending nonce:', pendingNonce);
  
  // Check if there are pending transactions
  if (pendingNonce > latestNonce) {
    console.log('⚠️ There are pending transactions. Waiting for them to complete...');
  } else {
    console.log('✅ No pending transactions. Ready to deploy.');
  }
  
  return { latestNonce, pendingNonce };
}

main()
  .then((result) => {
    console.log('\n✅ Nonce check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Nonce check failed:', error);
    process.exit(1);
  });