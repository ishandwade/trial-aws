import { v4 as uuid } from 'uuid';
import { MarketOrderDto } from '../dtos/MarketOrderDto';

export class OrderService {
  async executeMarketOrder(order: MarketOrderDto) {
    // Stub logic: return orderId immediately
    const orderId = uuid();

    return {
      orderId,
      status: 'pending'
    };
  }
}
