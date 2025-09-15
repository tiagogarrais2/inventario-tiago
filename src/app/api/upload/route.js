import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

function sanitizeName(name) {
  return name.toLowerCase().replace(/\s+/g, "");
}

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const responsavel = formData.get("responsavel");

  if (!file || typeof file === "string" || !responsavel) {
    return NextResponse.json({ error: "Arquivo ou responsável não enviado." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Cria nome da pasta: timestamp_nome
  const timestamp = Date.now();
  const nomePasta = `${timestamp}_${sanitizeName(responsavel)}`;
  const dir = path.join(process.cwd(), "inventarios", nomePasta);
  await mkdir(dir, { recursive: true });

  // Salva o arquivo JSON recebido
  const jsonPath = path.join(dir, file.name);
  await writeFile(jsonPath, buffer);

  // Lê e processa o conteúdo JSON
  let records;
  try {
    records = JSON.parse(buffer.toString("utf-8"));
  } catch (err) {
    return NextResponse.json({
      error: "Erro ao processar JSON: " + err.message
    }, { status: 400 });
  }

  // Extrai e salva cabeçalhos
  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  const headersPath = path.join(dir, "cabecalhos.json");
  await writeFile(headersPath, JSON.stringify(headers, null, 2));

  // Extrai e salva lista de salas únicas
  // Supondo que o campo seja chamado "Sala" (ajuste se necessário)
  const salaSet = new Set(records.map(r => r.SALA).filter(Boolean));
  const salasPath = path.join(dir, "salas.json");
  await writeFile(salasPath, JSON.stringify([...salaSet], null, 2));

  return NextResponse.json({ message: "Processamento concluído!" });
}