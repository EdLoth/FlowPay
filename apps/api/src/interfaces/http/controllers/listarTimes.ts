import type { Request, Response } from 'express';
import { PrismaTimeRepository } from '../../../infra/database/repositories/PrismaTimeRepository';

export async function listarTimes(_req: Request, res: Response) {
  const repository = new PrismaTimeRepository();
  const times = await repository.listarTodos();
  return res.status(200).json(times);
}
