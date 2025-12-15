import { RaydiumService } from './RaydiumService';

const raydium = new RaydiumService();

async function poll() {
  try {
    const price = await raydium.getSolUsdcPrice();
    console.log(`[Raydium] SOL/USDC: $${price.toFixed(4)}`);
  } catch (err) {
    console.error('Polling error:', err);
  }
}

// 15 seconds
setInterval(poll, 15_000);
