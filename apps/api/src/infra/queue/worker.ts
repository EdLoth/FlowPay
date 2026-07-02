import { Worker } from 'bullmq';
import { redisConnection } from './connection';
import { PrismaAtendimentoRepository } from '../database/repositories/PrismaAtendimentoRepository';
import { notificarDashboard } from '../realtime/socket';

const NOMES_FILA = ['fila-cartoes', 'fila-emprestimos', 'fila-outros'];
const repositorio = new PrismaAtendimentoRepository();

export function iniciarWorkers() {
  for (const nomeFila of NOMES_FILA) {
    new Worker(
      nomeFila,
      async (job) => {
        if (job.name === 'atendente-liberou') {
          const { atendenteId, timeId } = job.data as { atendenteId: string; timeId: string };
          const atribuido = await repositorio.atribuirProximoDaFila(atendenteId, timeId);
          if (atribuido) {
            console.log(`Job ${job.id}: atendimento ${atribuido.id} atribuído a ${atendenteId}`);
            notificarDashboard('atendimento_atribuido_da_fila');
          } else {
            console.log(`Job ${job.id}: sem atendimento pendente na fila para ${timeId}`);
          }
        }
      },
      { connection: redisConnection },
    );
  }

  console.log('Workers de distribuição iniciados para todas as filas.');
}
