-- CreateEnum
CREATE TYPE "StatusAtendimento" AS ENUM ('AGUARDANDO_FILA', 'EM_ATENDIMENTO', 'FINALIZADO');

-- CreateEnum
CREATE TYPE "StatusOutboxEvent" AS ENUM ('PENDENTE', 'PUBLICADO', 'FALHOU');

-- CreateTable
CREATE TABLE "times" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendentes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "time_id" TEXT NOT NULL,
    "capacidade_maxima" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "atendentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimentos" (
    "id" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "assunto_normalizado" TEXT NOT NULL,
    "time_id" TEXT NOT NULL,
    "atendente_id" TEXT,
    "status" "StatusAtendimento" NOT NULL DEFAULT 'AGUARDANDO_FILA',
    "idempotency_key" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atribuido_em" TIMESTAMP(3),
    "finalizado_em" TIMESTAMP(3),

    CONSTRAINT "atendimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "StatusOutboxEvent" NOT NULL DEFAULT 'PENDENTE',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicado_em" TIMESTAMP(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "times_nome_key" ON "times"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "atendimentos_idempotency_key_key" ON "atendimentos"("idempotency_key");

-- AddForeignKey
ALTER TABLE "atendentes" ADD CONSTRAINT "atendentes_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos" ADD CONSTRAINT "atendimentos_atendente_id_fkey" FOREIGN KEY ("atendente_id") REFERENCES "atendentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
