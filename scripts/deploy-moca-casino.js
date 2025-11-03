const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

async function main() {
  console.log("🚀 Deploying Moca Casino Contract to Moca Chain Testnet...");

  // Get the treasury address from environment
  const treasuryAddress = process.env.MOCA_TREASURY_ADDRESS || process.env.TREASURY_ADDRESS;
  
  console.log("🔍 Environment check:");
  console.log("- MOCA_TREASURY_ADDRESS:", process.env.MOCA_TREASURY_ADDRESS ? "✅ Set" : "❌ Not set");
  console.log("- TREASURY_ADDRESS:", process.env.TREASURY_ADDRESS ? "✅ Set" : "❌ Not set");
  console.log("- Final treasury address:", treasuryAddress);
  
  if (!treasuryAddress) {
    throw new Error("Treasury address not found in environment variables. Please set MOCA_TREASURY_ADDRESS or TREASURY_ADDRESS in .env file");
  }

  console.log("📋 Deployment Configuration:");
  console.log("- Network: Moca Chain Testnet");
  console.log("- Treasury Address:", treasuryAddress);

  // Get the signers
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MOCA");

  // Get the contract factory
  const MocaCasinoContract = await ethers.getContractFactory("MocaCasinoContract");

  // Deploy the contract
  console.log("\n📦 Deploying MocaCasinoContract...");
  const mocaCasino = await MocaCasinoContract.deploy(treasuryAddress);
  
  // Wait for deployment
  await mocaCasino.waitForDeployment();
  const contractAddress = await mocaCasino.getAddress();

  console.log("✅ MocaCasinoContract deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 Treasury Address:", treasuryAddress);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const deployedTreasury = await mocaCasino.treasury();
  const contractBalance = await mocaCasino.getContractBalance();
  
  console.log("- Deployed Treasury:", deployedTreasury);
  console.log("- Contract Balance:", ethers.formatEther(contractBalance), "MOCA");
  console.log("- Treasury Match:", deployedTreasury.toLowerCase() === treasuryAddress.toLowerCase() ? "✅" : "❌");

  // Save deployment info
  const deploymentInfo = {
    network: "moca-testnet",
    chainId: 222888,
    contractName: "MocaCasinoContract",
    contractAddress: contractAddress,
    treasuryAddress: treasuryAddress,
    deploymentTime: new Date().toISOString(),
    deployer: (await ethers.getSigners())[0].address,
    transactionHash: mocaCasino.deploymentTransaction()?.hash,
    blockNumber: mocaCasino.deploymentTransaction()?.blockNumber
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const timestamp = Date.now();
  const deploymentFile = path.join(deploymentsDir, `moca-casino-${timestamp}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n💾 Deployment info saved to:", deploymentFile);

  // Update .env file with new contract address
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add the contract address
  const contractAddressLine = `NEXT_PUBLIC_MOCA_CASINO_CONTRACT=${contractAddress}`;
  
  if (envContent.includes('NEXT_PUBLIC_MOCA_CASINO_CONTRACT=')) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_MOCA_CASINO_CONTRACT=.*/,
      contractAddressLine
    );
  } else {
    envContent += `\n${contractAddressLine}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log("📝 Updated .env file with contract address");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Next Steps:");
  console.log("1. Update frontend configuration with new contract address");
  console.log("2. Fund the treasury wallet with MOCA tokens");
  console.log("3. Test deposit/withdrawal functionality");
  console.log("4. Deploy entropy consumer contract on Arbitrum Sepolia");

  return {
    contractAddress,
    treasuryAddress,
    deploymentInfo
  };
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;