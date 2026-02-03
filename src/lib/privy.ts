// Privy Agentic Wallet integration for CrabSpace
// Creates server-side wallets for crabs to receive $CMEM

import { PrivyClient, type Wallet } from '@privy-io/node';

// Lazy-initialized Privy client (server-side only)
let _privy: PrivyClient | null = null;

function getPrivyClient(): PrivyClient {
  if (!_privy) {
    const appId = process.env.PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    
    if (!appId || !appSecret) {
      throw new Error('PRIVY_APP_ID and PRIVY_APP_SECRET are required');
    }
    
    _privy = new PrivyClient({ appId, appSecret });
  }
  return _privy;
}

export interface AgenticWallet {
  id: string;
  address: string;
}

export interface TransactionResult {
  hash: string;
  caip2?: string;
}

/**
 * Create a new Solana agentic wallet for a crab.
 * This wallet is managed by Privy and can sign transactions server-side.
 */
export async function createAgenticWallet(): Promise<AgenticWallet> {
  const privy = getPrivyClient();
  const wallet: Wallet = await privy.wallets().create({
    chain_type: 'solana',
  });
  
  return {
    id: wallet.id,
    address: wallet.address,
  };
}

/**
 * Sign and send a Solana transaction using a Privy agentic wallet.
 * @param walletId - The Privy wallet ID
 * @param transaction - Base64-encoded serialized transaction
 * @returns Transaction signature/hash
 */
export async function signAndSendTransaction(
  walletId: string,
  transaction: string
): Promise<TransactionResult> {
  const privy = getPrivyClient();
  const result = await privy.wallets().solana().signAndSendTransaction(walletId, {
    transaction,
    // Solana mainnet CAIP-2 identifier
    caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  });
  
  return {
    hash: result.hash,
    caip2: result.caip2,
  };
}

/**
 * Sign a Solana transaction without sending (for preview/dry-run).
 * @param walletId - The Privy wallet ID
 * @param transaction - Base64-encoded serialized transaction
 * @returns Signed transaction (base64)
 */
export async function signTransaction(
  walletId: string,
  transaction: string
): Promise<{ signedTransaction: string }> {
  const privy = getPrivyClient();
  const result = await privy.wallets().solana().signTransaction(walletId, {
    transaction,
  });
  
  return {
    signedTransaction: result.signed_transaction,
  };
}

/**
 * Sign a message with a Privy agentic wallet.
 * @param walletId - The Privy wallet ID  
 * @param message - Message to sign
 * @returns Base64-encoded signature
 */
export async function signMessage(
  walletId: string,
  message: string
): Promise<{ signature: string }> {
  const privy = getPrivyClient();
  const result = await privy.wallets().solana().signMessage(walletId, {
    message,
  });
  
  return {
    signature: result.signature,
  };
}

export { getPrivyClient };
