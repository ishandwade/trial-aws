import { FastifyInstance } from 'fastify';
import { OrderService } from '../services/OrderService';
import { MarketOrderSchema } from '../dtos/MarketOrderDTOs';

export async function OrderController(app: FastifyInstance) {
  const orderService = new OrderService();

  app.post(
    '/execute',
    { schema: MarketOrderSchema },
    async (request, reply) => {
      const orderDto = request.body as any;
      const result = await orderService.executeMarketOrder(orderDto);
      reply.code(201);
      return result;
    }
  );
}
