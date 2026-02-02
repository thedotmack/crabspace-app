// Airdrop 420 $CMEM to new verified crabs
// This calls our external airdrop API endpoint

const AIRDROP_AMOUNT = 420;
const CMEM_MINT = '2TsmuYUrsctE57VLckZBYEEzdokUF8j8e1GavekWBAGS';
const AIRDROP_API_URL = process.env.AIRDROP_API_URL || 'https://crabspace.me/api/internal/airdrop';
const AIRDROP_SECRET = process.env.AIRDROP_SECRET || '';

export interface AirdropResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export async function sendAirdrop(walletAddress: string, username: string): Promise<AirdropResult> {
  // If no airdrop secret configured, skip (for local dev)
  if (!AIRDROP_SECRET) {
    console.log(`[Airdrop] Skipping airdrop for ${username} - no AIRDROP_SECRET configured`);
    return { success: false, error: 'Airdrop not configured' };
  }

  try {
    const response = await fetch(AIRDROP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIRDROP_SECRET}`,
      },
      body: JSON.stringify({
        wallet: walletAddress,
        username,
        amount: AIRDROP_AMOUNT,
        mint: CMEM_MINT,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Airdrop] Failed for ${username}:`, data);
      return { success: false, error: data.error || 'Airdrop failed' };
    }

    console.log(`[Airdrop] Success for ${username}: ${data.txHash}`);
    return { success: true, txHash: data.txHash };
  } catch (error) {
    console.error(`[Airdrop] Error for ${username}:`, error);
    return { success: false, error: 'Airdrop request failed' };
  }
}

export { AIRDROP_AMOUNT, CMEM_MINT };
