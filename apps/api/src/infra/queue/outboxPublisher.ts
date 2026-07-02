import { prisma } from '../database/prisma/client';
import { obterFila, type JobDistribuicao } from './filas';

const INTERVALO_MS = 2000;

export function iniciarOutboxPublisher() {
  setInterval(() => {
    processarEventosPendentes().catch((error) => {
      console.error('Falha ao processar eventos do outbox:', error);
    });
  }, INTERVALO_MS);
}

export async function processarEventosPendentes() {
  const eventos = await prisma.outboxEvent.findMany({
    where: { status: 'PENDENTE' },
    orderBy: { criadoEm: 'asc' },
    take: 20,
  });

  for (const evento of eventos) {
    try {
      await processarEvento(evento);
      await prisma.outboxEvent.update({
        where: { id: evento.id },
        data: { status: 'PUBLICADO', publicadoEm: new Date() },
      });
    } catch (error) {
      console.error(`Erro ao publicar evento ${evento.id}:`, error);
      await prisma.outboxEvent.update({
        where: { id: evento.id },
        data: { tentativas: { increment: 1 } },
      });
    }
  }
}

export async function processarEvento(evento: { id: string; tipo: string; payload: unknown }) {
  const payload = evento.payload as { atendimentoId?: string };

  switch (evento.tipo) {
    case 'ATENDIMENTO_ENFILEIRADO': {
      const atendimento = await prisma.atendimento.findUniqueOrThrow({
        where: { id: payload.atendimentoId },
        include: { time: true },
      });
      const fila = obterFila(atendimento.time.nome);
      await fila.add('distribuir-atendimento', {
        atendimentoId: atendimento.id,
      } satisfies JobDistribuicao);
      break;
    }
    case 'ATENDIMENTO_ATRIBUIDO':
      // Já foi atribuído na criação — nenhuma ação de fila necessária aqui.
      break;
    case 'ATENDENTE_LIBEROU': {
      const { atendenteId, timeId } = payload as { atendenteId: string; timeId: string };
      const time = await prisma.time.findUniqueOrThrow({ where: { id: timeId } });
      const fila = obterFila(time.nome);
      await fila.add('atendente-liberou', {
        atendenteId,
        timeId,
      } satisfies { atendenteId: string; timeId: string });
      break;
    }
    default:
      console.warn(`Tipo de evento outbox desconhecido: ${evento.tipo}`);
  }
}
