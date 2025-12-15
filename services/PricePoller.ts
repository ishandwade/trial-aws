import { Connection } from '@solana/web3.js';
import { RaydiumOnChainService } from './RadyiumOnChainService';
import { MeteoraService } from './MeteoraService';

const connection = new Connection(
  'https://api.mainnet-beta.solana.com',
  'confirmed'
);

const raydium = new RaydiumOnChainService(connection);
const meteora = new MeteoraService(connection);

setInterval(async () => {
  try {
    const [raydiumPrice, meteoraPrice] = await Promise.all([
      raydium.getSolUsdcPrice().catch(err => {
        console.error('[RAYDIUM ERROR]', err.message);
        return null;
      }),
      meteora.getSolUsdcPrice().catch(err => {
        console.error('[METEORA ERROR]', err.message);
        return null;
      })
    ]);

    console.log('\n--- Price Update ---');
    console.log(`[${new Date().toLocaleTimeString()}]`);
    
    if (raydiumPrice !== null) {
      console.log(`[RAYDIUM] SOL/USDC: $${raydiumPrice.toFixed(4)}`);
    }
    
    if (meteoraPrice !== null) {
      console.log(`[METEORA] SOL/USDC: $${meteoraPrice.toFixed(4)}`);
    }

    // Show comparison if both are valid
    if (raydiumPrice !== null && meteoraPrice !== null) {
      const diff = Math.abs(raydiumPrice - meteoraPrice);
      const avgPrice = (raydiumPrice + meteoraPrice) / 2;
      const diffPercent = (diff / avgPrice) * 100;
      
      const best = raydiumPrice > meteoraPrice ? 'RAYDIUM' : 'METEORA';
      console.log(`[BEST] ${best}`);
      console.log(`[SPREAD] $${diff.toFixed(4)} (${diffPercent.toFixed(2)}%)`);
    }
  } catch (e) {
    console.error('[POLLER ERROR]', e);
  }
}, 5_000);