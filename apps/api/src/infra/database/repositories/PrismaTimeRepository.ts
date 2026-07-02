import { prisma } from '../prisma/client';
import type { TimeRepository } from '../../../domain/repositories/TimeRepository';

const MAPA_ASSUNTOS: Record<string, string> = {
  'problemas com cartão': 'Cartões',
  'contratação de empréstimo': 'Empréstimos',
};

export class PrismaTimeRepository implements TimeRepository {
  async buscarPorAssunto(assuntoNormalizado: string) {
    const nomeTime = MAPA_ASSUNTOS[assuntoNormalizado];
    if (!nomeTime) return null;
    return prisma.time.findUnique({ where: { nome: nomeTime } });
  }

  async buscarOutrosAssuntos() {
    return prisma.time.findUniqueOrThrow({ where: { nome: 'Outros Assuntos' } });
  }

  async listarTodos() {
    return prisma.time.findMany({ orderBy: { nome: 'asc' } });
  }
}
