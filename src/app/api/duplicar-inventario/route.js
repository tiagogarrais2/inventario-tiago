import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { obterIP } from "../../lib/auditoria";
import {
  UsuarioService,
  InventarioService,
  AuditoriaService,
} from "../../../lib/services.js";

export async function POST(request) {
  // Verificar autenticação
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    const { inventario: nomeInventario, novoNomeExibicao } =
      await request.json();

    if (!nomeInventario) {
      return NextResponse.json(
        { error: "Nome do inventário de origem é obrigatório." },
        { status: 400 }
      );
    }

    // Verificar se o inventário de origem existe
    const inventarioOrigem =
      await InventarioService.findByName(nomeInventario);

    if (!inventarioOrigem) {
      return NextResponse.json(
        { error: "Inventário de origem não encontrado." },
        { status: 404 }
      );
    }

    // Verificar se o usuário é proprietário do inventário
    const usuario = await UsuarioService.findOrCreateFromSession(session.user);

    if (inventarioOrigem.proprietarioId !== usuario.id) {
      await AuditoriaService.log("ACESSO_NEGADO_DUPLICACAO", session.user, {
        ip: obterIP(request),
        inventario: nomeInventario,
        motivo: "Usuario nao e proprietario",
        userAgent: request.headers.get("user-agent") || "N/A",
      });

      return NextResponse.json(
        { error: "Apenas o proprietário pode duplicar o inventário." },
        { status: 403 }
      );
    }

    // Executar a duplicação
    const novoInventario = await InventarioService.duplicar(
      nomeInventario,
      novoNomeExibicao,
      session.user.email
    );

    // Log de auditoria
    await AuditoriaService.log("DUPLICACAO_INVENTARIO", session.user, {
      ip: obterIP(request),
      inventarioOrigem: nomeInventario,
      novoInventarioNome: novoInventario.nome,
      novoNomeExibicao: novoInventario.nomeExibicao,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    console.log(
      `[DUPLICACAO] ${session.user?.name || session.user?.email} duplicou inventário "${nomeInventario}" -> "${novoInventario.nome}"`
    );

    return NextResponse.json({
      message: "Inventário duplicado com sucesso!",
      novoInventario: {
        nome: novoInventario.nome,
        nomeExibicao: novoInventario.nomeExibicao,
      },
    });
  } catch (error) {
    console.error("[DUPLICACAO] Erro durante duplicação:", error);

    return NextResponse.json(
      { error: `Erro ao duplicar inventário: ${error.message}` },
      { status: 500 }
    );
  }
}
