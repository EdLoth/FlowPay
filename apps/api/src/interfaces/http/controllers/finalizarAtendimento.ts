import type { Request, Response } from 'express';
import { FinalizarAtendimento } from '../../../application/use-cases/FinalizarAtendimento';
import { PrismaAtendimentoRepository } from '../../../infra/database/repositories/PrismaAtendimentoRepository';
import { notificarDashboard } from '../../../infra/realtime/socket';

interface FinalizarAtendimentoParams {
  id: string;
}

export async function finalizarAtendimento(
  req: Request<FinalizarAtendimentoParams>,
  res: Response,
) {
  const { id } = req.params;

  const useCase = new FinalizarAtendimento(new PrismaAtendimentoRepository());
  const atendimento = await useCase.executar(id);
  notificarDashboard('atendimento_finalizado');

  return res.status(200).json(atendimento);
}
