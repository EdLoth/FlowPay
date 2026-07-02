import { prisma } from '../prisma/client';

const MAPA_ASSUNTOS: Record<string, string> = {
  'problemas com cartão': 'Cartões',
  'contratação de empréstimo': 'Empréstimos',
};

export class PrismaTimeRepository {
  async buscarPorAssunto(assuntoNormalizado: string) {
    const nomeTime = MAPA_ASSUNTOS[assuntoNormalizado];
    if (!nomeTime) return null;
    return prisma.time.findUnique({ where: { nome: nomeTime } });
  }

  async buscarOutrosAssuntos() {
    const time = await prisma.time.findUniqueOrThrow({ where: { nome: 'Outros Assuntos' } });
    return time;
  }
}
