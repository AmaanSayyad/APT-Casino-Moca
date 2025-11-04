const { ethers } = require('ethers');

async function main() {
  console.log('🔑 Generating new treasury wallet...');

  // Generate a new random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log('\n✅ New Treasury Generated:');
  console.log('📍 Address:', wallet.address);
  console.log('🔐 Private Key:', wallet.privateKey);
  console.log('🌱 Mnemonic:', wallet.mnemonic.phrase);
  
  console.log('\n🔧 Environment Variables to add:');
  console.log(`MOCA_NEW_TREASURY_ADDRESS=${wallet.address}`);
  console.log(`MOCA_NEW_TREASURY_PRIVATE_KEY=${wallet.privateKey}`);
  
  console.log('\n⚠️ IMPORTANT:');
  console.log('1. Save these credentials securely');
  console.log('2. Fund this address with MOCA tokens for gas fees');
  console.log('3. Update your .env file with the new treasury');
  console.log('4. This wallet will have nonce 0, so deployment should work');
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase
  };
}

main()
  .then((result) => {
    console.log('\n✅ Treasury generation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Treasury generation failed:', error);
    process.exit(1);
  });