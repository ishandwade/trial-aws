export interface MarketOrderDto {
  tokenIn: string;
  tokenOut: string;
  amount: number;
}

export const MarketOrderSchema = {
  body: {
    type: 'object',
    required: ['tokenIn', 'tokenOut', 'amount'],
    properties: {
      tokenIn: { type: 'string' },
      tokenOut: { type: 'string' },
      amount: { type: 'number', minimum: 0 }
    }
  }
}