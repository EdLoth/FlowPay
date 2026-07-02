import http from 'node:http';
import { criarApp } from './app';
import { iniciarOutboxPublisher } from './infra/queue/outboxPublisher';
import { iniciarWorkers } from './infra/queue/worker';
import { iniciarSocket } from './infra/realtime/socket';

const app = criarApp();
const httpServer = http.createServer(app);
iniciarSocket(httpServer);

const PORT = process.env.PORT ?? 3000;

httpServer.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

iniciarOutboxPublisher();
iniciarWorkers();
