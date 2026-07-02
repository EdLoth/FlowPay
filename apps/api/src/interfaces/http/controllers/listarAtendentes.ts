import type { Request, Response } from 'express';
import { PrismaAtendenteRepository } from '../../../infra/database/repositories/PrismaAtendenteRepository';

export async function listarAtendentes(_req: Request, res: Response) {
  const repository = new PrismaAtendenteRepository();
  const atendentes = await repository.listarComOcupacao();
  return res.status(200).json(atendentes);
}
