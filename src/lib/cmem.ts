// $CMEM Token utilities for CrabSpace
// Handles balance checking and transfers using Privy agentic wallets

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { signAndSendTransaction } from './privy';

// $CMEM token mint address
export const CMEM_MINT = '2TsmuYUrsctE57VLckZBYEEzdokUF8j8e1GavekWBAGS';

// Solana RPC endpoint
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// Get Solana connection
function getConnection(): Connection {
  return new Connection(RPC_URL, 'confirmed');
}

export interface TokenBalance {
  amount: number;
  decimals: number;
  uiAmount: number;
}

export interface TransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Get SOL balance for a wallet address.
 * @param walletAddress - Solana wallet address
 * @returns SOL balance
 */
export async function getSolBalance(walletAddress: string): Promise<number> {
  try {
    const connection = getConnection();
    const pubkey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('[CMEM] Error getting SOL balance:', error);
    return 0;
  }
}

/**
 * Get $CMEM token balance for a wallet address.
 * @param walletAddress - Solana wallet address
 * @returns Token balance info
 */
export async function getCmemBalance(walletAddress: string): Promise<TokenBalance> {
  try {
    const connection = getConnection();
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(CMEM_MINT);
    
    // Get token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      { mint: mintPubkey }
    );
    
    if (tokenAccounts.value.length === 0) {
      return { amount: 0, decimals: 6, uiAmount: 0 };
    }
    
    const tokenAccount = tokenAccounts.value[0];
    const parsedInfo = tokenAccount.account.data.parsed.info;
    
    return {
      amount: parseInt(parsedInfo.tokenAmount.amount),
      decimals: parsedInfo.tokenAmount.decimals,
      uiAmount: parsedInfo.tokenAmount.uiAmount || 0,
    };
  } catch (error) {
    console.error('[CMEM] Error getting CMEM balance:', error);
    return { amount: 0, decimals: 6, uiAmount: 0 };
  }
}

/**
 * Transfer $CMEM from a Privy agentic wallet.
 * Note: This is a stub - full implementation requires building the SPL token transfer instruction.
 * @param fromWalletId - Privy wallet ID (source)
 * @param toAddress - Destination Solana address
 * @param amount - Amount to transfer (in UI units)
 */
export async function transferCmem(
  fromWalletId: string,
  toAddress: string,
  amount: number
): Promise<TransferResult> {
  // TODO: Implement full SPL token transfer
  // This requires:
  // 1. Building a token transfer instruction
  // 2. Creating and serializing the transaction
  // 3. Using signAndSendTransaction from privy.ts
  
  console.log(`[CMEM] Transfer stub: ${amount} CMEM from wallet ${fromWalletId} to ${toAddress}`);
  
  return {
    success: false,
    error: 'Transfer not yet implemented - use airdrop API for now',
  };
}

/**
 * Get wallet info including SOL and CMEM balances.
 * @param walletAddress - Solana wallet address
 */
export async function getWalletInfo(walletAddress: string): Promise<{
  address: string;
  solBalance: number;
  cmemBalance: TokenBalance;
}> {
  const [solBalance, cmemBalance] = await Promise.all([
    getSolBalance(walletAddress),
    getCmemBalance(walletAddress),
  ]);
  
  return {
    address: walletAddress,
    solBalance,
    cmemBalance,
  };
}

export { signAndSendTransaction };
