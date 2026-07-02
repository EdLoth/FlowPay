import { prisma } from '../infra/database/prisma/client';

export async function limparBanco() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE outbox_events, atendimentos, atendentes, times RESTART IDENTITY CASCADE;',
  );
}

export async function seedTimesEAtendentes() {
  const cartoes = await prisma.time.create({ data: { nome: 'Cartões' } });
  const emprestimos = await prisma.time.create({ data: { nome: 'Empréstimos' } });
  const outros = await prisma.time.create({ data: { nome: 'Outros Assuntos' } });

  const atendente1 = await prisma.atendente.create({
    data: { nome: 'Ana Teste', timeId: cartoes.id },
  });
  const atendente2 = await prisma.atendente.create({
    data: { nome: 'Bruno Teste', timeId: cartoes.id },
  });

  return { cartoes, emprestimos, outros, atendente1, atendente2 };
}
