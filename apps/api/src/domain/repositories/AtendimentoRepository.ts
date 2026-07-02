import type { Atendimento } from '../entities/Atendimento';

export interface CriarAtendimentoInput {
  assunto: string;
  assuntoNormalizado: string;
  timeId: string;
  idempotencyKey?: string;
}

export interface AtendenteComOcupacao {
  id: string;
  nome: string;
  timeId: string;
  timeNome: string;
  capacidadeMaxima: number;
  atendimentosAtivos: number;
}

export interface AtendimentoRepository {
  listarTodos(): Promise<Atendimento[]>;
  criarComAtribuicaoAtomica(input: CriarAtendimentoInput): Promise<Atendimento>;
  listarComOcupacao(): Promise<AtendenteComOcupacao[]>;
  buscarPorIdempotencyKey(key: string): Promise<Atendimento | null>;
  finalizar(atendimentoId: string): Promise<Atendimento>;
  atribuirProximoDaFila(atendenteId: string, timeId: string): Promise<Atendimento | null>;
}
