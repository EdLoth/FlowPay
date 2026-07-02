import type { Time } from '../entities/Time';

export interface TimeRepository {
  buscarPorAssunto(assuntoNormalizado: string): Promise<Time | null>;
  buscarOutrosAssuntos(): Promise<Time>;
  listarTodos(): Promise<Time[]>;
}
