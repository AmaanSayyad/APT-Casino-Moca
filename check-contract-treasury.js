const { ethers } = require('ethers');

async function checkContractTreasury() {
  try {
    // Connect to Arbitrum Sepolia
    const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    
    // Our casino entropy consumer contract
    const contractAddress = '0x3670108F005C480500d424424ecB09A2896b64e9';
    const contractABI = [
      "function treasury() external view returns (address)",
      "function entropyFee() external view returns (uint256)",
      "function owner() external view returns (address)"
    ];
    
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    console.log('Contract address:', contractAddress);
    
    try {
      const treasuryAddress = await contract.treasury();
      console.log('Contract treasury address:', treasuryAddress);
      
      const entropyFee = await contract.entropyFee();
      console.log('Contract entropy fee:', ethers.formatEther(entropyFee), 'ETH');
      
      const owner = await contract.owner();
      console.log('Contract owner:', owner);
      
      // Check the treasury private key address
      const treasuryPrivateKey = '0x080c0b0dc7aa27545fab73d29b06f33e686d1491aef785bf5ced325a32c14506';
      const wallet = new ethers.Wallet(treasuryPrivateKey);
      console.log('Treasury private key address:', wallet.address);
      
      console.log('Treasury addresses match:', treasuryAddress.toLowerCase() === wallet.address.toLowerCase());
      
    } catch (error) {
      console.error('Error calling contract:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkContractTreasury();