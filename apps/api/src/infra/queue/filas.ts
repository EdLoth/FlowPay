import { Queue } from 'bullmq';
import { redisConnection } from './connection';

const NOMES_FILA: Record<string, string> = {
  Cartões: 'fila-cartoes',
  Empréstimos: 'fila-emprestimos',
  'Outros Assuntos': 'fila-outros',
};

export interface JobDistribuicao {
  atendimentoId: string;
}

const filasCache = new Map<string, Queue>();

export function obterFila(nomeTime: string): Queue {
  const nomeFila = NOMES_FILA[nomeTime] ?? 'fila-outros';

  if (!filasCache.has(nomeFila)) {
    filasCache.set(nomeFila, new Queue(nomeFila, { connection: redisConnection }));
  }

  return filasCache.get(nomeFila)!;
}
