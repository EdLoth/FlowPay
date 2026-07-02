import express from 'express';
import { iniciarOutboxPublisher } from './infra/queue/outboxPublisher';
import { iniciarWorkers } from './infra/queue/worker';
import { router } from './interfaces/http/routes';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(router);

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

iniciarOutboxPublisher();
iniciarWorkers();
