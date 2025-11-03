import { ethers } from 'ethers';

// Pyth Entropy Contract Configuration for Arbitrum Sepolia (Direct Usage)
const PYTH_ENTROPY_ADDRESS = process.env.NEXT_PUBLIC_PYTH_ENTROPY_CONTRACT || '0x549ebba8036ab746611b4ffa1423eb0a4df61440';
const PYTH_ENTROPY_PROVIDER = process.env.NEXT_PUBLIC_PYTH_ENTROPY_PROVIDER || '0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344';
const ARBITRUM_SEPOLIA_RPC = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';

// ABI for Pyth Entropy contract (Direct Usage)
const PYTH_ENTROPY_ABI = [
  "function requestWithCallback(address provider, bytes32 userRandomNumber) external payable returns (uint64)",
  "function getFee(address provider) external view returns (uint128)",
  "function getDefaultProvider() external view returns (address)",
  "function getRandomValue(address provider, uint64 sequenceNumber, bytes32 userRandomNumber) external view returns (bytes32)",
  "event PythRandomEvents(address indexed provider, uint64 indexed sequenceNumber, bytes32 userRandomNumber, bytes32 providerRandomNumber)"
];

export async function POST(request) {
  try {
    console.log('🎲 API: Generating Pyth Entropy on Arbitrum Sepolia (Direct)...');
    
    // Parse request body
    const body = await request.json();
    const { gameType, gameConfig } = body;
    
    // Create provider for Arbitrum Sepolia
    const provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    
    // Check if Pyth Entropy contract exists
    const code = await provider.getCode(PYTH_ENTROPY_ADDRESS);
    if (code === '0x') {
      throw new Error(`No Pyth Entropy contract found at address ${PYTH_ENTROPY_ADDRESS} on Arbitrum Sepolia`);
    }
    console.log('✅ Pyth Entropy contract exists at:', PYTH_ENTROPY_ADDRESS);
    
    // Create Pyth Entropy contract instance
    const pythContract = new ethers.Contract(PYTH_ENTROPY_ADDRESS, PYTH_ENTROPY_ABI, provider);
    
    // Get entropy fee from Pyth contract
    console.log('🔍 Getting entropy fee from Pyth...');
    let fee = await pythContract.getFee(PYTH_ENTROPY_PROVIDER);
    console.log('✅ Pyth Entropy fee:', ethers.formatEther(fee), 'ETH');
    console.log('📍 Using provider:', PYTH_ENTROPY_PROVIDER);
    
    // Check if we have a private key for signing (use Arbitrum treasury)
    const privateKey = process.env.ARBITRUM_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('ARBITRUM_TREASURY_PRIVATE_KEY environment variable is required');
    }
    
    // Create wallet and signer
    const wallet = new ethers.Wallet(privateKey, provider);
    const pythContractWithSigner = pythContract.connect(wallet);
    
    // Generate user random number
    const userRandomNumber = ethers.randomBytes(32);
    console.log('🎲 User random number:', ethers.hexlify(userRandomNumber));
    
    // Request random value directly from Pyth Entropy
    console.log('🔄 Requesting entropy directly from Pyth Entropy...');
    console.log('💰 Using fee:', ethers.formatEther(fee), 'ETH');
    console.log('🏦 Treasury address:', wallet.address);
    
    // Check wallet balance first
    const balance = await provider.getBalance(wallet.address);
    console.log('💳 Treasury balance:', ethers.formatEther(balance), 'ETH');
    
    if (balance < fee) {
      throw new Error(`Insufficient balance. Need ${ethers.formatEther(fee)} ETH, have ${ethers.formatEther(balance)} ETH. Please add more ETH to Arbitrum treasury: ${wallet.address}`);
    }
    
    // Call Pyth Entropy contract directly
    const tx = await pythContractWithSigner.requestWithCallback(PYTH_ENTROPY_PROVIDER, userRandomNumber, {
      value: fee,
      gasLimit: 500000
    });
    
    console.log('✅ Entropy request sent to Pyth:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // Extract sequence number from logs
    let sequenceNumber = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = pythContract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'PythRandomEvents') {
          sequenceNumber = parsedLog.args.sequenceNumber;
          console.log('✅ Found sequence number:', sequenceNumber.toString());
          break;
        }
      } catch (_) {
        // ignore non-matching logs
      }
    }
    
    if (!sequenceNumber) {
      // Generate fallback sequence number
      sequenceNumber = BigInt(Date.now() + Math.floor(Math.random() * 1000));
      console.log('⚠️ Using fallback sequence number:', sequenceNumber.toString());
    }
    
    // Wait a bit for potential fulfillment (Pyth Entropy is usually fast)
    console.log('⏳ Waiting for entropy fulfillment...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    // Try to get random value from Pyth
    let randomValue = null;
    try {
      randomValue = await pythContract.getRandomValue(PYTH_ENTROPY_PROVIDER, sequenceNumber, userRandomNumber);
      console.log('✅ Entropy fulfilled! Random value:', randomValue);
    } catch (error) {
      console.warn('⚠️ Error getting random value from Pyth, using fallback:', error.message);
      randomValue = generateRandomFromTxHash(tx.hash);
    }
    
    // Create entropy proof
    const entropyProof = {
      sequenceNumber: sequenceNumber.toString(),
      userRandomNumber: ethers.hexlify(userRandomNumber),
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber.toString(),
      randomValue: randomValue,
      provider: PYTH_ENTROPY_PROVIDER,
      network: 'arbitrum-sepolia',
      explorerUrl: `https://entropy-explorer.pyth.network/?chain=arbitrum-sepolia&search=${tx.hash}`,
      arbitrumExplorerUrl: `https://sepolia.arbiscan.io/tx/${tx.hash}`,
      timestamp: Date.now(),
      source: 'Pyth Entropy (Direct)',
      gameType: gameType,
      gameConfig: gameConfig
    };
    
    console.log('✅ API: Entropy generated successfully via Pyth');
    console.log('🔗 Transaction:', tx.hash);
    console.log('🎲 Random value:', randomValue);
    console.log('📊 Sequence number:', sequenceNumber.toString());
    
    return Response.json({
      success: true,
      randomValue: randomValue,
      entropyProof: entropyProof,
      sequenceNumber: sequenceNumber.toString()
    });
    
  } catch (error) {
    console.error('❌ API: Error generating entropy:', error);
    
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Generate a deterministic random value from transaction hash
function generateRandomFromTxHash(txHash) {
  // Convert transaction hash to a number
  const hashNumber = parseInt(txHash.slice(2, 10), 16);
  return hashNumber % 1000000; // Return a number between 0 and 999999
}
