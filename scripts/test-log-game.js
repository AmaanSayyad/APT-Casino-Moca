const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x51a9856C3b33EeFf291eb063316fc476C32C3a27";
  const contract = await ethers.getContractAt("MocaGameLogger", contractAddress);
  
  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);
  
  // Check treasury
  const treasury = await contract.treasury();
  console.log("Contract Treasury:", treasury);
  console.log("Signer matches treasury:", signer.address.toLowerCase() === treasury.toLowerCase());
  
  // Test game ID
  const testGameId = `test_${Date.now()}`;
  console.log("Test Game ID:", testGameId);
  
  // Check if game exists
  try {
    const exists = await contract.gameExists(testGameId);
    console.log("Game exists:", exists);
  } catch (error) {
    console.log("Error checking gameExists:", error.message);
  }
  
  // Try to call logGame with minimal data
  try {
    const tx = await contract.logGame(
      testGameId,
      "ROULETTE",
      "0xcc78505FE8707a1D85229BA0E7177aE26cE0f17D",
      ethers.parseEther("0.003"),
      ethers.parseEther("0.003"),
      true,
      JSON.stringify({ test: "config" }),
      JSON.stringify({ test: "result" }),
      JSON.stringify({ test: "proof" }),
      {
        gasLimit: 5000000
      }
    );
    
    console.log("✅ Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed:", receipt.blockNumber);
  } catch (error) {
    console.error("❌ Transaction failed:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

