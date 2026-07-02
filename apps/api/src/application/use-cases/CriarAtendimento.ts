import type { AtendimentoRepository } from '../../domain/repositories/AtendimentoRepository';
import type { Atendimento } from '../../domain/entities/Atendimento';

interface TimeRepository {
  buscarPorAssunto(assuntoNormalizado: string): Promise<{ id: string } | null>;
  buscarOutrosAssuntos(): Promise<{ id: string }>;
}

export interface CriarAtendimentoRequest {
  assunto: string;
  idempotencyKey?: string;
}

export class CriarAtendimento {
  constructor(
    private readonly atendimentoRepository: AtendimentoRepository,
    private readonly timeRepository: TimeRepository,
  ) {}

  async executar(request: CriarAtendimentoRequest): Promise<Atendimento> {
    if (request.idempotencyKey) {
      const existente = await this.atendimentoRepository.buscarPorIdempotencyKey(
        request.idempotencyKey,
      );
      if (existente) return existente;
    }

    const assuntoNormalizado = request.assunto.trim().toLowerCase();

    const timeEspecifico = await this.timeRepository.buscarPorAssunto(assuntoNormalizado);
    const time = timeEspecifico ?? (await this.timeRepository.buscarOutrosAssuntos());

    return this.atendimentoRepository.criarComAtribuicaoAtomica({
      assunto: request.assunto,
      assuntoNormalizado,
      timeId: time.id,
      idempotencyKey: request.idempotencyKey,
    });
  }
}
