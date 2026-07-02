import type { Atendente } from '../entities/Atendente';

export interface AtendenteComOcupacao extends Atendente {
  timeNome: string;
  atendimentosAtivos: number;
}

export interface AtendenteRepository {
  listarComOcupacao(): Promise<AtendenteComOcupacao[]>;
}
