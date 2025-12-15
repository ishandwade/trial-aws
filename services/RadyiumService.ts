import axios from 'axios';

const RAYDIUM_POOLS_URL =
  'https://api.raydium.io/v2/sdk/liquidity/mainnet.json';

const WSOL =
  'So11111111111111111111111111111111111111112';
const USDC =
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

export class RaydiumService {
  private cachedPool: any | null = null;
  private lastFetch = 0;
  private CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private async loadPoolIfNeeded() {
    const now = Date.now();

    if (this.cachedPool && now - this.lastFetch < this.CACHE_TTL_MS) {
      return;
    }

    console.log('Fetching Raydium pool list...');

    const { data } = await axios.get(RAYDIUM_POOLS_URL, {
      timeout: 10_000,
      headers: {
        'User-Agent': 'price-poller'
      }
    });

    const allPools = [...data.official, ...data.unOfficial];

    const pool = allPools.find(
      (p: any) =>
        p.baseMint === WSOL &&
        p.quoteMint === USDC
    );

    if (!pool) {
      throw new Error('SOL/USDC pool not found');
    }

    this.cachedPool = pool;
    this.lastFetch = now;
  }

  async getSolUsdcPrice(): Promise<number> {
    await this.loadPoolIfNeeded();

    // Raydium API already computes spot price
    return Number(this.cachedPool.price);
  }
}
