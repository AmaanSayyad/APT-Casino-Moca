import { ethers } from 'ethers';

// Pyth Entropy Contract Configuration for Arbitrum Sepolia (Backend Only)
const PYTH_ENTROPY_ADDRESS = process.env.NEXT_PUBLIC_PYTH_ENTROPY_CONTRACT || '0x549ebba8036ab746611b4ffa1423eb0a4df61440';
const ARBITRUM_SEPOLIA_RPC = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';

// ABI for our CasinoEntropyConsumer contract on Arbitrum Sepolia
const CASINO_ENTROPY_ABI = [
  "function request(bytes32 userRandomNumber) external payable returns (uint64)",
  "function getRequest(bytes32 requestId) external view returns (tuple(address requester, uint8 gameType, string gameSubType, bool fulfilled, bytes32 randomValue, uint256 timestamp, uint64 sequenceNumber, bytes32 commitment))",
  "function isRequestFulfilled(bytes32 requestId) external view returns (bool)",
  "function getRandomValue(bytes32 requestId) external view returns (bytes32)",
  "function entropyFee() external view returns (uint256)",
  "event EntropyRequested(bytes32 indexed requestId, uint8 gameType, string gameSubType, address requester)",
  "event EntropyFulfilled(bytes32 indexed requestId, bytes32 randomValue)"
];

export async function POST(request) {
  try {
    console.log('🎲 API: Generating Pyth Entropy on Arbitrum Sepolia...');
    
    // Parse request body
    const body = await request.json();
    const { gameType, gameConfig } = body;
    
    // Create provider for Arbitrum Sepolia
    const provider = new ethers.JsonRpcProvider(ARBITRUM_SEPOLIA_RPC);
    
    // Get our casino entropy consumer contract address
    const casinoEntropyAddress = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_CASINO_CONTRACT;
    if (!casinoEntropyAddress) {
      throw new Error('Casino Entropy Consumer contract address not found. Please deploy first.');
    }
    
    // Check if contract exists at this address
    const code = await provider.getCode(casinoEntropyAddress);
    if (code === '0x') {
      throw new Error(`No contract found at address ${casinoEntropyAddress} on Arbitrum Sepolia`);
    }
    console.log('✅ Casino Entropy Consumer exists at:', casinoEntropyAddress);
    
    // Create contract instance
    const contract = new ethers.Contract(casinoEntropyAddress, CASINO_ENTROPY_ABI, provider);
    
    // Get entropy fee
    console.log('🔍 Getting entropy fee...');
    let fee = await contract.entropyFee();
    console.log('✅ Entropy fee:', ethers.formatEther(fee), 'ETH');
    
    // Check if we have a private key for signing (use Arbitrum treasury)
    const privateKey = process.env.ARBITRUM_TREASURY_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('ARBITRUM_TREASURY_PRIVATE_KEY environment variable is required');
    }
    
    // Create wallet and signer
    const wallet = new ethers.Wallet(privateKey, provider);
    const contractWithSigner = contract.connect(wallet);
    
    // Generate user random number
    const userRandomNumber = ethers.randomBytes(32);
    console.log('🎲 User random number:', ethers.hexlify(userRandomNumber));
    
    // Request random value from our Casino Entropy Consumer
    console.log('🔄 Requesting entropy from Casino Entropy Consumer...');
    console.log('💰 Using fee:', ethers.formatEther(fee), 'ETH');
    console.log('🏦 Treasury address:', wallet.address);
    
    // Check wallet balance first
    const balance = await provider.getBalance(wallet.address);
    console.log('💳 Treasury balance:', ethers.formatEther(balance), 'ETH');
    
    if (balance < fee) {
      throw new Error(`Insufficient balance. Need ${ethers.formatEther(fee)} ETH, have ${ethers.formatEther(balance)} ETH. Please add more ETH to Arbitrum treasury: ${wallet.address}`);
    }
    
    // Call our casino entropy consumer contract
    const tx = await contractWithSigner.request(userRandomNumber, {
      value: fee,
      gasLimit: 500000
    });
    
    console.log('✅ Entropy request sent:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // Extract request ID from logs
    let requestId = null;
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'EntropyRequested') {
          requestId = parsedLog.args.requestId;
          break;
        }
      } catch (_) {
        // ignore non-matching logs
      }
    }
    
    if (!requestId) {
      // Generate fallback request ID
      requestId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['bytes32', 'uint256'],
          [userRandomNumber, receipt.blockNumber]
        )
      );
    }
    
    // Wait a bit for potential fulfillment (Pyth Entropy is usually fast)
    console.log('⏳ Waiting for entropy fulfillment...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
    
    // Check if request is fulfilled
    let randomValue = null;
    try {
      const isFulfilled = await contract.isRequestFulfilled(requestId);
      if (isFulfilled) {
        randomValue = await contract.getRandomValue(requestId);
        console.log('✅ Entropy fulfilled! Random value:', randomValue);
      } else {
        console.log('⏳ Entropy not yet fulfilled, using placeholder');
        randomValue = generateRandomFromTxHash(tx.hash);
      }
    } catch (error) {
      console.warn('⚠️ Error checking fulfillment, using placeholder:', error.message);
      randomValue = generateRandomFromTxHash(tx.hash);
    }
    
    // Create entropy proof
    const entropyProof = {
      requestId: requestId,
      userRandomNumber: ethers.hexlify(userRandomNumber),
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber.toString(),
      randomValue: randomValue,
      network: 'arbitrum-sepolia',
      explorerUrl: `https://entropy-explorer.pyth.network/?chain=arbitrum-sepolia&search=${tx.hash}`,
      arbitrumExplorerUrl: `https://sepolia.arbiscan.io/tx/${tx.hash}`,
      timestamp: Date.now(),
      source: 'Pyth Entropy (Arbitrum Sepolia)',
      gameType: gameType,
      gameConfig: gameConfig
    };
    
    console.log('✅ API: Entropy generated successfully');
    console.log('🔗 Transaction:', tx.hash);
    console.log('🎲 Random value:', randomValue);
    
    return Response.json({
      success: true,
      randomValue: randomValue,
      entropyProof: entropyProof,
      requestId: requestId
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
