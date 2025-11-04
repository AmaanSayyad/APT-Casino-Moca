const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying MocaGameLogger to Moca Chain Testnet...");

  // Get the treasury address from environment
  const treasuryAddress = process.env.MOCA_TREASURY_ADDRESS || process.env.TREASURY_ADDRESS;
  
  if (!treasuryAddress) {
    throw new Error("Treasury address not found in environment variables");
  }

  console.log("📍 Treasury address:", treasuryAddress);

  // Get the contract factory
  const MocaGameLogger = await ethers.getContractFactory("MocaGameLogger");

  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const mocaGameLogger = await MocaGameLogger.deploy(treasuryAddress);

  // Wait for deployment
  await mocaGameLogger.waitForDeployment();
  const contractAddress = await mocaGameLogger.getAddress();

  console.log("✅ MocaGameLogger deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🏦 Treasury address:", treasuryAddress);

  // Get deployment transaction
  const deploymentTx = mocaGameLogger.deploymentTransaction();
  console.log("🔗 Deployment transaction:", deploymentTx.hash);

  // Verify contract info
  const contractInfo = await mocaGameLogger.getContractInfo();
  console.log("📋 Contract verification:");
  console.log("- Contract address:", contractInfo.contractAddress);
  console.log("- Treasury address:", contractInfo.treasuryAddress);
  console.log("- Total games:", contractInfo.totalGamesCount.toString());

  // Save deployment info
  const deploymentInfo = {
    network: "moca-testnet",
    chainId: "222888",
    contractName: "MocaGameLogger",
    contractAddress: contractAddress,
    treasuryAddress: treasuryAddress,
    deployer: treasuryAddress,
    deploymentTime: new Date().toISOString(),
    transactionHash: deploymentTx.hash,
    blockNumber: deploymentTx.blockNumber?.toString() || "pending"
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const filename = `moca-game-logger-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  console.log("💾 Deployment info saved to:", filename);
  console.log("\n🎯 Next steps:");
  console.log("1. Update .env file with the contract address:");
  console.log(`   NEXT_PUBLIC_MOCA_GAME_LOGGER_CONTRACT=${contractAddress}`);
  console.log("2. Verify the contract on Moca Chain explorer");
  console.log("3. Test game logging functionality");
  
  console.log("\n🔗 Moca Chain Testnet Explorer:");
  console.log(`https://testnet-scan.mocachain.org/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });