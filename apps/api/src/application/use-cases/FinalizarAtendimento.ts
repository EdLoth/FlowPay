import type { AtendimentoRepository } from '../../domain/repositories/AtendimentoRepository';

export class FinalizarAtendimento {
  constructor(private readonly atendimentoRepository: AtendimentoRepository) {}

  async executar(atendimentoId: string) {
    return this.atendimentoRepository.finalizar(atendimentoId);
  }
}
