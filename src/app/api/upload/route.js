import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import csv from "csv-parser";
import { Readable } from "stream";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { logAuditoria, obterIP } from "../../lib/auditoria";

function sanitizeName(name) {
  return name.toLowerCase().replace(/\s+/g, "");
}

export async function POST(request) {
  // Verificar autenticação
  const session = await getServerSession(authOptions);

  if (!session) {
    await logAuditoria("ACESSO_NEGADO_UPLOAD", null, {
      ip: obterIP(request),
      motivo: "Usuario nao autenticado",
    });

    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const responsavel = formData.get("responsavel");

  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "Arquivo não enviado." },
      { status: 400 }
    );
  }

  // Usar o nome do usuário autenticado em vez do enviado pelo formulário
  const nomeUsuarioAutenticado =
    session.user?.name || session.user?.email || "usuario-nao-identificado";

  // Validar se o responsável enviado corresponde ao usuário autenticado
  if (responsavel !== nomeUsuarioAutenticado) {
    return NextResponse.json(
      {
        error:
          "Erro de segurança: Nome do responsável não corresponde ao usuário autenticado.",
      },
      { status: 403 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Cria nome da pasta: timestamp_nome (usando nome do usuário autenticado)
  const timestamp = Date.now();
  const nomePasta = `inventario-${timestamp}-${sanitizeName(nomeUsuarioAutenticado)}`;
  const dir = path.join(process.cwd(), "public", nomePasta);
  await mkdir(dir, { recursive: true });

  let records = [];

  // --- Lógica de detecção e processamento de arquivo ---
  const fileName = file.name || "";
  if (fileName.endsWith(".json")) {
    // Processa como JSON
    try {
      records = JSON.parse(buffer.toString("utf-8"));
    } catch (err) {
      return NextResponse.json(
        {
          error: "Erro ao processar JSON. Verifique a formatação.",
        },
        { status: 400 }
      );
    }
  } else if (fileName.endsWith(".csv")) {
    // Processa como CSV
    try {
      const readableStream = Readable.from(buffer.toString("utf-8"));

      await new Promise((resolve, reject) => {
        readableStream
          .pipe(csv())
          .on("data", (data) => records.push(data))
          .on("end", () => resolve())
          .on("error", (err) => reject(err));
      });
    } catch (err) {
      return NextResponse.json(
        {
          error: "Erro ao processar CSV. Verifique o formato.",
        },
        { status: 400 }
      );
    }
  } else {
    // Se o tipo não for suportado
    return NextResponse.json(
      { error: "Tipo de arquivo não suportado. Use .csv ou .json." },
      { status: 400 }
    );
  }
  // --- Fim da lógica de processamento de arquivo ---

  // Salva o arquivo JSON convertido
  const jsonPath = path.join(dir, "inventario.json");
  await writeFile(jsonPath, JSON.stringify(records, null, 2));

  // Extrai e salva cabeçalhos
  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  const headersPath = path.join(dir, "cabecalhos.json");
  await writeFile(headersPath, JSON.stringify(headers, null, 2));

  // Extrai e salva lista de salas únicas
  const salaSet = new Set(records.map((r) => r.SALA).filter(Boolean));
  const salasPath = path.join(dir, "salas.json");
  await writeFile(salasPath, JSON.stringify([...salaSet], null, 2));

  // Extrai e salva lista única de setores
  const setorSet = new Set(
    records.map((r) => r["SETOR DO RESPONSÁVEL"]).filter(Boolean)
  );
  const setoresPath = path.join(dir, "setores.json");
  await writeFile(setoresPath, JSON.stringify([...setorSet], null, 2));

  // Salva informações de auditoria
  const auditInfo = {
    usuario: {
      nome: session.user?.name,
      email: session.user?.email,
      imagem: session.user?.image,
    },
    arquivo: {
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
    },
    processamento: {
      timestamp: new Date().toISOString(),
      timestampNumerico: timestamp,
      totalRegistros: records.length,
      totalSalas: salaSet.size,
      totalSetores: setorSet.size,
    },
  };

  const auditPath = path.join(dir, "auditoria.json");
  await writeFile(auditPath, JSON.stringify(auditInfo, null, 2));

  // Log detalhado de auditoria
  await logAuditoria("UPLOAD_INVENTARIO", session.user, {
    ip: obterIP(request),
    arquivo: {
      nome: file.name,
      tamanho: file.size,
      tipo: file.type,
    },
    processamento: {
      totalRegistros: records.length,
      totalSalas: salaSet.size,
      totalSetores: setorSet.size,
      nomePasta,
    },
    userAgent: request.headers.get("user-agent") || "N/A",
  });

  // Log no servidor para auditoria
  console.log(
    `[UPLOAD] ${session.user?.name || session.user?.email} enviou ${file.name} com ${records.length} registros`
  );

  return NextResponse.json({
    message: "Processamento concluído!",
    info: {
      registros: records.length,
      salas: salaSet.size,
      setores: setorSet.size,
    },
  });
}
