import { prisma } from '../prisma/client';
import type {
  AtendenteComOcupacao,
  AtendenteRepository,
} from '../../../domain/repositories/AtendenteRepository';

export class PrismaAtendenteRepository implements AtendenteRepository {
  async listarComOcupacao(): Promise<AtendenteComOcupacao[]> {
    const atendentes = await prisma.atendente.findMany({
      include: {
        time: true,
        _count: { select: { atendimentos: { where: { status: 'EM_ATENDIMENTO' } } } },
      },
    });

    return atendentes.map((a) => ({
      id: a.id,
      nome: a.nome,
      timeId: a.timeId,
      timeNome: a.time.nome,
      capacidadeMaxima: a.capacidadeMaxima,
      atendimentosAtivos: a._count.atendimentos,
    }));
  }
}
