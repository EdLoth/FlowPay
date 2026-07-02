import cors from 'cors';
import express from 'express';
import { router } from './interfaces/http/routes';

export function criarApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(router);

  return app;
}
