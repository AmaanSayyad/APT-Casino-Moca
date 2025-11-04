const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x51a9856C3b33EeFf291eb063316fc476C32C3a27";
  const contract = await ethers.getContractAt("MocaGameLogger", contractAddress);
  
  const treasury = await contract.treasury();
  const owner = await contract.owner();
  
  console.log("Contract Treasury Address:", treasury);
  console.log("Contract Owner Address:", owner);
  console.log("Expected Treasury Address: 0x025182b20Da64b5997d09a5a62489741F68d9B96");
  console.log("Match:", treasury.toLowerCase() === "0x025182b20Da64b5997d09a5a62489741F68d9B96".toLowerCase());
  
  // Check if we can call the contract
  try {
    const [totalLogs] = await contract.getLoggerStats();
    console.log("✅ Contract is accessible. Total logs:", totalLogs.toString());
  } catch (error) {
    console.log("❌ Contract call failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

