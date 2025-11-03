const { ethers } = require("ethers");
require('dotenv').config();

async function main() {
  console.log("🧪 Testing Moca Chain Casino Integration...");

  // Get contract addresses from environment
  const mocaCasinoAddress = process.env.NEXT_PUBLIC_MOCA_CASINO_CONTRACT;
  const treasuryAddress = process.env.MOCA_TREASURY_ADDRESS || process.env.TREASURY_ADDRESS;

  if (!mocaCasinoAddress) {
    throw new Error("Moca Casino contract address not found. Please deploy first.");
  }

  console.log("📋 Test Configuration:");
  console.log("- Network: Moca Chain Testnet");
  console.log("- Casino Contract:", mocaCasinoAddress);
  console.log("- Treasury Address:", treasuryAddress);

  // Create provider for Moca Chain
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || 'https://testnet-rpc.mocachain.org/');
  
  // Create wallet from treasury private key
  const treasuryWallet = new ethers.Wallet(process.env.MOCA_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY, provider);
  
  // For testing, we'll use the treasury wallet as deployer and create test wallets
  const deployer = treasuryWallet;
  const user1 = ethers.Wallet.createRandom().connect(provider);
  const user2 = ethers.Wallet.createRandom().connect(provider);
  console.log("\n👥 Test Accounts:");
  console.log("- Deployer:", deployer.address);
  console.log("- User 1:", user1.address);
  console.log("- User 2:", user2.address);

  // Contract ABI (minimal for testing)
  const mocaCasinoABI = [
    "function getContractStats() external view returns (uint256, uint256, uint256, uint256, uint256)",
    "function deposit() external payable",
    "function withdraw(uint256 amount) external",
    "function startGameSession(uint8 gameType, uint256 betAmount) external returns (bytes32)",
    "function getUserBalance(address user) external view returns (tuple(uint256 balance, uint256 totalDeposited, uint256 totalWithdrawn, uint256 totalWon, uint256 totalLost, uint256 gamesPlayed, uint256 lastActivity))",
    "function getGameTypeStats(uint8 gameType) external view returns (uint256, uint256, uint256)"
  ];
  
  // Connect to the deployed contract
  const mocaCasino = new ethers.Contract(mocaCasinoAddress, mocaCasinoABI, provider);

  console.log("\n🔍 Contract Information:");
  const contractInfo = await mocaCasino.getContractStats();
  console.log("- Total Deposits:", ethers.formatEther(contractInfo[0]), "MOCA");
  console.log("- Total Withdrawals:", ethers.formatEther(contractInfo[1]), "MOCA");
  console.log("- Total Games Played:", contractInfo[2].toString());
  console.log("- Contract Balance:", ethers.formatEther(contractInfo[3]), "MOCA");

  // Test 1: Deposit functionality
  console.log("\n💰 Test 1: Deposit Functionality");
  const depositAmount = ethers.parseEther("1.0"); // 1 MOCA
  
  try {
    console.log("- Depositing 1 MOCA from User 1...");
    const depositTx = await mocaCasino.connect(user1).deposit({ value: depositAmount });
    await depositTx.wait();
    
    const userBalance = await mocaCasino.getUserBalance(user1.address);
    console.log("✅ Deposit successful!");
    console.log("- User Balance:", ethers.formatEther(userBalance.balance), "MOCA");
    console.log("- Total Deposited:", ethers.formatEther(userBalance.totalDeposited), "MOCA");
  } catch (error) {
    console.log("❌ Deposit failed:", error.message);
  }

  // Test 2: Game session functionality
  console.log("\n🎮 Test 2: Game Session Functionality");
  const betAmount = ethers.parseEther("0.1"); // 0.1 MOCA bet
  
  try {
    console.log("- Starting Mines game session with 0.1 MOCA bet...");
    const gameType = 0; // MINES
    const startGameTx = await mocaCasino.connect(user1).startGameSession(gameType, betAmount);
    const receipt = await startGameTx.wait();
    
    // Get session ID from events
    const gamePlayedEvent = receipt.logs.find(log => {
      try {
        const parsed = mocaCasino.interface.parseLog(log);
        return parsed.name === 'GamePlayed';
      } catch {
        return false;
      }
    });
    
    if (gamePlayedEvent) {
      console.log("✅ Game session started successfully!");
      console.log("- Game Type: Mines");
      console.log("- Bet Amount:", ethers.formatEther(betAmount), "MOCA");
      
      // Check updated user balance
      const userBalance = await mocaCasino.getUserBalance(user1.address);
      console.log("- Updated Balance:", ethers.formatEther(userBalance.balance), "MOCA");
    }
  } catch (error) {
    console.log("❌ Game session failed:", error.message);
  }

  // Test 3: Contract statistics
  console.log("\n📊 Test 3: Contract Statistics");
  try {
    const stats = await mocaCasino.getContractStats();
    console.log("- Total Deposits:", ethers.formatEther(stats[0]), "MOCA");
    console.log("- Total Withdrawals:", ethers.formatEther(stats[1]), "MOCA");
    console.log("- Total Games:", stats[2].toString());
    console.log("- Contract Balance:", ethers.formatEther(stats[3]), "MOCA");
    
    // Game type statistics
    const minesStats = await mocaCasino.getGameTypeStats(0); // MINES
    console.log("- Mines Games:", minesStats[0].toString());
    console.log("- Mines Total Bets:", ethers.formatEther(minesStats[1]), "MOCA");
    console.log("- Mines Total Wins:", ethers.formatEther(minesStats[2]), "MOCA");
  } catch (error) {
    console.log("❌ Statistics query failed:", error.message);
  }

  // Test 4: Withdrawal functionality (if user has balance)
  console.log("\n💸 Test 4: Withdrawal Functionality");
  try {
    const userBalance = await mocaCasino.getUserBalance(user1.address);
    const currentBalance = userBalance.balance;
    
    if (currentBalance > 0) {
      const withdrawAmount = currentBalance / 2n; // Withdraw half
      console.log("- Withdrawing", ethers.formatEther(withdrawAmount), "MOCA...");
      
      const withdrawTx = await mocaCasino.connect(user1).withdraw(withdrawAmount);
      await withdrawTx.wait();
      
      const newBalance = await mocaCasino.getUserBalance(user1.address);
      console.log("✅ Withdrawal successful!");
      console.log("- New Balance:", ethers.formatEther(newBalance.balance), "MOCA");
      console.log("- Total Withdrawn:", ethers.formatEther(newBalance.totalWithdrawn), "MOCA");
    } else {
      console.log("⚠️ No balance to withdraw");
    }
  } catch (error) {
    console.log("❌ Withdrawal failed:", error.message);
  }

  console.log("\n🎉 Moca Chain Integration Test Completed!");
  console.log("\n📋 Next Steps:");
  console.log("1. Deploy entropy consumer contract on Arbitrum Sepolia");
  console.log("2. Set up backend service to handle entropy requests");
  console.log("3. Test full game flow with entropy generation");
  console.log("4. Update frontend to use Moca Chain Testnet");
}

// Execute test
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Test failed:", error);
      process.exit(1);
    });
}

module.exports = main;