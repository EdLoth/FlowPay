export interface AtendenteComOcupacao {
  id: string;
  nome: string;
  timeId: string;
  timeNome: string;
  capacidadeMaxima: number;
  atendimentosAtivos: number;
}

export interface AtendenteRepository {
  listarComOcupacao(): Promise<AtendenteComOcupacao[]>;
}
