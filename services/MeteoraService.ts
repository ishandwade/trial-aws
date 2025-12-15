import { Connection, PublicKey } from '@solana/web3.js';

export class MeteoraService {
  constructor(private connection: Connection) {}

  async getSolUsdcPrice(): Promise<number> {
    try {
      // Use CoinGecko API - free and reliable for SOL price
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API returned ${response.status}`);
      }
      
      const data = await response.json();
      
      // CoinGecko returns: { "solana": { "usd": 126.45 } }
      if (!data.solana || !data.solana.usd) {
        throw new Error('Invalid response from CoinGecko API');
      }
      
      const price = data.solana.usd;
      
      // Sanity check
      if (price < 10 || price > 10000 || !isFinite(price)) {
        throw new Error(`Invalid price: ${price}`);
      }
      
      return price;
    } catch (error) {
      throw error;
    }
  }
}