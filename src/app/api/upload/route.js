import { NextResponse } from "next/server";
import csv from "csv-parser";
import { Readable } from "stream";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { obterIP } from "../../lib/auditoria";
import { sendProgress } from "./progress-utils.js";
import {
  UsuarioService,
  InventarioService,
  ItemInventarioService,
  SalaService,
  ServidorService,
  CabecalhoService,
  AuditoriaService,
} from "../../../lib/services.js";

function sanitizeName(name) {
  return name.toLowerCase().replace(/\s+/g, "");
}

export async function POST(request) {
  // Verificar autenticação
  const session = await getServerSession(authOptions);

  if (!session) {
    await AuditoriaService.log("ACESSO_NEGADO_UPLOAD", null, {
      ip: obterIP(request),
      motivo: "Usuario nao autenticado",
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const responsavel = formData.get("responsavel");
  const sessionId =
    formData.get("sessionId") || `upload-${Date.now()}-${Math.random()}`;

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

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Cria nome único do inventário
    const timestamp = Date.now();
    const nomeInventario = `Inventario-${timestamp}-${sanitizeName(nomeUsuarioAutenticado)}`;
    const nomeExibicao = nomeUsuarioAutenticado
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim();

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
      // Se o tipo não ser suportado
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado. Use .csv ou .json." },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: "Arquivo vazio ou sem dados válidos." },
        { status: 400 }
      );
    }
    // --- Fim da lógica de processamento de arquivo ---

    // === SALVAR NO BANCO DE DADOS ===

    // Enviar progresso inicial
    sendProgress(sessionId, {
      type: "progress",
      stage: "starting",
      message: "Iniciando processamento do inventário...",
      progress: 0,
      total: records.length,
    });

    // 1. Criar o inventário
    console.log(`[UPLOAD] Criando inventário: ${nomeInventario}`);
    const inventario = await InventarioService.create(
      nomeInventario,
      nomeExibicao,
      session.user.email
    );

    sendProgress(sessionId, {
      type: "progress",
      stage: "inventory_created",
      message: `Inventário "${nomeExibicao}" criado com sucesso`,
      progress: 0,
      total: records.length,
    });

    // 2. Extrair e salvar cabeçalhos
    const headers = records.length > 0 ? Object.keys(records[0]) : [];
    console.log(`[UPLOAD] Salvando ${headers.length} cabeçalhos...`);
    await CabecalhoService.createMany(nomeInventario, headers);

    sendProgress(sessionId, {
      type: "progress",
      stage: "headers_saved",
      message: `${headers.length} cabeçalhos salvos`,
      progress: 0,
      total: records.length,
    });

    // 3. Extrair e salvar salas únicas
    const salaSet = new Set(records.map((r) => r.SALA).filter(Boolean));
    const salasArray = [...salaSet];
    console.log(`[UPLOAD] Salvando ${salasArray.length} salas...`);
    await SalaService.createMany(nomeInventario, salasArray);

    sendProgress(sessionId, {
      type: "progress",
      stage: "rooms_saved",
      message: `${salasArray.length} salas únicas salvas`,
      progress: 0,
      total: records.length,
    });

    // 4. Extrair e salvar servidores únicos do campo "carga_atual"
    const servidorSet = new Set(
      records.map((r) => r["CARGA_ATUAL"]).filter(Boolean)
    );
    const servidoresArray = [...servidorSet];
    console.log(`[UPLOAD] Salvando ${servidoresArray.length} servidores...`);
    await ServidorService.createMany(nomeInventario, servidoresArray);

    sendProgress(sessionId, {
      type: "progress",
      stage: "servers_saved",
      message: `${servidoresArray.length} servidores únicos salvos`,
      progress: 0,
      total: records.length,
    });

    // 5. Salvar itens do inventário
    console.log(`[UPLOAD] Salvando ${records.length} itens...`);
    let itensSalvos = 0;
    let errosItens = 0;

    sendProgress(sessionId, {
      type: "progress",
      stage: "saving_items",
      message: `Iniciando salvamento de ${records.length} itens...`,
      progress: 0,
      total: records.length,
    });

    for (const item of records) {
      try {
        await ItemInventarioService.create(nomeInventario, item);
        itensSalvos++;

        if (itensSalvos % 50 === 0) {
          console.log(
            `[UPLOAD] ${itensSalvos}/${records.length} itens salvos...`
          );

          sendProgress(sessionId, {
            type: "progress",
            stage: "saving_items",
            message: `${itensSalvos}/${records.length} itens salvos...`,
            progress: itensSalvos,
            total: records.length,
          });
        }
      } catch (error) {
        errosItens++;
        console.warn(
          `[UPLOAD] Erro ao salvar item ${item.NUMERO}:`,
          error.message
        );
      }
    }

    // Progresso final dos itens
    sendProgress(sessionId, {
      type: "progress",
      stage: "items_saved",
      message: `Itens salvos: ${itensSalvos}, Erros: ${errosItens}`,
      progress: itensSalvos,
      total: records.length,
    });

    // 5. Extrair setores para estatísticas
    const setorSet = new Set(
      records.map((r) => r["SETOR DO RESPONSÁVEL"]).filter(Boolean)
    );

    // 6. Log detalhado de auditoria
    await AuditoriaService.log(
      "UPLOAD_INVENTARIO",
      session.user,
      {
        ip: obterIP(request),
        arquivo: {
          nome: file.name,
          tamanho: file.size,
          tipo: file.type,
        },
        processamento: {
          totalRegistros: records.length,
          itensSalvos,
          errosItens,
          totalSalas: salaSet.size,
          totalSetores: setorSet.size,
          nomeInventario,
          nomeExibicao,
        },
        userAgent: request.headers.get("user-agent") || "N/A",
      },
      nomeInventario
    );

    // Log no servidor para auditoria
    console.log(
      `[UPLOAD] ${session.user?.name || session.user?.email} criou inventário ${nomeInventario} com ${itensSalvos} itens`
    );

    // Enviar progresso de conclusão
    sendProgress(sessionId, {
      type: "completed",
      stage: "finished",
      message: `Upload concluído com sucesso! ${itensSalvos} itens salvos.`,
      progress: itensSalvos,
      total: records.length,
      inventario: {
        nome: nomeInventario,
        nomeExibicao: nomeExibicao,
      },
      stats: {
        registros: itensSalvos,
        erros: errosItens,
        salas: salaSet.size,
        setores: setorSet.size,
        servidores: servidoresArray.length,
      },
    });

    return NextResponse.json({
      message: "Inventário criado com sucesso!",
      inventario: {
        nome: nomeInventario,
        nomeExibicao: nomeExibicao,
      },
      info: {
        registros: itensSalvos,
        erros: errosItens,
        salas: salaSet.size,
        setores: setorSet.size,
        servidores: servidoresArray.length,
      },
    });
  } catch (error) {
    console.error("[UPLOAD] Erro durante processamento:", error);

    // Enviar progresso de erro
    sendProgress(sessionId, {
      type: "error",
      stage: "error",
      message: `Erro durante o processamento: ${error.message}`,
      error: error.message,
    });

    // Log do erro
    await AuditoriaService.log("ERRO_UPLOAD_INVENTARIO", session.user, {
      ip: obterIP(request),
      erro: error.message,
      arquivo: file?.name,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    );
  }
}
