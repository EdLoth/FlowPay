import express from 'express';
import { iniciarOutboxPublisher } from './infra/queue/outboxPublisher';
import { iniciarWorkers } from './infra/queue/worker';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

iniciarOutboxPublisher();
iniciarWorkers();
