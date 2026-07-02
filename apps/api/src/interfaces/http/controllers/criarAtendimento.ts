import type { Request, Response } from 'express';
import { CriarAtendimento } from '../../../application/use-cases/CriarAtendimento';
import { PrismaAtendimentoRepository } from '../../../infra/database/repositories/PrismaAtendimentoRepository';
import { PrismaTimeRepository } from '../../../infra/database/repositories/PrismaTimeRepository';
import { notificarDashboard } from '../../../infra/realtime/socket';

export async function criarAtendimento(req: Request, res: Response) {
  const { assunto, idempotencyKey } = req.body as { assunto?: string; idempotencyKey?: string };

  if (!assunto || typeof assunto !== 'string' || assunto.trim().length === 0) {
    return res.status(400).json({ erro: 'O campo "assunto" é obrigatório.' });
  }

  const useCase = new CriarAtendimento(
    new PrismaAtendimentoRepository(),
    new PrismaTimeRepository(),
  );

  const atendimento = await useCase.executar({ assunto, idempotencyKey });
  notificarDashboard('atendimento_criado');
  return res.status(201).json(atendimento);
}
