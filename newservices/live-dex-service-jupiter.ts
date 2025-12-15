import { Connection, PublicKey } from '@solana/web3.js';
import { Jupiter, RouteInfo } from '@jup-ag/core';
import Decimal from 'decimal.js';

/**
 * Enhanced Live DEX Service using Jupiter Aggregator
 * 
 * Jupiter aggregates prices from multiple DEXs including Raydium and Meteora,
 * providing the best execution price automatically.
 */

const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

export class LiveDexService {
  private connection: Connection;
  private jupiter: Jupiter | null = null;

  constructor(rpcEndpoint: string = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcEndpoint, 'confirmed');
  }

  /**
   * Initialize Jupiter aggregator
   */
  async initialize(): Promise<void> {
    if (!this.jupiter) {
      this.jupiter = await Jupiter.load({
        connection: this.connection,
        cluster: 'mainnet-beta',
        user: PublicKey.default, // Will be replaced during swap
      });
    }
  }

  /**
   * Get quote from Jupiter (includes Raydium, Meteora, and other DEXs)
   */
  async getQuote(
    inputAmount: number,
    inputMint: PublicKey = SOL_MINT,
    outputMint: PublicKey = USDC_MINT,
    slippageBps: number = 50 // 0.5% slippage
  ): Promise<{
    routes: RouteInfo[];
    bestRoute: RouteInfo | null;
    outputAmount: number;
    priceImpact: number;
    marketInfos: Array<{ label: string; outputAmount: number }>;
  }> {
    await this.initialize();

    if (!this.jupiter) {
      throw new Error('Jupiter not initialized');
    }

    // Convert amount to lamports/smallest unit
    const inputAmountLamports = inputAmount * 1e9; // For SOL

    // Get routes
    const routes = await this.jupiter.computeRoutes({
      inputMint,
      outputMint,
      amount: inputAmountLamports,
      slippageBps,
      forceFetch: true, // Always get fresh data
    });

    if (!routes || routes.routesInfos.length === 0) {
      throw new Error('No routes found');
    }

    const bestRoute = routes.routesInfos[0];
    const outputAmount = Number(bestRoute.outAmount) / 1e6; // USDC has 6 decimals

    // Extract market info (which DEXs are being used)
    const marketInfos = bestRoute.marketInfos.map((info) => ({
      label: info.label,
      outputAmount: Number(info.outputMint.equals(outputMint) ? info.outAmount : 0) / 1e6,
    }));

    return {
      routes: routes.routesInfos,
      bestRoute,
      outputAmount,
      priceImpact: bestRoute.priceImpactPct,
      marketInfos,
    };
  }

  /**
   * Get quote specifically from Raydium
   */
  async getRaydiumQuote(amount: number): Promise<number> {
    const quote = await this.getQuote(amount);
    
    // Filter routes that use Raydium
    const raydiumRoute = quote.routes.find((route) =>
      route.marketInfos.some((market) => market.label.toLowerCase().includes('raydium'))
    );

    if (!raydiumRoute) {
      throw new Error('No Raydium route available');
    }

    return Number(raydiumRoute.outAmount) / 1e6;
  }

  /**
   * Get quote specifically from Meteora
   */
  async getMeteoraQuote(amount: number): Promise<number> {
    const quote = await this.getQuote(amount);
    
    // Filter routes that use Meteora
    const meteoraRoute = quote.routes.find((route) =>
      route.marketInfos.some((market) => market.label.toLowerCase().includes('meteora'))
    );

    if (!meteoraRoute) {
      throw new Error('No Meteora route available');
    }

    return Number(meteoraRoute.outAmount) / 1e6;
  }

  /**
   * Get quotes from all available DEXs
   */
  async getAllQuotes(amount: number): Promise<{
    best: { dex: string; amount: number; priceImpact: number };
    routes: Array<{ dex: string; amount: number; marketInfos: any[] }>;
  }> {
    const quote = await this.getQuote(amount);

    // Group routes by primary DEX
    const routes = quote.routes.slice(0, 5).map((route) => ({
      dex: route.marketInfos[0]?.label || 'Unknown',
      amount: Number(route.outAmount) / 1e6,
      marketInfos: route.marketInfos.map((m) => ({
        label: m.label,
        inputMint: m.inputMint.toString(),
        outputMint: m.outputMint.toString(),
      })),
    }));

    return {
      best: {
        dex: quote.bestRoute?.marketInfos[0]?.label || 'Unknown',
        amount: quote.outputAmount,
        priceImpact: quote.priceImpact,
      },
      routes,
    };
  }

  /**
   * Execute swap using Jupiter
   * Requires wallet integration
   */
  async executeSwap(
    inputAmount: number,
    walletPublicKey: PublicKey,
    slippageBps: number = 50
  ): Promise<string> {
    await this.initialize();

    if (!this.jupiter) {
      throw new Error('Jupiter not initialized');
    }

    // Get the best route
    const quote = await this.getQuote(inputAmount, SOL_MINT, USDC_MINT, slippageBps);

    if (!quote.bestRoute) {
      throw new Error('No route available');
    }

    // This is a simplified example - in production you need:
    // 1. Proper wallet adapter (Phantom, Solflare, etc.)
    // 2. Transaction signing
    // 3. Error handling and retry logic

    const { execute } = await this.jupiter.exchange({
      routeInfo: quote.bestRoute,
    });

    // In a real app, you would sign this with the wallet
    const swapResult = await execute(); // This will fail without proper wallet integration

    return swapResult.txid;
  }

  /**
   * Subscribe to price updates using polling
   * (More reliable than WebSocket for multi-DEX aggregation)
   */
  startPriceMonitoring(
    amount: number,
    callback: (prices: {
      timestamp: Date;
      best: number;
      raydium?: number;
      meteora?: number;
    }) => void,
    intervalMs: number = 3000 // Poll every 3 seconds
  ): NodeJS.Timeout {
    const intervalId = setInterval(async () => {
      try {
        const [bestQuote, raydiumQuote, meteoraQuote] = await Promise.allSettled([
          this.getQuote(amount),
          this.getRaydiumQuote(amount).catch(() => null),
          this.getMeteoraQuote(amount).catch(() => null),
        ]);

        const prices = {
          timestamp: new Date(),
          best:
            bestQuote.status === 'fulfilled' ? bestQuote.value.outputAmount : 0,
          raydium:
            raydiumQuote.status === 'fulfilled' ? raydiumQuote.value : undefined,
          meteora:
            meteoraQuote.status === 'fulfilled' ? meteoraQuote.value : undefined,
        };

        callback(prices);
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    }, intervalMs);

    return intervalId;
  }

  /**
   * Stop price monitoring
   */
  stopPriceMonitoring(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
  }

  /**
   * Get historical price data (requires additional API)
   */
  async getHistoricalPrices(
    hours: number = 24
  ): Promise<Array<{ timestamp: Date; price: number }>> {
    // This would require integration with a price history API like:
    // - Birdeye API
    // - DexScreener API
    // - CoinGecko API
    throw new Error('Historical price data requires additional API integration');
  }
}

export default LiveDexService;