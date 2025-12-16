❌ Order type: Market order
❌ Execution: Mock DEX
❌ Routing: Raydium vs Meteora (mocked)
❌ Queue: BullMQ + Redis
❌ Realtime: WebSocket + Redis Pub/Sub
❌ API: Fastify + TypeScript
❌ DB: PostgreSQL (history)
❌ Workers: Multiple BullMQ workers 


Pass 1: Make it work (synchronous, no WebSockets yet)

Goal:

A market order goes in → routing happens → execution happens → response comes back.

No queues. No sockets. Just correctness.

Pass 2: Make it real-time (async + WebSockets + workers)

Goal:

Same logic, but now event-driven, concurrent, and streamed live.

We don’t rewrite. We wrap.

This is how real systems are built.



- Polling time has to be reduced in production from 5 seconds that were doing locally as the host is flagging me as a bot if its under 5 or even at 5, if possible avoid api calls
- Instead of making one polling time for all we can have an adaptive polling time for each token based off their trade volumes
- Slippage 