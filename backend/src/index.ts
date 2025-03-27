import cors from "cors";
import express, { Express, Request, Response } from "express";
import prisma from "./prisma";

const app: Express = express();
const port = 3000;

app.use(cors());

app.get("/", (req: Request, res: Response) => {
  prisma.tarefa.findMany().then((tarefas) => {
    res.json(tarefas);
  }).catch((error: unknown) => {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  })
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
