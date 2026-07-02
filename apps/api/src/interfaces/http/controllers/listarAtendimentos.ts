import type { Request, Response } from 'express';
import { PrismaAtendimentoRepository } from '../../../infra/database/repositories/PrismaAtendimentoRepository';

export async function listarAtendimentos(_req: Request, res: Response) {
  const repository = new PrismaAtendimentoRepository();
  const atendimentos = await repository.listarTodos();
  return res.status(200).json(atendimentos);
}
