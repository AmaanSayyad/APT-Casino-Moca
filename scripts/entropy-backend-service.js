const { ethers } = require("hardhat");
require('dotenv').config();

/**
 * Backend Entropy Service
 * Handles entropy requests between Moca Chain Casino and Arbitrum Sepolia Entropy Consumer
 */
class EntropyBackendService {
  constructor() {
    this.mocaProvider = null;
    this.arbitrumProvider = null;
    this.mocaCasino = null;
    this.entropyConsumer = null;
    this.treasurySigner = null;
    this.isRunning = false;
    this.pendingRequests = new Map();
  }

  async initialize() {
    console.log("🚀 Initializing Entropy Backend Service...");

    // Initialize providers
    this.mocaProvider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || "https://testnet-rpc.mocachain.org/"
    );

    this.arbitrumProvider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc"
    );

    // Initialize treasury signer for Arbitrum (entropy requests)
    const arbitrumTreasuryKey = process.env.ARBITRUM_TREASURY_PRIVATE_KEY;
    if (!arbitrumTreasuryKey) {
      throw new Error("Arbitrum treasury private key not found");
    }
    this.treasurySigner = new ethers.Wallet(arbitrumTreasuryKey, this.arbitrumProvider);

    // Initialize contracts
    const mocaCasinoAddress = process.env.NEXT_PUBLIC_MOCA_CASINO_CONTRACT;
    const entropyConsumerAddress = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_CASINO_CONTRACT;

    if (!mocaCasinoAddress || !entropyConsumerAddress) {
      throw new Error("Contract addresses not found in environment");
    }

    // Load contract ABIs and connect
    const MocaCasinoContract = await ethers.getContractFactory("MocaCasinoContract");
    const CasinoEntropyConsumer = await ethers.getContractFactory("CasinoEntropyConsumerV2");

    this.mocaCasino = MocaCasinoContract.attach(mocaCasinoAddress).connect(this.mocaProvider);
    this.entropyConsumer = CasinoEntropyConsumer.attach(entropyConsumerAddress).connect(this.treasurySigner);

    console.log("✅ Service initialized successfully!");
    console.log("- Moca Casino:", mocaCasinoAddress);
    console.log("- Entropy Consumer:", entropyConsumerAddress);
    console.log("- Treasury:", this.treasurySigner.address);
  }

  async startListening() {
    if (this.isRunning) {
      console.log("⚠️ Service is already running");
      return;
    }

    console.log("👂 Starting to listen for game events...");
    this.isRunning = true;

    // Listen for GamePlayed events on Moca Chain
    this.mocaCasino.on("GamePlayed", async (user, gameType, betAmount, timestamp, event) => {
      try {
        console.log(`\n🎮 New game detected:`);
        console.log(`- User: ${user}`);
        console.log(`- Game Type: ${gameType}`);
        console.log(`- Bet Amount: ${ethers.formatEther(betAmount)} MOCA`);
        console.log(`- Timestamp: ${new Date(Number(timestamp) * 1000).toISOString()}`);

        await this.handleGameRequest(event.log.transactionHash, user, gameType, betAmount);
      } catch (error) {
        console.error("❌ Error handling game event:", error);
      }
    });

    // Listen for EntropyFulfilled events on Arbitrum Sepolia
    this.entropyConsumer.on("EntropyFulfilled", async (requestId, randomValue, event) => {
      try {
        console.log(`\n🎲 Entropy fulfilled:`);
        console.log(`- Request ID: ${requestId}`);
        console.log(`- Random Value: ${randomValue}`);

        await this.handleEntropyFulfilled(requestId, randomValue);
      } catch (error) {
        console.error("❌ Error handling entropy fulfillment:", error);
      }
    });

    console.log("✅ Service is now listening for events...");
  }

  async handleGameRequest(txHash, user, gameType, betAmount) {
    try {
      // Generate user random number (in production, this should come from user)
      const userRandomNumber = ethers.randomBytes(32);
      
      console.log("🎯 Requesting entropy from Pyth...");
      
      // Request entropy from Arbitrum Sepolia
      const entropyFee = ethers.parseEther("0.001"); // 0.001 ETH
      const requestTx = await this.entropyConsumer.request(userRandomNumber, {
        value: entropyFee
      });
      
      const receipt = await requestTx.wait();
      console.log("✅ Entropy request submitted");
      console.log("- Transaction:", receipt.hash);

      // Find the EntropyRequested event to get request ID
      const entropyRequestedEvent = receipt.logs.find(log => {
        try {
          const parsed = this.entropyConsumer.interface.parseLog(log);
          return parsed.name === 'EntropyRequested';
        } catch {
          return false;
        }
      });

      if (entropyRequestedEvent) {
        const parsed = this.entropyConsumer.interface.parseLog(entropyRequestedEvent);
        const requestId = parsed.args.requestId;
        
        // Store pending request
        this.pendingRequests.set(requestId, {
          mocaTxHash: txHash,
          user,
          gameType,
          betAmount,
          timestamp: Date.now()
        });

        console.log("📝 Stored pending request:", requestId);
      }
    } catch (error) {
      console.error("❌ Error requesting entropy:", error);
    }
  }

  async handleEntropyFulfilled(requestId, randomValue) {
    try {
      const pendingRequest = this.pendingRequests.get(requestId);
      
      if (!pendingRequest) {
        console.log("⚠️ No pending request found for:", requestId);
        return;
      }

      console.log("🎲 Processing game result...");
      
      // Simple game logic (in production, implement proper game mechanics)
      const randomNum = BigInt(randomValue);
      const gameResult = this.calculateGameResult(pendingRequest.gameType, randomNum, pendingRequest.betAmount);
      
      console.log("- Game Result:", gameResult.won ? "WIN" : "LOSE");
      console.log("- Win Amount:", ethers.formatEther(gameResult.winAmount), "MOCA");

      // Get session ID from Moca Chain (would need to implement session tracking)
      // For now, we'll use a mock session ID
      const sessionId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256", "uint256"],
          [pendingRequest.user, pendingRequest.gameType, pendingRequest.timestamp]
        )
      );

      // Complete game session on Moca Chain
      const mocaTreasurySigner = new ethers.Wallet(
        process.env.MOCA_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY,
        this.mocaProvider
      );
      
      const mocaCasinoWithSigner = this.mocaCasino.connect(mocaTreasurySigner);
      
      const completeTx = await mocaCasinoWithSigner.completeGameSession(
        sessionId,
        gameResult.won,
        gameResult.winAmount,
        requestId
      );
      
      await completeTx.wait();
      console.log("✅ Game session completed on Moca Chain");
      
      // Remove from pending requests
      this.pendingRequests.delete(requestId);
      
    } catch (error) {
      console.error("❌ Error completing game session:", error);
    }
  }

  calculateGameResult(gameType, randomValue, betAmount) {
    // Simple game logic - in production, implement proper game mechanics
    const random = Number(randomValue % 100n); // 0-99
    
    let winChance = 50; // 50% win chance by default
    let multiplier = 1.8; // 1.8x multiplier
    
    switch (Number(gameType)) {
      case 0: // MINES
        winChance = 45;
        multiplier = 2.0;
        break;
      case 1: // PLINKO
        winChance = 40;
        multiplier = 2.2;
        break;
      case 2: // ROULETTE
        winChance = 48;
        multiplier = 1.9;
        break;
      case 3: // WHEEL
        winChance = 35;
        multiplier = 2.5;
        break;
    }
    
    const won = random < winChance;
    const winAmount = won ? BigInt(Math.floor(Number(betAmount) * multiplier)) : 0n;
    
    return { won, winAmount };
  }

  async stop() {
    console.log("🛑 Stopping Entropy Backend Service...");
    this.isRunning = false;
    
    if (this.mocaCasino) {
      this.mocaCasino.removeAllListeners();
    }
    
    if (this.entropyConsumer) {
      this.entropyConsumer.removeAllListeners();
    }
    
    console.log("✅ Service stopped");
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      pendingRequests: this.pendingRequests.size,
      treasuryAddress: this.treasurySigner?.address
    };
  }
}

// CLI interface
async function main() {
  const service = new EntropyBackendService();
  
  try {
    await service.initialize();
    await service.startListening();
    
    // Keep the service running
    console.log("\n🔄 Service is running. Press Ctrl+C to stop...");
    
    process.on('SIGINT', async () => {
      console.log("\n🛑 Received interrupt signal...");
      await service.stop();
      process.exit(0);
    });
    
    // Keep alive
    setInterval(() => {
      const status = service.getStatus();
      console.log(`\n💓 Service Status: Running=${status.isRunning}, Pending=${status.pendingRequests}`);
    }, 30000); // Status update every 30 seconds
    
  } catch (error) {
    console.error("❌ Service failed to start:", error);
    process.exit(1);
  }
}

// Export for use as module
module.exports = EntropyBackendService;

// Run if called directly
if (require.main === module) {
  main();
}