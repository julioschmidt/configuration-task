/*
  Warnings:

  - A unique constraint covering the columns `[nome]` on the table `Usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Tarefa" ADD COLUMN     "teste" TEXT,
ALTER COLUMN "data_criacao" DROP NOT NULL,
ALTER COLUMN "data_prevista" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_nome_key" ON "Usuario"("nome");
