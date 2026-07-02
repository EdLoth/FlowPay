import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL as string;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const times = await Promise.all([
    prisma.time.upsert({
      where: { nome: 'Cartões' },
      update: {},
      create: { nome: 'Cartões' },
    }),
    prisma.time.upsert({
      where: { nome: 'Empréstimos' },
      update: {},
      create: { nome: 'Empréstimos' },
    }),
    prisma.time.upsert({
      where: { nome: 'Outros Assuntos' },
      update: {},
      create: { nome: 'Outros Assuntos' },
    }),
  ]);

  const [cartoes, emprestimos, outros] = times;

  await prisma.atendente.createMany({
    data: [
      { nome: 'Ana Souza', timeId: cartoes.id },
      { nome: 'Bruno Lima', timeId: cartoes.id },
      { nome: 'Carla Dias', timeId: emprestimos.id },
      { nome: 'Diego Alves', timeId: emprestimos.id },
      { nome: 'Elisa Rocha', timeId: outros.id },
      { nome: 'Fábio Nunes', timeId: outros.id },
    ],
    skipDuplicates: true,
  });

  console.log('Seed concluído: 3 times e 6 atendentes.');
}

main()
  .catch((error) => {
    console.error('Erro ao rodar o seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
