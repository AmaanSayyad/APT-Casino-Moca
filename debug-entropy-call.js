const { ethers } = require('ethers');

async function debugEntropyCall() {
  try {
    // Connect to Arbitrum Sepolia
    const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    
    // Contract details
    const contractAddress = '0x3670108F005C480500d424424ecB09A2896b64e9';
    const treasuryPrivateKey = '0x080c0b0dc7aa27545fab73d29b06f33e686d1491aef785bf5ced325a32c14506';
    
    const contractABI = [
      "function request(bytes32 userRandomNumber) external payable returns (uint64)",
      "function entropyFee() external view returns (uint256)",
      "function treasury() external view returns (address)",
      "function entropy() external view returns (address)",
      "function provider() external view returns (address)"
    ];
    
    // Create wallet and contract instance
    const wallet = new ethers.Wallet(treasuryPrivateKey, provider);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const contractWithSigner = contract.connect(wallet);
    
    console.log('=== Contract Information ===');
    console.log('Contract address:', contractAddress);
    console.log('Wallet address:', wallet.address);
    
    // Get contract state
    const treasury = await contract.treasury();
    const entropyFee = await contract.entropyFee();
    const entropyContract = await contract.entropy();
    const providerAddress = await contract.provider();
    
    console.log('Contract treasury:', treasury);
    console.log('Contract entropy fee:', ethers.formatEther(entropyFee), 'ETH');
    console.log('Entropy contract:', entropyContract);
    console.log('Provider address:', providerAddress);
    
    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log('Wallet balance:', ethers.formatEther(balance), 'ETH');
    
    console.log('\n=== Pyth Entropy Contract Check ===');
    
    // Check Pyth Entropy contract
    const pythEntropyABI = [
      "function getFee(address provider) external view returns (uint128)",
      "function getDefaultProvider() external view returns (address)"
    ];
    
    const pythContract = new ethers.Contract(entropyContract, pythEntropyABI, provider);
    
    try {
      const pythFee = await pythContract.getFee(providerAddress);
      console.log('Pyth entropy fee for our provider:', ethers.formatEther(pythFee), 'ETH');
      
      const defaultProvider = await pythContract.getDefaultProvider();
      console.log('Pyth default provider:', defaultProvider);
      console.log('Our provider matches default:', providerAddress.toLowerCase() === defaultProvider.toLowerCase());
    } catch (error) {
      console.log('Error checking Pyth contract:', error.message);
    }
    
    console.log('\n=== Testing Transaction ===');
    
    // Generate user random number
    const userRandomNumber = ethers.randomBytes(32);
    console.log('User random number:', ethers.hexlify(userRandomNumber));
    
    // Try to estimate gas first
    try {
      console.log('Estimating gas...');
      const gasEstimate = await contractWithSigner.request.estimateGas(userRandomNumber, {
        value: entropyFee
      });
      console.log('Gas estimate:', gasEstimate.toString());
    } catch (error) {
      console.log('Gas estimation failed:', error);
      
      // Try to decode the error
      if (error.data) {
        console.log('Error data:', error.data);
        
        // Try to decode common errors
        const errorSignatures = {
          '0x025dbdd4': 'InsufficientFee()',
          '0x7626db82': 'InvalidProvider()',
          '0x92a7f1ec': 'InvalidRandomNumber()',
          '0x4b13b31e': 'RequestNotFound()',
          '0x533d99dd': 'RequestAlreadyFulfilled()',
          '0xcd6d7d3a': 'UnauthorizedProvider()',
          '0xdf51c431': 'Unknown custom error'
        };
        
        const errorSig = error.data.slice(0, 10);
        console.log('Error signature:', errorSig);
        console.log('Possible error:', errorSignatures[errorSig] || 'Unknown error');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugEntropyCall();