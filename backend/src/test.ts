import request from 'supertest';
import { app } from './index';
import { PrismaClient } from '@prisma/client';
import { jest } from '@jest/globals';
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import bcrypt from "bcryptjs";
import prisma from './prisma';

import { MockContext, Context, createMockContext } from './context'
import { prismaMock } from './singleton';

let mockCtx: MockContext
let ctx: Context

// Mock de Nodemailer
jest.mock('nodemailer');


describe('Testes do servidor Express', () => {

    beforeEach(() => {
        mockCtx = createMockContext()
        ctx = mockCtx as unknown as Context
        jest.clearAllMocks()
      })

  it('Deve responder com status 200 na rota raiz', async () => {
    const res = await request(app).get('/tarefas');
    expect(res.status).toBe(200);
  });

  it('Deve criar uma tarefa', async () => {
    const novaTarefa = { descricao: 'Tarefa Teste', data_prevista: new Date() };
    prismaMock.tarefa.create.mockResolvedValueOnce({ id: 1, ...novaTarefa, data_criacao: new Date(), situacao: 'Pendente', data_encerramento: null });

    const res = await request(app)
      .post('/tarefas')
      .send(novaTarefa);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('descricao', 'Tarefa Teste');
  });


  it('Deve retornar erro 400 ao criar tarefa sem dados obrigatórios', async () => {
    const res = await request(app)
      .post('/tarefas')
      .send({ descricao: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Dados obrigatórios faltando');
  });

  it('Deve listar todas as tarefas', async () => {
    prismaMock.tarefa.findMany.mockResolvedValueOnce([
      { id: 1, descricao: 'Tarefa 1', situacao: 'Pendente', data_criacao: new Date(), data_prevista: new Date(), data_encerramento: null },
      { id: 2, descricao: 'Tarefa 2', situacao: 'Concluída', data_criacao: new Date(), data_prevista: new Date(), data_encerramento: new Date() },
    ]);

    const res = await request(app).get('/tarefas');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('Deve buscar uma tarefa por ID', async () => {
    const tarefa = { id: 1, descricao: 'Tarefa Teste', situacao: 'Pendente', data_criacao: new Date(), data_prevista: new Date(), data_encerramento: null };
    prismaMock.tarefa.findUnique.mockResolvedValueOnce(tarefa);

    const res = await request(app).get('/tarefas/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
        ...tarefa,
        data_criacao: tarefa.data_criacao?.toISOString(),
        data_prevista: tarefa.data_prevista?.toISOString(),
      });
  });

  it('Deve retornar erro 404 quando a tarefa não for encontrada', async () => {
    prismaMock.tarefa.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).get('/tarefas/999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Tarefa não encontrada');
  });

  it('Deve atualizar uma tarefa', async () => {
    const tarefaAtualizada = { descricao: 'Tarefa Atualizada', data_prevista: new Date(), data_criacao: new Date(), data_encerramento: null, situacao: 'Pendente' };
    prismaMock.tarefa.update.mockResolvedValueOnce({ id: 1, ...tarefaAtualizada });

    const res = await request(app)
      .put('/tarefas/1')
      .send(tarefaAtualizada);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('descricao', 'Tarefa Atualizada');
  });

  it('Deve encerrar uma tarefa', async () => {
    const tarefaEncerrada = { id: 1, situacao: 'Concluída', data_encerramento: new Date(), data_criacao: new Date(), data_prevista: new Date(), descricao: 'Tarefa Teste' };
    prismaMock.tarefa.update.mockResolvedValueOnce(tarefaEncerrada);

    const res = await request(app).put('/tarefas/1/encerrar');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('situacao', 'Concluída');
  });

  it('Deve excluir uma tarefa', async () => {
    prismaMock.tarefa.delete.mockResolvedValueOnce({ id: 1, descricao: 'Tarefa excluída', situacao: 'Pendente', data_criacao: new Date(), data_prevista: new Date(), data_encerramento: null });

    const res = await request(app).delete('/tarefas/1');
    expect(res.status).toBe(204);
  });

  it('Deve registrar um usuário', async () => {
    const usuario = { nome: 'usuario_teste', senha: 'senha123' };
    prismaMock.usuario.create.mockResolvedValueOnce({ id: 1, ...usuario });

    const res = await request(app)
      .post('/register')
      .send(usuario);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Usuário registrado com sucesso.');
  });

  it('Deve retornar erro 400 ao registrar um usuário sem dados obrigatórios', async () => {
    const res = await request(app)
      .post('/register')
      .send({ nome: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Nome e senha são obrigatórios.');
  });

  it('Deve fazer login com sucesso', async () => {
  const usuario = { nome: 'usuario_teste', senha: 'senha123' };
  prismaMock.usuario.findUnique.mockResolvedValueOnce({
    id: 1,
    nome: usuario.nome,
    senha: '$2b$10$qTByliEeTXLmwgdl9gX5duvRpLQw.NaDNVmOvhW/ZB6TX37PQk402'
  });
  const compareSpy = jest.spyOn(bcrypt, 'compare').mockImplementation(() =>
    Promise.resolve(true)
  );

  const res = await request(app)
    .post('/login')
    .send(usuario);

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('message', 'Login realizado com sucesso.');
  compareSpy.mockRestore();
});

  it('Deve falhar no login com credenciais inválidas', async () => {
    const usuario = { nome: 'usuario_teste', senha: 'senha_errada' };
    prismaMock.usuario.findUnique.mockResolvedValueOnce({ id: 1, nome: 'usuario_teste', senha: 'senha123' });

    const res = await request(app)
      .post('/login')
      .send(usuario);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Usuário ou senha inválidos.');
  });

  it('Deve gerar o PDF corretamente', async () => {
    const resultadoPdf = { caminho: '/path/to/pdf', nome: 'relatorio.pdf' };
    prismaMock.tarefa.findMany.mockResolvedValueOnce([
      { id: 1, descricao: 'Tarefa 1', situacao: 'Pendente', data_criacao: new Date(), data_prevista: new Date(), data_encerramento: null },
    ]);

    const res = await request(app).get('/tarefas/relatorio/pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/^attachment; filename=.*\.pdf$/);
  });

  it('Deve retornar erro 409 ao registrar um usuário já existente', async () => {
    const usuario = { nome: 'usuario_existente', senha: 'senha123' };
    prismaMock.usuario.findUnique.mockResolvedValueOnce({ id: 1, ...usuario });

    const res = await request(app)
      .post('/register')
      .send(usuario);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'Usuário já existe.');
  });

  it('Deve falhar no login com usuário inexistente', async () => {
    const usuario = { nome: 'usuario_inexistente', senha: 'senha123' };
    prismaMock.usuario.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/login')
      .send(usuario);

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Usuário ou senha inválidos.');
  });

  it('Deve retornar erro ao atualizar uma tarefa inexistente', async () => {
    const tarefaAtualizada = { descricao: 'Tarefa Atualizada', data_prevista: new Date() };
    prismaMock.tarefa.update.mockRejectedValueOnce(new Error('Tarefa não encontrada'));

    const res = await request(app)
      .put('/tarefas/999')
      .send(tarefaAtualizada);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Erro ao atualizar tarefa');
  });

  it('Deve retornar erro ao encerrar uma tarefa inexistente', async () => {
    prismaMock.tarefa.update.mockRejectedValueOnce(new Error('Tarefa não encontrada'));

    const res = await request(app).put('/tarefas/999/encerrar');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Erro ao encerrar tarefa');
  });

  it('Deve retornar erro ao excluir uma tarefa inexistente', async () => {
    prismaMock.tarefa.delete.mockRejectedValueOnce(new Error('Tarefa não encontrada'));

    const res = await request(app).delete('/tarefas/999');

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Erro ao deletar tarefa');
  });

  it('Deve retornar erro 500 ao criar tarefa com erro no banco', async () => {
    const novaTarefa = { descricao: 'Tarefa Teste', data_prevista: new Date() };
    prismaMock.tarefa.create.mockRejectedValueOnce(new Error('Erro no banco de dados'));

    const res = await request(app)
      .post('/tarefas')
      .send(novaTarefa);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Erro ao criar tarefa');
  });
});