import Fastify from 'fastify';
import { OrderController } from './controllers/OrderController';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(OrderController, { prefix: '/api/orders' });

  app.get('/health', async () => ({ status: 'ok' }));

  return app;
}
