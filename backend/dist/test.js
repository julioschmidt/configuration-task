"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("./index");
const globals_1 = require("@jest/globals");
const jest_mock_extended_1 = require("jest-mock-extended");
const bcrypt = __importStar(require("bcryptjs"));
// Mock de Nodemailer
globals_1.jest.mock('nodemailer');
// Mock do Prisma Client
const prismaMock = (0, jest_mock_extended_1.mockDeep)();
globals_1.jest.mock('@prisma/client', () => {
    return {
        PrismaClient: globals_1.jest.fn(() => prismaMock),
    };
});
describe('Testes do servidor Express', () => {
    beforeEach(() => {
        globals_1.jest.clearAllMocks();
    });
    it('Deve responder com status 200 na rota raiz', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app).get('/');
        expect(res.status).toBe(200);
    }));
    it('Deve criar uma tarefa', () => __awaiter(void 0, void 0, void 0, function* () {
        const novaTarefa = { descricao: 'Tarefa Teste', data_prevista: new Date() };
        prismaMock.tarefa.create.mockResolvedValueOnce(Object.assign(Object.assign({ id: 1 }, novaTarefa), { data_criacao: new Date(), situacao: 'Pendente', data_encerramento: null }));
        const res = yield (0, supertest_1.default)(index_1.app)
            .post('/tarefas')
            .send(novaTarefa);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('descricao', 'Tarefa Teste');
    }));
    it('Deve retornar erro 400 ao criar tarefa sem dados obrigatórios', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .post('/tarefas')
            .send({ descricao: '' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Dados obrigatórios faltando');
    }));
    it('Deve listar todas as tarefas', () => __awaiter(void 0, void 0, void 0, function* () {
        prismaMock.tarefa.findMany.mockResolvedValueOnce([
            { id: 1, descricao: 'Tarefa 1', situacao: 'Pendente', data_criacao: new Date(), data_prevista: new Date(), data_encerramento: null },
            { id: 2, descricao: 'Tarefa 2', situacao: 'Concluída', data_criacao: new Date(), data_prevista: new Date(), data_encerramento: new Date() },
        ]);
        const res = yield (0, supertest_1.default)(index_1.app).get('/tarefas');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
    }));
    it('Deve buscar uma tarefa por ID', () => __awaiter(void 0, void 0, void 0, function* () {
        const tarefa = { id: 1, descricao: 'Tarefa Teste', situacao: 'Pendente', data_criacao: new Date(), data_prevista: new Date(), data_encerramento: null };
        prismaMock.tarefa.findUnique.mockResolvedValueOnce(tarefa);
        const res = yield (0, supertest_1.default)(index_1.app).get('/tarefas/1');
        expect(res.status).toBe(200);
        expect(res.body).toEqual(tarefa);
    }));
    it('Deve retornar erro 404 quando a tarefa não for encontrada', () => __awaiter(void 0, void 0, void 0, function* () {
        prismaMock.tarefa.findUnique.mockResolvedValueOnce(null);
        const res = yield (0, supertest_1.default)(index_1.app).get('/tarefas/999');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Tarefa não encontrada');
    }));
    it('Deve atualizar uma tarefa', () => __awaiter(void 0, void 0, void 0, function* () {
        const tarefaAtualizada = { descricao: 'Tarefa Atualizada', data_prevista: new Date(), data_criacao: new Date(), data_encerramento: null, situacao: 'Pendente' };
        prismaMock.tarefa.update.mockResolvedValueOnce(Object.assign({ id: 1 }, tarefaAtualizada));
        const res = yield (0, supertest_1.default)(index_1.app)
            .put('/tarefas/1')
            .send(tarefaAtualizada);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('descricao', 'Tarefa Atualizada');
    }));
    it('Deve encerrar uma tarefa', () => __awaiter(void 0, void 0, void 0, function* () {
        const tarefaEncerrada = { id: 1, situacao: 'Concluída', data_encerramento: new Date(), data_criacao: new Date(), data_prevista: new Date(), descricao: 'Tarefa Teste' };
        prismaMock.tarefa.update.mockResolvedValueOnce(tarefaEncerrada);
        const res = yield (0, supertest_1.default)(index_1.app).put('/tarefas/1/encerrar');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('situacao', 'Concluída');
    }));
    it('Deve excluir uma tarefa', () => __awaiter(void 0, void 0, void 0, function* () {
        prismaMock.tarefa.delete.mockResolvedValueOnce({ id: 1, descricao: 'Tarefa excluída', situacao: 'Pendente', data_criacao: new Date(), data_prevista: new Date(), data_encerramento: null });
        const res = yield (0, supertest_1.default)(index_1.app).delete('/tarefas/1');
        expect(res.status).toBe(204);
    }));
    it('Deve registrar um usuário', () => __awaiter(void 0, void 0, void 0, function* () {
        const usuario = { nome: 'usuario_teste', senha: 'senha123' };
        prismaMock.usuario.create.mockResolvedValueOnce(Object.assign({ id: 1 }, usuario));
        const res = yield (0, supertest_1.default)(index_1.app)
            .post('/register')
            .send(usuario);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message', 'Usuário registrado com sucesso.');
    }));
    it('Deve retornar erro 400 ao registrar um usuário sem dados obrigatórios', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, supertest_1.default)(index_1.app)
            .post('/register')
            .send({ nome: '' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'Nome e senha são obrigatórios.');
    }));
    it('Deve fazer login com sucesso', () => __awaiter(void 0, void 0, void 0, function* () {
        const usuario = { nome: 'usuario_teste', senha: 'senha123' };
        prismaMock.usuario.findUnique.mockResolvedValueOnce(Object.assign({ id: 1 }, usuario));
        globals_1.jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
        const res = yield (0, supertest_1.default)(index_1.app)
            .post('/login')
            .send(usuario);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Login realizado com sucesso.');
    }));
    it('Deve falhar no login com credenciais inválidas', () => __awaiter(void 0, void 0, void 0, function* () {
        const usuario = { nome: 'usuario_teste', senha: 'senha_errada' };
        prismaMock.usuario.findUnique.mockResolvedValueOnce({ id: 1, nome: 'usuario_teste', senha: 'senha123' });
        globals_1.jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
        const res = yield (0, supertest_1.default)(index_1.app)
            .post('/login')
            .send(usuario);
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error', 'Usuário ou senha inválidos.');
    }));
    it('Deve gerar o PDF corretamente', () => __awaiter(void 0, void 0, void 0, function* () {
        const resultadoPdf = { caminho: '/path/to/pdf', nome: 'relatorio.pdf' };
        prismaMock.tarefa.findMany.mockResolvedValueOnce([
            { id: 1, descricao: 'Tarefa 1', situacao: 'Pendente', data_criacao: new Date(), data_prevista: new Date(), data_encerramento: null },
        ]);
        const res = yield (0, supertest_1.default)(index_1.app).get('/tarefas/relatorio/pdf');
        expect(res.status).toBe(200);
        expect(res.headers['content-disposition']).toContain('attachment; filename=relatorio.pdf');
    }));
});
