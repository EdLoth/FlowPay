import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { CriarAtendimento } from './CriarAtendimento';
import type {
  AtendimentoRepository,
  CriarAtendimentoInput,
} from '../../domain/repositories/AtendimentoRepository';
import type { Atendimento } from '../../domain/entities/Atendimento';

// Fake em memória do repositório de atendimentos — simula a MESMA regra
// (máx. 3 ativos por atendente) que o Postgres garante via lock, só que sem banco.
class FakeAtendimentoRepository implements AtendimentoRepository {
  atendimentos: Atendimento[] = [];
  capacidadePorAtendente = new Map<string, number>();

  async criarComAtribuicaoAtomica(input: CriarAtendimentoInput): Promise<Atendimento> {
    let atendenteDisponivel: string | null = null;

    for (const [atendenteId, capacidade] of this.capacidadePorAtendente) {
      const ativos = this.atendimentos.filter(
        (a) => a.atendenteId === atendenteId && a.status === 'EM_ATENDIMENTO',
      ).length;
      if (ativos < capacidade) {
        atendenteDisponivel = atendenteId;
        break;
      }
    }

    const atendimento: Atendimento = {
      id: randomUUID(),
      assunto: input.assunto,
      assuntoNormalizado: input.assuntoNormalizado,
      timeId: input.timeId,
      atendenteId: atendenteDisponivel,
      status: atendenteDisponivel ? 'EM_ATENDIMENTO' : 'AGUARDANDO_FILA',
      idempotencyKey: input.idempotencyKey ?? null,
      criadoEm: new Date(),
      atribuidoEm: atendenteDisponivel ? new Date() : null,
      finalizadoEm: null,
    };

    this.atendimentos.push(atendimento);
    return atendimento;
  }

  async buscarPorIdempotencyKey(key: string): Promise<Atendimento | null> {
    return this.atendimentos.find((a) => a.idempotencyKey === key) ?? null;
  }
}

// Fake do repositório de times — retorna sempre o mesmo timeId fixo pra simplificar
class FakeTimeRepository {
  timeCartoesId = 'time-cartoes';
  timeOutrosId = 'time-outros';

  async buscarPorAssunto(assuntoNormalizado: string) {
    if (assuntoNormalizado === 'problemas com cartão') return { id: this.timeCartoesId };
    return null;
  }

  async buscarOutrosAssuntos() {
    return { id: this.timeOutrosId };
  }
}

function montarSut() {
  const atendimentoRepository = new FakeAtendimentoRepository();
  const timeRepository = new FakeTimeRepository();
  const useCase = new CriarAtendimento(atendimentoRepository, timeRepository);
  return { useCase, atendimentoRepository, timeRepository };
}

describe('CriarAtendimento', () => {
  it('atribui direto a um atendente quando há vaga disponível', async () => {
    const { useCase, atendimentoRepository, timeRepository } = montarSut();
    atendimentoRepository.capacidadePorAtendente.set('atendente-1', 3);

    const resultado = await useCase.executar({ assunto: 'Problemas com cartão' });

    expect(resultado.status).toBe('EM_ATENDIMENTO');
    expect(resultado.atendenteId).toBe('atendente-1');
    expect(resultado.timeId).toBe(timeRepository.timeCartoesId);
  });

  it('envia para a fila quando o atendente já está no limite de 3 atendimentos', async () => {
    const { useCase, atendimentoRepository } = montarSut();
    atendimentoRepository.capacidadePorAtendente.set('atendente-1', 3);

    await useCase.executar({ assunto: 'Problemas com cartão' });
    await useCase.executar({ assunto: 'Problemas com cartão' });
    await useCase.executar({ assunto: 'Problemas com cartão' });
    const quarto = await useCase.executar({ assunto: 'Problemas com cartão' });

    expect(quarto.status).toBe('AGUARDANDO_FILA');
    expect(quarto.atendenteId).toBeNull();
  });

  it('direciona assuntos não mapeados para o time Outros Assuntos', async () => {
    const { useCase, timeRepository } = montarSut();

    const resultado = await useCase.executar({ assunto: 'Dúvida sobre fatura' });

    expect(resultado.timeId).toBe(timeRepository.timeOutrosId);
  });

  it('normaliza o assunto (case/trim) antes de decidir o time', async () => {
    const { useCase, timeRepository } = montarSut();

    const resultado = await useCase.executar({ assunto: '  PROBLEMAS COM CARTÃO  ' });

    expect(resultado.timeId).toBe(timeRepository.timeCartoesId);
  });

  it('não duplica atendimento quando a mesma idempotencyKey é reenviada', async () => {
    const { useCase } = montarSut();

    const primeiro = await useCase.executar({
      assunto: 'Problemas com cartão',
      idempotencyKey: 'chave-123',
    });
    const segundo = await useCase.executar({
      assunto: 'Problemas com cartão',
      idempotencyKey: 'chave-123',
    });

    expect(segundo.id).toBe(primeiro.id);
  });
});
