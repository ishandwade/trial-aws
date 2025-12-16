import { Connection, PublicKey } from '@solana/web3.js';
import { Raydium, CurveCalculator } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';

export async function executeRaydiumMarketOrder({
  connection,
  wallet,
  poolId,
  amountInSol,
  slippage = 1 // default 1%
}: {
  connection: Connection;
  wallet: any;
  poolId: PublicKey;
  amountInSol: number;
  slippage?: number;
}) {
  // Load Raydium (devnet)
  const raydium = await Raydium.load({
    owner: wallet,
    connection,
    cluster: 'devnet' as any // Type workaround for cluster
  });

  // Load pool
  const { poolInfo, poolKeys, rpcData } =
    await raydium.cpmm.getPoolInfoFromRpc(poolId.toString());

  if (!poolInfo || !rpcData) {
    throw new Error('Failed to load pool');
  }

  // Setup swap
  const baseIn = true;
  const inputAmount = new BN(Math.floor(amountInSol * 1_000_000_000));
  
  const inputVault = new BN(rpcData.baseReserve.toString());
  const outputVault = new BN(rpcData.quoteReserve.toString());

  // Get fee config (SDK v2 structure)
  const tradeFeeRate = new BN(poolInfo.config.tradeFeeRate.toString());
  const protocolFeeRate = new BN(poolInfo.config.protocolFeeRate.toString());
  const fundFeeRate = new BN(poolInfo.config.fundFeeRate.toString());
  
  // Calculate swap using SDK v2
  const swapResult = CurveCalculator.swapBaseInput(
    inputAmount,
    inputVault,
    outputVault,
    tradeFeeRate,
    protocolFeeRate,
    fundFeeRate
  );

  // Calculate minimum output with slippage protection
  const outputAmount = swapResult.amountOut; // Correct property name
  const minAmountOut = outputAmount
    .mul(new BN(Math.floor((100 - slippage) * 100)))
    .div(new BN(10000));

  // Execute swap
  const { execute } = await raydium.cpmm.swap({
    poolInfo,
    poolKeys,
    inputAmount,
    baseIn,
    slippage
  });

  const { txId } = await execute({ sendAndConfirm: true });

  return {
    txId,
    amountOut: outputAmount.toString(),
    minAmountOut: minAmountOut.toString()
  };
}