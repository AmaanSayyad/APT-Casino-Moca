import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Moca Chain Treasury private key from environment
const MOCA_TREASURY_PRIVATE_KEY = process.env.MOCA_TREASURY_PRIVATE_KEY || process.env.TREASURY_PRIVATE_KEY;

// Moca Chain Testnet RPC URL
const MOCA_TESTNET_RPC = process.env.NEXT_PUBLIC_MOCA_TESTNET_RPC || 'https://testnet-rpc.mocachain.org/';

// Create provider and wallet
let provider, treasuryWallet;

if (MOCA_TREASURY_PRIVATE_KEY) {
  provider = new ethers.JsonRpcProvider(MOCA_TESTNET_RPC);
  treasuryWallet = new ethers.Wallet(MOCA_TREASURY_PRIVATE_KEY, provider);
}

export async function POST(request) {
  try {
    const { userAddress, amount } = await request.json();

    console.log('📥 Received withdrawal request:', { userAddress, amount, type: typeof userAddress });

    // Validate input
    if (!userAddress || !amount || amount <= 0) {
      return new Response(JSON.stringify({
        error: 'Invalid parameters'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (!MOCA_TREASURY_PRIVATE_KEY || !treasuryWallet) {
      return NextResponse.json(
        { error: 'Moca Chain treasury not configured' },
        { status: 500 }
      );
    }

    console.log(`🏦 Processing withdrawal: ${amount} MOCA to ${userAddress}`);
    console.log(`📍 Moca Treasury: ${treasuryWallet.address}`);

    // Check treasury balance
    let treasuryBalance = 0;
    try {
      treasuryBalance = await provider.getBalance(treasuryWallet.address);
      console.log(`💰 Treasury balance: ${ethers.formatEther(treasuryBalance)} MOCA`);
    } catch (balanceError) {
      console.log('⚠️ Could not check treasury balance, proceeding with transfer attempt...');
      console.log('Balance error:', balanceError.message);
    }

    // Check if treasury has sufficient funds
    const amountWei = ethers.parseEther(amount.toString());
    if (treasuryBalance < amountWei) {
      return NextResponse.json(
        { error: `Insufficient treasury funds. Available: ${ethers.formatEther(treasuryBalance)} MOCA, Requested: ${amount} MOCA` },
        { status: 400 }
      );
    }

    // Format user address
    let formattedUserAddress;
    if (typeof userAddress === 'object' && userAddress.data) {
      // Convert Uint8Array-like object to hex string
      const bytes = Object.values(userAddress.data);
      formattedUserAddress = '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (typeof userAddress === 'string') {
      formattedUserAddress = userAddress.startsWith('0x') ? userAddress : `0x${userAddress}`;
    } else {
      throw new Error(`Invalid userAddress format: ${typeof userAddress}`);
    }

    console.log('🔧 Formatted user address:', formattedUserAddress);
    console.log('🔧 Treasury account:', treasuryWallet.address);
    console.log('🔧 Amount in Wei:', amountWei.toString());

    // Send MOCA transaction from treasury to user
    const tx = await treasuryWallet.sendTransaction({
      to: formattedUserAddress,
      value: amountWei,
      gasLimit: process.env.MOCA_GAS_LIMIT_WITHDRAW ? parseInt(process.env.MOCA_GAS_LIMIT_WITHDRAW) : 100000
    });

    console.log(`📤 Transaction sent: ${tx.hash}`);

    // Return transaction hash immediately without waiting for confirmation
    // User can check transaction status on Etherscan
    console.log(`✅ Withdraw MOCA to ${userAddress}, TX: ${tx.hash}`);

    return new Response(JSON.stringify({
      success: true,
      transactionHash: tx.hash,
      amount: amount,
      userAddress: userAddress,
      treasuryAddress: treasuryWallet.address,
      status: 'pending',
      message: 'Transaction sent successfully. Check Moca Chain Explorer for confirmation.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Withdraw API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Ensure error message is a string
    const errorMessage = error?.message || 'Unknown error occurred';
    const safeErrorMessage = typeof errorMessage === 'string' ? errorMessage : 'Unknown error occurred';

    return new Response(JSON.stringify({
      error: `Withdrawal failed: ${safeErrorMessage}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// GET endpoint to check Moca Chain treasury balance
export async function GET() {
  try {
    if (!MOCA_TREASURY_PRIVATE_KEY || !treasuryWallet) {
      return NextResponse.json(
        { error: 'Moca Chain treasury not configured' },
        { status: 500 }
      );
    }

    try {
      const balance = await provider.getBalance(treasuryWallet.address);

      return NextResponse.json({
        treasuryAddress: treasuryWallet.address,
        balance: ethers.formatEther(balance),
        balanceWei: balance.toString(),
        currency: 'MOCA',
        network: 'Moca Chain Testnet',
        status: 'active'
      });
    } catch (balanceError) {
      console.error('Balance check error:', balanceError);
      return NextResponse.json({
        treasuryAddress: treasuryWallet.address,
        balance: '0',
        balanceWei: '0',
        currency: 'MOCA',
        network: 'Moca Chain Testnet',
        status: 'error',
        error: balanceError.message
      });
    }

  } catch (error) {
    console.error('Treasury balance check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Moca Chain treasury balance: ' + error.message },
      { status: 500 }
    );
  }
}