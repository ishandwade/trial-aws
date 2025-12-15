import { Connection, PublicKey } from '@solana/web3.js';

// Real Raydium SOL/USDC pool address
const RAYDIUM_SOL_USDC_POOL = new PublicKey(
  '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2'
);

// These are the actual vault addresses for the SOL/USDC pool
const SOL_VAULT = new PublicKey(
  'DQyrAcCrDXQ7NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz'
);

const USDC_VAULT = new PublicKey(
  'HLmqeL62xR1QoZ1HKKbXRrdN1p3phKpxRMb2VVopvBBz'
);

export class RaydiumOnChainService {
  constructor(private connection: Connection) {}

  async getSolUsdcPrice(): Promise<number> {
    try {
      // Get the actual token account balances
      const [solBalance, usdcBalance] = await Promise.all([
        this.connection.getTokenAccountBalance(SOL_VAULT),
        this.connection.getTokenAccountBalance(USDC_VAULT)
      ]);

      const sol = solBalance.value.uiAmount;
      const usdc = usdcBalance.value.uiAmount;

      if (!sol || !usdc) {
        throw new Error('Invalid pool liquidity');
      }

      // Price = USDC reserve / SOL reserve
      return usdc / sol;
    } catch (error) {
      console.error('Error fetching Raydium price:', error);
      throw error;
    }
  }
}