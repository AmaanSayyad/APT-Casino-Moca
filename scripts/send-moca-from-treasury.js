const { ethers } = require("ethers");
require('dotenv').config();

async function sendMoca() {
  try {
    console.log("🚀 Sending 0.1 MOCA from Treasury...");
    
    // Get treasury private key from environment
    const treasuryPrivateKey = process.env.MOCA_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY;
    
    if (!treasuryPrivateKey) {
      throw new Error("Treasury private key not found in environment variables");
    }
    
    // Get RPC URL
    const rpcUrl = process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || 'https://testnet-rpc.mocachain.org/';
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Create wallet from treasury private key
    const treasuryWallet = new ethers.Wallet(treasuryPrivateKey, provider);
    
    console.log("📋 Transaction Details:");
    console.log("- From Treasury:", treasuryWallet.address);
    console.log("- To Address: 0x71197e7a1ca5a2cb2ad82432b924f69b1e3db123");
    console.log("- Amount: 0.1 MOCA");
    console.log("- Network: Moca Chain Testnet");
    console.log("- RPC:", rpcUrl);
    
    // Check treasury balance
    const balance = await provider.getBalance(treasuryWallet.address);
    console.log("\n💰 Treasury Balance:", ethers.formatEther(balance), "MOCA");
    
    if (balance < ethers.parseEther("0.1")) {
      throw new Error(`Insufficient balance. Treasury has ${ethers.formatEther(balance)} MOCA but needs 0.1 MOCA`);
    }
    
    // Amount to send (0.1 MOCA)
    const amount = ethers.parseEther("0.1");
    
    console.log("\n📤 Sending transaction...");
    
    // Send transaction
    const tx = await treasuryWallet.sendTransaction({
      to: "0x71197e7a1ca5a2cb2ad82432b924f69b1e3db123",
      value: amount,
      gasLimit: 21000 // Standard gas limit for simple transfer
    });
    
    console.log("✅ Transaction sent!");
    console.log("📝 Transaction Hash:", tx.hash);
    console.log("🔗 Explorer:", `https://testnet-scan.mocachain.org/tx/${tx.hash}`);
    
    console.log("\n⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    
    console.log("✅ Transaction confirmed!");
    console.log("📊 Block Number:", receipt.blockNumber);
    console.log("⛽ Gas Used:", receipt.gasUsed.toString());
    
    // Verify the transfer
    const recipientBalance = await provider.getBalance("0x71197e7a1ca5a2cb2ad82432b924f69b1e3db123");
    console.log("\n💰 Recipient Balance:", ethers.formatEther(recipientBalance), "MOCA");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.transaction) {
      console.error("Transaction Hash:", error.transaction.hash);
    }
    process.exit(1);
  }
}

sendMoca();

