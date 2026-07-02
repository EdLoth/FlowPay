import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { FinalizarAtendimento } from './FinalizarAtendimento';
import type {
  AtendimentoRepository,
  CriarAtendimentoInput,
} from '../../domain/repositories/AtendimentoRepository';
import type { Atendimento } from '../../domain/entities/Atendimento';

class FakeAtendimentoRepository implements AtendimentoRepository {
  atendimentos: Atendimento[] = [];

  async criarComAtribuicaoAtomica(input: CriarAtendimentoInput): Promise<Atendimento> {
    const atendimento: Atendimento = {
      id: randomUUID(),
      assunto: input.assunto,
      assuntoNormalizado: input.assuntoNormalizado,
      timeId: input.timeId,
      atendenteId: null,
      status: 'AGUARDANDO_FILA',
      idempotencyKey: input.idempotencyKey ?? null,
      criadoEm: new Date(),
      atribuidoEm: null,
      finalizadoEm: null,
    };
    this.atendimentos.push(atendimento);
    return atendimento;
  }

  async buscarPorIdempotencyKey(): Promise<Atendimento | null> {
    return null;
  }

  async finalizar(atendimentoId: string): Promise<Atendimento> {
    const atendimento = this.atendimentos.find((a) => a.id === atendimentoId);
    if (!atendimento) throw new Error('Atendimento não encontrado');

    atendimento.status = 'FINALIZADO';
    atendimento.finalizadoEm = new Date();
    return atendimento;
  }

  async atribuirProximoDaFila(): Promise<Atendimento | null> {
    return null;
  }

  // Helper só pro teste — simula um atendimento já em andamento
  adicionarEmAtendimento(atendenteId: string): Atendimento {
    const atendimento: Atendimento = {
      id: randomUUID(),
      assunto: 'Problemas com cartão',
      assuntoNormalizado: 'problemas com cartão',
      timeId: 'time-cartoes',
      atendenteId,
      status: 'EM_ATENDIMENTO',
      idempotencyKey: null,
      criadoEm: new Date(),
      atribuidoEm: new Date(),
      finalizadoEm: null,
    };
    this.atendimentos.push(atendimento);
    return atendimento;
  }
}

describe('FinalizarAtendimento', () => {
  it('marca o atendimento como FINALIZADO e registra o horário', async () => {
    const repository = new FakeAtendimentoRepository();
    const emAndamento = repository.adicionarEmAtendimento('atendente-1');
    const useCase = new FinalizarAtendimento(repository);

    const resultado = await useCase.executar(emAndamento.id);

    expect(resultado.status).toBe('FINALIZADO');
    expect(resultado.finalizadoEm).not.toBeNull();
  });

  it('lança erro ao tentar finalizar um atendimento inexistente', async () => {
    const repository = new FakeAtendimentoRepository();
    const useCase = new FinalizarAtendimento(repository);

    await expect(useCase.executar('id-que-nao-existe')).rejects.toThrow(
      'Atendimento não encontrado',
    );
  });
});
