import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Cria um usuário
await prisma.tarefa.createMany({
    data: [
      {
        id: 1,
        descricao: 'Revisar documentação do projeto',
        data_criacao: new Date('2024-03-20'),
        data_prevista: new Date('2024-03-25'),
        data_encerramento: new Date('2024-03-24'),
        situacao: 'Concluída',
      },
      {
        id: 2,
        descricao: 'Desenvolver API de autenticação',
        data_criacao: new Date('2024-03-18'),
        data_prevista: new Date('2024-03-28'),
        data_encerramento: new Date('2024-03-27'),
        situacao: 'Concluída',
      },
      {
        id: 3,
        descricao: 'Corrigir bug no módulo de relatórios',
        data_criacao: new Date('2024-03-15'),
        data_prevista: new Date('2024-03-20'),
        data_encerramento: new Date('2024-03-19'),
        situacao: 'Concluída',
      },
      {
        id: 4,
        descricao: 'Implementar notificação por email',
        data_criacao: new Date('2024-03-10'),
        data_prevista: new Date('2024-03-18'),
        data_encerramento: new Date('2024-03-17'),
        situacao: 'Concluída',
      },
      {
        id: 5,
        descricao: 'Criar testes unitários para o serviço de pedidos',
        data_criacao: new Date('2024-03-22'),
        data_prevista: new Date('2024-03-30'),
        data_encerramento: new Date('2024-03-29'),
        situacao: 'Concluída',
      },
      {
        id: 6,
        descricao: 'Refatorar código do frontend',
        data_criacao: new Date('2024-03-19'),
        data_prevista: new Date('2024-03-27'),
        data_encerramento: new Date('2024-03-26'),
        situacao: 'Concluída',
      },
      {
        id: 7,
        descricao: 'Documentar endpoints da API',
        data_criacao: new Date('2024-03-12'),
        data_prevista: new Date('2024-03-22'),
        data_encerramento: new Date('2024-03-21'),
        situacao: 'Concluída',
      },
      {
        id: 8,
        descricao: 'Melhorar performance da consulta SQL',
        data_criacao: new Date('2024-03-21'),
        data_prevista: new Date('2024-03-26'),
        data_encerramento: new Date('2024-03-25'),
        situacao: 'Concluída',
      },
      {
        id: 9,
        descricao: 'Ajustar layout da página de login',
        data_criacao: new Date('2024-03-14'),
        data_prevista: new Date('2024-03-20'),
        data_encerramento: new Date('2024-03-20'),
        situacao: 'Concluída',
      },
      {
        id: 10,
        descricao: 'Configurar CI/CD no GitHub Actions',
        data_criacao: new Date('2024-03-17'),
        data_prevista: new Date('2024-03-24'),
        data_encerramento: new Date('2024-03-23'),
        situacao: 'Concluída',
      },
    ],
  });

}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });