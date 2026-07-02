import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { iniciarOutboxPublisher } from './infra/queue/outboxPublisher';
import { iniciarWorkers } from './infra/queue/worker';
import { iniciarSocket } from './infra/realtime/socket';
import { router } from './interfaces/http/routes';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(router);

const httpServer = http.createServer(app);
iniciarSocket(httpServer);

const PORT = process.env.PORT ?? 3000;

httpServer.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

iniciarOutboxPublisher();
iniciarWorkers();
