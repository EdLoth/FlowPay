import { prisma } from '../prisma/client';
import type {
  AtendenteComOcupacao,
  AtendimentoRepository,
  CriarAtendimentoInput,
} from '../../../domain/repositories/AtendimentoRepository';
import type { Atendimento } from '../../../domain/entities/Atendimento';

interface AtendenteCandidato {
  id: string;
  capacidade_maxima: number;
  ativos: bigint;
}

export class PrismaAtendimentoRepository implements AtendimentoRepository {
  async criarComAtribuicaoAtomica(input: CriarAtendimentoInput): Promise<Atendimento> {
    return prisma.$transaction(async (tx) => {
      // Trava (FOR UPDATE) todos os atendentes do time, na ordem de quem tem
      // menos atendimentos ativos primeiro. Enquanto essa transação não termina,
      // nenhuma outra transação concorrente consegue travar essas mesmas linhas —
      // ela fica esperando. SKIP LOCKED evita que a gente espere por atendentes
      // que já estão sendo processados por outra requisição nesse exato instante.
      const candidatos = await tx.$queryRaw<AtendenteCandidato[]>`
        SELECT a.id, a.capacidade_maxima,
          (SELECT COUNT(*) FROM atendimentos t
           WHERE t.atendente_id = a.id AND t.status = 'EM_ATENDIMENTO') as ativos
        FROM atendentes a
        WHERE a.time_id = ${input.timeId}
        ORDER BY ativos ASC
        FOR UPDATE OF a SKIP LOCKED
      `;

      const disponivel = candidatos.find((c) => Number(c.ativos) < c.capacidade_maxima);

      const atendimento = await tx.atendimento.create({
        data: {
          assunto: input.assunto,
          assuntoNormalizado: input.assuntoNormalizado,
          timeId: input.timeId,
          idempotencyKey: input.idempotencyKey,
          atendenteId: disponivel ? disponivel.id : null,
          status: disponivel ? 'EM_ATENDIMENTO' : 'AGUARDANDO_FILA',
          atribuidoEm: disponivel ? new Date() : null,
        },
      });

      // Outbox: registra o evento na MESMA transação (ponto 3 da nossa revisão).
      await tx.outboxEvent.create({
        data: {
          tipo: disponivel ? 'ATENDIMENTO_ATRIBUIDO' : 'ATENDIMENTO_ENFILEIRADO',
          payload: { atendimentoId: atendimento.id },
        },
      });

      return atendimento;
    });
  }

  async buscarPorIdempotencyKey(key: string): Promise<Atendimento | null> {
    return prisma.atendimento.findUnique({ where: { idempotencyKey: key } });
  }

  async finalizar(atendimentoId: string) {
    return prisma.$transaction(async (tx) => {
      const atendimento = await tx.atendimento.update({
        where: { id: atendimentoId },
        data: { status: 'FINALIZADO', finalizadoEm: new Date() },
      });

      if (atendimento.atendenteId) {
        await tx.outboxEvent.create({
          data: {
            tipo: 'ATENDENTE_LIBEROU',
            payload: { atendenteId: atendimento.atendenteId, timeId: atendimento.timeId },
          },
        });
      }

      return atendimento;
    });
  }

  async atribuirProximoDaFila(atendenteId: string, timeId: string) {
    return prisma.$transaction(async (tx) => {
      // Trava a linha do atendente pra evitar que dois eventos "liberou"
      // concorrentes tentem atribuir dois atendimentos ao mesmo atendente.
      const [atendente] = await tx.$queryRaw<{ id: string; capacidade_maxima: number }[]>`
        SELECT id, capacidade_maxima FROM atendentes WHERE id = ${atendenteId} FOR UPDATE
      `;
      if (!atendente) return null;

      const ativos = await tx.atendimento.count({
        where: { atendenteId, status: 'EM_ATENDIMENTO' },
      });
      if (ativos >= atendente.capacidade_maxima) return null;

      const proximo = await tx.atendimento.findFirst({
        where: { timeId, status: 'AGUARDANDO_FILA' },
        orderBy: { criadoEm: 'asc' },
      });
      if (!proximo) return null;

      return tx.atendimento.update({
        where: { id: proximo.id },
        data: { atendenteId, status: 'EM_ATENDIMENTO', atribuidoEm: new Date() },
      });
    });
  }

  async listarTodos() {
    return prisma.atendimento.findMany({ orderBy: { criadoEm: 'desc' } });
  }

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
