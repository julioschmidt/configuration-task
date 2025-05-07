-- AlterTable
CREATE SEQUENCE tarefa_id_seq;
ALTER TABLE "Tarefa" ALTER COLUMN "id" SET DEFAULT nextval('tarefa_id_seq');
ALTER SEQUENCE tarefa_id_seq OWNED BY "Tarefa"."id";
