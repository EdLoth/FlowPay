import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../infra/database/prisma/client';
import { PrismaAtendimentoRepository } from '../../infra/database/repositories/PrismaAtendimentoRepository';
import { PrismaTimeRepository } from '../../infra/database/repositories/PrismaTimeRepository';
import { CriarAtendimento } from './CriarAtendimento';
import { FinalizarAtendimento } from './FinalizarAtendimento';
import { processarEventosPendentes } from '../../infra/queue/outboxPublisher';
import { limparBanco, seedTimesEAtendentes } from '../../test/setupIntegration';

describe('Fluxo completo de distribuição (integração com Postgres real)', () => {
  beforeEach(async () => {
    await limparBanco();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('respeita o limite de 3 atendimentos por atendente e enfileira o excedente', async () => {
    const { cartoes, atendente1, atendente2 } = await seedTimesEAtendentes();

    const criarAtendimento = new CriarAtendimento(
      new PrismaAtendimentoRepository(),
      new PrismaTimeRepository(),
    );

    // 2 atendentes x 3 vagas = 6 atendimentos cabem, o 7º deve enfileirar
    const resultados = [];
    for (let i = 0; i < 7; i++) {
      resultados.push(await criarAtendimento.executar({ assunto: 'Problemas com cartão' }));
    }

    const emAtendimento = resultados.filter((r) => r.status === 'EM_ATENDIMENTO');
    const aguardandoFila = resultados.filter((r) => r.status === 'AGUARDANDO_FILA');

    expect(emAtendimento).toHaveLength(6);
    expect(aguardandoFila).toHaveLength(1);

    // Confirma que nenhum atendente passou de 3 atendimentos ativos — a regra central do desafio
    const atendimentosPorAtendente = await prisma.atendimento.groupBy({
      by: ['atendenteId'],
      where: { status: 'EM_ATENDIMENTO', timeId: cartoes.id },
      _count: true,
    });

    for (const grupo of atendimentosPorAtendente) {
      expect(grupo._count).toBeLessThanOrEqual(3);
    }
    expect(atendimentosPorAtendente).toHaveLength(2); // ambos atendentes usados
    void atendente1;
    void atendente2;
  });

  it('redistribui automaticamente o atendimento da fila quando um atendente finaliza', async () => {
    await seedTimesEAtendentes();

    const criarAtendimento = new CriarAtendimento(
      new PrismaAtendimentoRepository(),
      new PrismaTimeRepository(),
    );
    const finalizarAtendimento = new FinalizarAtendimento(new PrismaAtendimentoRepository());

    // Enche as 6 vagas + 1 na fila
    const criados = [];
    for (let i = 0; i < 7; i++) {
      criados.push(await criarAtendimento.executar({ assunto: 'Problemas com cartão' }));
    }
    const naFila = criados.find((c) => c.status === 'AGUARDANDO_FILA')!;
    const primeiroEmAtendimento = criados.find((c) => c.status === 'EM_ATENDIMENTO')!;

    // Finaliza um atendimento — isso gera o evento ATENDENTE_LIBEROU no outbox
    await finalizarAtendimento.executar(primeiroEmAtendimento.id);

    // Simula o outbox publisher rodando um ciclo (sem esperar o setInterval real de 2s)
    await processarEventosPendentes();

    // Simula o worker processando o job imediatamente (sem esperar o BullMQ real)
    const { PrismaAtendimentoRepository: Repo } =
      await import('../../infra/database/repositories/PrismaAtendimentoRepository');
    const repo = new Repo();
    await repo.atribuirProximoDaFila(primeiroEmAtendimento.atendenteId!, naFila.timeId);

    const atendimentoRedistribuido = await prisma.atendimento.findUnique({
      where: { id: naFila.id },
    });

    expect(atendimentoRedistribuido?.status).toBe('EM_ATENDIMENTO');
    expect(atendimentoRedistribuido?.atendenteId).toBe(primeiroEmAtendimento.atendenteId);
  });
});
