-- CreateTable
CREATE TABLE "Tarefa" (
    "id" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "data_criacao" TIMESTAMP(3) NOT NULL,
    "data_prevista" TIMESTAMP(3) NOT NULL,
    "data_encerramento" TIMESTAMP(3) NOT NULL,
    "situacao" TEXT NOT NULL,

    CONSTRAINT "Tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tarefa_id_key" ON "Tarefa"("id");
