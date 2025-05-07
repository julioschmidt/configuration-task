import cors from "cors";
import express, { Express, Request, Response } from "express";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const app: Express = express();
const port = 3000;

app.use(cors());
app.use(express.json()); // Necessário para ler JSON no body das requisições

// Configuração do nodemailer (para envio de emails)
const transporter = nodemailer.createTransport({
  service: "gmail", // Altere para o serviço de email que você usa
  auth: {
    user: "huliio.schmidt@gmail.com", // Substitua pelo seu email
    pass: "svos kxwq vjgr xaie", // Substitua pela sua senha ou app password
  },
});

// Função para enviar email
async function enviarEmail(destinatario: string, assunto: string, conteudo: string) {
  try {
    const info = await transporter.sendMail({
      from: '"Sistema de Tarefas" <huliio.schmidt@gmail.com>',
      to: destinatario,
      subject: assunto,
      html: conteudo,
    });
    console.log("Email enviado:", info.messageId);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

// Função para notificar sobre criação de tarefa
async function notificarCriacaoTarefa(tarefa: any) {
  const conteudo = `
    <h1>Nova Tarefa Criada</h1>
    <p><strong>Descrição:</strong> ${tarefa.descricao}</p>
    <p><strong>Data de Criação:</strong> ${new Date(tarefa.data_criacao).toLocaleDateString()}</p>
    <p><strong>Data Prevista:</strong> ${tarefa.data_prevista ? new Date(tarefa.data_prevista).toLocaleDateString() : 'Não definida'}</p>
    <p><strong>Situação:</strong> ${tarefa.situacao}</p>
  `;

  return await enviarEmail("julio.schmidt@universo.univates.br", "Nova Tarefa Criada", conteudo);
}

// Função para notificar sobre atualização de tarefa
async function notificarAtualizacaoTarefa(tarefa: any) {
  const conteudo = `
    <h1>Tarefa Atualizada</h1>
    <p><strong>Descrição:</strong> ${tarefa.descricao}</p>
    <p><strong>Data de Criação:</strong> ${new Date(tarefa.data_criacao).toLocaleDateString()}</p>
    <p><strong>Data Prevista:</strong> ${tarefa.data_prevista ? new Date(tarefa.data_prevista).toLocaleDateString() : 'Não definida'}</p>
    <p><strong>Situação:</strong> ${tarefa.situacao}</p>
    ${tarefa.data_encerramento ? `<p><strong>Data de Encerramento:</strong> ${new Date(tarefa.data_encerramento).toLocaleDateString()}</p>` : ''}
  `;

  return await enviarEmail("julio.schmidt@universo.univates.br", "Tarefa Atualizada", conteudo);
}

// Função para gerar PDF com todas as tarefas
async function gerarPDFTarefas() {
  return new Promise(async (resolve, reject) => {
    try {
      // Buscar todas as tarefas
      const tarefas = await prisma.tarefa.findMany({
        orderBy: { data_criacao: 'desc' }
      });

      // Criar diretório para PDFs se não existir
      const diretorio = path.join(__dirname, 'pdfs');
      if (!fs.existsSync(diretorio)) {
        fs.mkdirSync(diretorio);
      }

      // Nome do arquivo com timestamp para evitar sobrescrita
      const nomeArquivo = `tarefas_${Date.now()}.pdf`;
      const caminhoArquivo = path.join(diretorio, nomeArquivo);

      // Criar o documento PDF
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(caminhoArquivo);

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
        doc.text(`Data de Criação: ${new Date(tarefa.data_criacao as Date).toLocaleString()}`);

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

    } catch (error) {
      reject(error);
    }
  });
}

// READ - listar todas as tarefas
app.get("/tarefas", async (req: Request, res: Response) => {
  try {
    const tarefas = await prisma.tarefa.findMany();
    res.json(tarefas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar tarefas" });
  }
});

// CREATE - criar nova tarefa
app.post("/tarefas", async (req: Request, res: Response) => {
  const { descricao, data_prevista } = req.body;

  try {

    if (!descricao || descricao === "" || !data_prevista) {
      throw ({
        code: 400,
        message: "Dados obrigatórios faltando"
      });
    }

    const novaTarefa = await prisma.tarefa.create({
      data: { descricao, data_criacao: new Date(), data_prevista, data_encerramento: null, situacao: "Pendente" },
    });

    // Enviar email de notificação
    await notificarCriacaoTarefa(novaTarefa);

    res.status(201).json(novaTarefa);
  } catch (error: any) {

    if (error.code === 400) {
      res.status(400).json({ error: error.message });
      return;
    } else {
      res.status(500).json({ error: "Erro ao criar tarefa" });

    }
  }
});

app.post("/register", async (req: Request, res: Response) => {
  const { nome, senha } = req.body;
  try {
    if (!nome || !senha) {
      res.status(400).json({ error: "Nome e senha são obrigatórios." });
      return;
    }

    const usuarioExistente = await prisma.usuario.findUnique({ where: { nome } });
    if (usuarioExistente) {
      res.status(409).json({ error: "Usuário já existe." });
      return;
    }

    const hashedSenha = await bcrypt.hash(senha, 10);
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        senha: hashedSenha,
      },
    });

    res.status(201).json({ data: usuario, message: "Usuário registrado com sucesso." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});

// Login de usuário
app.post("/login", async (req: Request, res: Response) => {
  const { nome, senha } = req.body;

  const usuario = await prisma.usuario.findUnique({ where: { nome } });

  if (!usuario) {
    res.status(401).json({ error: "Usuário ou senha inválidos." });
    return;
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);

  if (!senhaValida) {
    res.status(401).json({ error: "Usuário ou senha inválidos." });
    return;
  }

  res.json({ message: "Login realizado com sucesso." });
});

// READ - buscar tarefa por ID
app.get("/tarefas/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const tarefa = await prisma.tarefa.findUnique({
      where: { id: Number(id) },
    });
    if (tarefa) {
      res.json(tarefa);
    } else {
      res.status(404).json({ error: "Tarefa não encontrada" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar tarefa" });
  }
});

// UPDATE - atualizar tarefa por ID
app.put("/tarefas/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { descricao, data_prevista } = req.body;
  try {
    const tarefaAtualizada = await prisma.tarefa.update({
      where: { id: Number(id) },
      data: { descricao, data_prevista },
    });

    // Enviar email de notificação
    await notificarAtualizacaoTarefa(tarefaAtualizada);

    res.json(tarefaAtualizada);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar tarefa" });
  }
});

app.put("/tarefas/:id/encerrar", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const tarefaEncerrada = await prisma.tarefa.update({
      where: { id: Number(id) },
      data: { data_encerramento: new Date(), situacao: "Concluída" },
    });

    // Enviar email de notificação
    await notificarAtualizacaoTarefa(tarefaEncerrada);

    res.json(tarefaEncerrada);
  } catch (error) {
    res.status(500).json({ error: "Erro ao encerrar tarefa" });
  }
});

// DELETE - deletar tarefa por ID
app.delete("/tarefas/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.tarefa.delete({
      where: { id: Number(id) },
    });
    res.status(204).send(); // No content
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar tarefa" });
  }
});

// NOVA ROTA: Gerar PDF com todas as tarefas
app.get("/tarefas/relatorio/pdf", async (req: Request, res: Response) => {
  try {
    const resultado: any = await gerarPDFTarefas();

    // Configurar o cabeçalho para download do arquivo
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${resultado.nome}`);

    // Enviar o arquivo
    const fileStream = fs.createReadStream(resultado.caminho);
    fileStream.pipe(res);

    // Opcional: remover o arquivo após o envio para economizar espaço
    fileStream.on('end', () => {
      fs.unlinkSync(resultado.caminho);
    });

  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    res.status(500).json({ error: "Erro ao gerar relatório PDF" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export { app };