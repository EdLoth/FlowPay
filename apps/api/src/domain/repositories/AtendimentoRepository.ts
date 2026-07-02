import type { Atendimento } from '../entities/Atendimento';

export interface CriarAtendimentoInput {
  assunto: string;
  assuntoNormalizado: string;
  timeId: string;
  idempotencyKey?: string;
}

export interface AtendimentoRepository {
  criarComAtribuicaoAtomica(input: CriarAtendimentoInput): Promise<Atendimento>;
  buscarPorIdempotencyKey(key: string): Promise<Atendimento | null>;
}
