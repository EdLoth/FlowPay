export interface TimeListado {
  id: string;
  nome: string;
}

export interface TimeRepository {
  buscarPorAssunto(assuntoNormalizado: string): Promise<{ id: string } | null>;
  buscarOutrosAssuntos(): Promise<{ id: string }>;
  listarTodos(): Promise<TimeListado[]>;
}
