const { ethers } = require('ethers');

async function checkEntropyContract() {
  try {
    // Connect to Arbitrum Sepolia
    const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    
    // Pyth Entropy contract address
    const entropyAddress = '0x549ebba8036ab746611b4ffa1423eb0a4df61440';
    
    // Get the contract code to see if it exists
    const code = await provider.getCode(entropyAddress);
    console.log('Pyth Entropy contract exists:', code !== '0x');
    
    // Try to get the fee from Pyth Entropy contract
    const entropyABI = [
      "function getFee(address provider) external view returns (uint128)",
      "function getDefaultProvider() external view returns (address)",
      "function requestWithCallback(address provider, bytes32 userRandomNumber) external payable returns (uint64)"
    ];
    
    const entropyContract = new ethers.Contract(entropyAddress, entropyABI, provider);
    
    // Check the provider
    const provider_address = '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344';
    console.log('Using provider:', provider_address);
    
    try {
      const fee = await entropyContract.getFee(provider_address);
      console.log('Pyth Entropy fee for provider:', ethers.formatEther(fee), 'ETH');
    } catch (error) {
      console.log('Error getting fee:', error.message);
    }
    
    try {
      const defaultProvider = await entropyContract.getDefaultProvider();
      console.log('Default provider:', defaultProvider);
    } catch (error) {
      console.log('Error getting default provider:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkEntropyContract();