"use strict";
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
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("./prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
exports.app = app;
const port = 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json()); // Necessário para ler JSON no body das requisições
// Configuração do nodemailer (para envio de emails)
const transporter = nodemailer_1.default.createTransport({
    service: "gmail", // Altere para o serviço de email que você usa
    auth: {
        user: "huliio.schmidt@gmail.com", // Substitua pelo seu email
        pass: "svos kxwq vjgr xaie", // Substitua pela sua senha ou app password
    },
});
// Função para enviar email
function enviarEmail(destinatario, assunto, conteudo) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const info = yield transporter.sendMail({
                from: '"Sistema de Tarefas" <huliio.schmidt@gmail.com>',
                to: destinatario,
                subject: assunto,
                html: conteudo,
            });
            console.log("Email enviado:", info.messageId);
            return true;
        }
        catch (error) {
            console.error("Erro ao enviar email:", error);
            return false;
        }
    });
}
// Função para notificar sobre criação de tarefa
function notificarCriacaoTarefa(tarefa) {
    return __awaiter(this, void 0, void 0, function* () {
        const conteudo = `
    <h1>Nova Tarefa Criada</h1>
    <p><strong>Descrição:</strong> ${tarefa.descricao}</p>
    <p><strong>Data de Criação:</strong> ${new Date(tarefa.data_criacao).toLocaleDateString()}</p>
    <p><strong>Data Prevista:</strong> ${tarefa.data_prevista ? new Date(tarefa.data_prevista).toLocaleDateString() : 'Não definida'}</p>
    <p><strong>Situação:</strong> ${tarefa.situacao}</p>
  `;
        return yield enviarEmail("julio.schmidt@universo.univates.br", "Nova Tarefa Criada", conteudo);
    });
}
// Função para notificar sobre atualização de tarefa
function notificarAtualizacaoTarefa(tarefa) {
    return __awaiter(this, void 0, void 0, function* () {
        const conteudo = `
    <h1>Tarefa Atualizada</h1>
    <p><strong>Descrição:</strong> ${tarefa.descricao}</p>
    <p><strong>Data de Criação:</strong> ${new Date(tarefa.data_criacao).toLocaleDateString()}</p>
    <p><strong>Data Prevista:</strong> ${tarefa.data_prevista ? new Date(tarefa.data_prevista).toLocaleDateString() : 'Não definida'}</p>
    <p><strong>Situação:</strong> ${tarefa.situacao}</p>
    ${tarefa.data_encerramento ? `<p><strong>Data de Encerramento:</strong> ${new Date(tarefa.data_encerramento).toLocaleDateString()}</p>` : ''}
  `;
        return yield enviarEmail("julio.schmidt@universo.univates.br", "Tarefa Atualizada", conteudo);
    });
}
// Função para gerar PDF com todas as tarefas
function gerarPDFTarefas() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                // Buscar todas as tarefas
                const tarefas = yield prisma_1.default.tarefa.findMany({
                    orderBy: { data_criacao: 'desc' }
                });
                // Criar diretório para PDFs se não existir
                const diretorio = path_1.default.join(__dirname, 'pdfs');
                if (!fs_1.default.existsSync(diretorio)) {
                    fs_1.default.mkdirSync(diretorio);
                }
                // Nome do arquivo com timestamp para evitar sobrescrita
                const nomeArquivo = `tarefas_${Date.now()}.pdf`;
                const caminhoArquivo = path_1.default.join(diretorio, nomeArquivo);
                // Criar o documento PDF
                const doc = new pdfkit_1.default();
                const stream = fs_1.default.createWriteStream(caminhoArquivo);
                // Pipe do documento para o arquivo
                doc.pipe(stream);
                // Cabeçalho do PDF
                doc.fontSize(20).text('Relatório de Tarefas', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12).text(`Data de geração: ${new Date().toLocaleString()}`, { align: 'center' });
                doc.moveDown(2);
                // Adicionar cada tarefa ao PDF
                tarefas.forEach((tarefa, index) => {
                    // Separador entre tarefas (exceto para a primeira)
                    if (index > 0) {
                        doc.moveDown()
                            .text('----------------------------------------')
                            .moveDown();
                    }
                    doc.fontSize(14).text(`Tarefa #${tarefa.id}`);
                    doc.fontSize(12).text(`Descrição: ${tarefa.descricao}`);
                    doc.text(`Data de Criação: ${new Date(tarefa.data_criacao).toLocaleString()}`);
                    if (tarefa.data_prevista) {
                        doc.text(`Data Prevista: ${new Date(tarefa.data_prevista).toLocaleString()}`);
                    }
                    if (tarefa.data_encerramento) {
                        doc.text(`Data de Encerramento: ${new Date(tarefa.data_encerramento).toLocaleString()}`);
                    }
                    doc.text(`Situação: ${tarefa.situacao}`);
                });
                // Finalizar o documento
                doc.end();
                // Quando o stream for fechado, o PDF está pronto
                stream.on('finish', () => {
                    resolve({
                        caminho: caminhoArquivo,
                        nome: nomeArquivo
                    });
                });
                stream.on('error', (err) => {
                    reject(err);
                });
            }
            catch (error) {
                reject(error);
            }
        }));
    });
}
// READ - listar todas as tarefas
app.get("/tarefas", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tarefas = yield prisma_1.default.tarefa.findMany();
        res.json(tarefas);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar tarefas" });
    }
}));
// CREATE - criar nova tarefa
app.post("/tarefas", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { descricao, data_prevista } = req.body;
    try {
        const novaTarefa = yield prisma_1.default.tarefa.create({
            data: { descricao, data_criacao: new Date(), data_prevista, data_encerramento: null, situacao: "Pendente" },
        });
        // Enviar email de notificação
        yield notificarCriacaoTarefa(novaTarefa);
        res.status(201).json(novaTarefa);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar tarefa" });
    }
}));
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nome, senha } = req.body;
    try {
        if (!nome || !senha) {
            res.status(400).json({ error: "Nome e senha são obrigatórios." });
            return;
        }
        const usuarioExistente = yield prisma_1.default.usuario.findUnique({ where: { nome } });
        if (usuarioExistente) {
            res.status(409).json({ error: "Usuário já existe." });
            return;
        }
        const hashedSenha = yield bcryptjs_1.default.hash(senha, 10);
        const usuario = yield prisma_1.default.usuario.create({
            data: {
                nome,
                senha: hashedSenha,
            },
        });
        res.status(201).json({ data: usuario, message: "Usuário registrado com sucesso." });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao registrar usuário" });
    }
}));
// Login de usuário
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nome, senha } = req.body;
    const usuario = yield prisma_1.default.usuario.findUnique({ where: { nome } });
    if (!usuario) {
        res.status(401).json({ error: "Usuário ou senha inválidos." });
        return;
    }
    const senhaValida = yield bcryptjs_1.default.compare(senha, usuario.senha);
    if (!senhaValida) {
        res.status(401).json({ error: "Usuário ou senha inválidos." });
        return;
    }
    res.json({ message: "Login realizado com sucesso." });
}));
// READ - buscar tarefa por ID
app.get("/tarefas/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const tarefa = yield prisma_1.default.tarefa.findUnique({
            where: { id: Number(id) },
        });
        if (tarefa) {
            res.json(tarefa);
        }
        else {
            res.status(404).json({ error: "Tarefa não encontrada" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar tarefa" });
    }
}));
// UPDATE - atualizar tarefa por ID
app.put("/tarefas/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { descricao, data_prevista } = req.body;
    try {
        const tarefaAtualizada = yield prisma_1.default.tarefa.update({
            where: { id: Number(id) },
            data: { descricao, data_prevista },
        });
        // Enviar email de notificação
        yield notificarAtualizacaoTarefa(tarefaAtualizada);
        res.json(tarefaAtualizada);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar tarefa" });
    }
}));
app.put("/tarefas/:id/encerrar", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const tarefaEncerrada = yield prisma_1.default.tarefa.update({
            where: { id: Number(id) },
            data: { data_encerramento: new Date(), situacao: "Concluída" },
        });
        // Enviar email de notificação
        yield notificarAtualizacaoTarefa(tarefaEncerrada);
        res.json(tarefaEncerrada);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao encerrar tarefa" });
    }
}));
// DELETE - deletar tarefa por ID
app.delete("/tarefas/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma_1.default.tarefa.delete({
            where: { id: Number(id) },
        });
        res.status(204).send(); // No content
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao deletar tarefa" });
    }
}));
// NOVA ROTA: Gerar PDF com todas as tarefas
app.get("/tarefas/relatorio/pdf", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resultado = yield gerarPDFTarefas();
        // Configurar o cabeçalho para download do arquivo
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${resultado.nome}`);
        // Enviar o arquivo
        const fileStream = fs_1.default.createReadStream(resultado.caminho);
        fileStream.pipe(res);
        // Opcional: remover o arquivo após o envio para economizar espaço
        fileStream.on('end', () => {
            fs_1.default.unlinkSync(resultado.caminho);
        });
    }
    catch (error) {
        console.error("Erro ao gerar PDF:", error);
        res.status(500).json({ error: "Erro ao gerar relatório PDF" });
    }
}));
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
