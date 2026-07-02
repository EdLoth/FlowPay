import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { criarApp } from '../../../app';
import { prisma } from '../../../infra/database/prisma/client';
import { limparBanco, seedTimesEAtendentes } from '../../../test/setupIntegration';

const app = criarApp();

describe('Endpoints REST (integração com Postgres real)', () => {
  beforeEach(async () => {
    await limparBanco();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /atendimentos cria um atendimento e atribui a um atendente disponível', async () => {
    await seedTimesEAtendentes();

    const resposta = await request(app)
      .post('/atendimentos')
      .send({ assunto: 'Problemas com cartão' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.status).toBe('EM_ATENDIMENTO');
    expect(resposta.body.atendenteId).not.toBeNull();
  });

  it('POST /atendimentos retorna 400 quando o assunto está ausente', async () => {
    const resposta = await request(app).post('/atendimentos').send({});
    expect(resposta.status).toBe(400);
  });

  it('GET /atendimentos lista os atendimentos criados', async () => {
    await seedTimesEAtendentes();
    await request(app).post('/atendimentos').send({ assunto: 'Problemas com cartão' });

    const resposta = await request(app).get('/atendimentos');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toHaveLength(1);
  });

  it('GET /atendentes lista os atendentes com ocupação calculada', async () => {
    await seedTimesEAtendentes();
    await request(app).post('/atendimentos').send({ assunto: 'Problemas com cartão' });

    const resposta = await request(app).get('/atendentes');

    expect(resposta.status).toBe(200);
    const comAtendimento = resposta.body.find(
      (a: { atendimentosAtivos: number }) => a.atendimentosAtivos > 0,
    );
    expect(comAtendimento).toBeDefined();
  });

  it('PATCH /atendimentos/:id/finalizar marca o atendimento como finalizado', async () => {
    await seedTimesEAtendentes();
    const criado = await request(app)
      .post('/atendimentos')
      .send({ assunto: 'Problemas com cartão' });

    const resposta = await request(app).patch(`/atendimentos/${criado.body.id}/finalizar`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe('FINALIZADO');
  });
});
