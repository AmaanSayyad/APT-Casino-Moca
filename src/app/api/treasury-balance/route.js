import { NextResponse } from 'next/server';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { TREASURY_CONFIG } from '@/config/treasury.js';

export async function GET() {
  try {
    // Get Moca Chain treasury info
    const mocaTreasuryAddress = TREASURY_CONFIG.MOCA.ADDRESS;
    const mocaTreasuryKey = TREASURY_CONFIG.MOCA.PRIVATE_KEY;
    
    if (!mocaTreasuryAddress || !mocaTreasuryKey) {
      return NextResponse.json(
        { error: 'Moca Chain treasury not configured' },
        { status: 500 }
      );
    }

    // Create Moca Chain provider
    const mocaProvider = new JsonRpcProvider(TREASURY_CONFIG.MOCA.NETWORK.RPC_URL);
    const mocaTreasuryWallet = new Wallet(mocaTreasuryKey, mocaProvider);
    
    // Get Moca treasury balance
    const mocaBalance = await mocaProvider.getBalance(mocaTreasuryWallet.address);
    const balanceInMoca = ethers.formatEther(mocaBalance);
    
    // Get Arbitrum treasury info for entropy operations
    const arbitrumTreasuryAddress = TREASURY_CONFIG.ARBITRUM.ADDRESS;
    const arbitrumTreasuryKey = TREASURY_CONFIG.ARBITRUM.PRIVATE_KEY;
    
    let arbitrumBalance = '0';
    let arbitrumBalanceWei = '0';
    
    if (arbitrumTreasuryAddress && arbitrumTreasuryKey) {
      try {
        const arbitrumProvider = new JsonRpcProvider(TREASURY_CONFIG.ARBITRUM.NETWORK.RPC_URL);
        const arbitrumTreasuryWallet = new Wallet(arbitrumTreasuryKey, arbitrumProvider);
        const arbBalance = await arbitrumProvider.getBalance(arbitrumTreasuryWallet.address);
        arbitrumBalance = ethers.formatEther(arbBalance);
        arbitrumBalanceWei = arbBalance.toString();
      } catch (arbError) {
        console.warn('⚠️ Could not fetch Arbitrum treasury balance:', arbError.message);
      }
    }
    
    return NextResponse.json({
      success: true,
      moca: {
        treasury: {
          address: mocaTreasuryWallet.address,
          balance: balanceInMoca,
          balanceWei: mocaBalance.toString(),
          currency: 'MOCA'
        },
        network: {
          name: 'Moca Chain Testnet',
          chainId: 222888,
          rpcUrl: TREASURY_CONFIG.MOCA.NETWORK.RPC_URL
        }
      },
      arbitrum: {
        treasury: {
          address: arbitrumTreasuryAddress,
          balance: arbitrumBalance,
          balanceWei: arbitrumBalanceWei,
          currency: 'ETH'
        },
        network: {
          name: 'Arbitrum Sepolia',
          chainId: 421614,
          rpcUrl: TREASURY_CONFIG.ARBITRUM.NETWORK.RPC_URL
        }
      },
      entropy: {
        network: 'Arbitrum Sepolia',
        contractAddress: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_CASINO_CONTRACT,
        requiredFee: "0.001" // ETH for entropy requests
      }
    });
    
  } catch (error) {
    console.error('❌ Treasury balance check failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check treasury balances',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
