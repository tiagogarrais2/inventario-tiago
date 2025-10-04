import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { obterIP } from "../../lib/auditoria";
import {
  UsuarioService,
  InventarioService,
  AuditoriaService,
} from "../../../lib/services.js";

export async function DELETE(request) {
  // Verificar autenticação
  const session = await getServerSession(authOptions);

  if (!session) {
    await AuditoriaService.log("ACESSO_NEGADO_EXCLUSAO", null, {
      ip: obterIP(request),
      motivo: "Usuario nao autenticado",
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const nomeInventario = searchParams.get("inventario");

    if (!nomeInventario) {
      return NextResponse.json(
        { error: "Nome do inventário é obrigatório." },
        { status: 400 }
      );
    }

    // Verificar se o usuário é proprietário do inventário
    const usuario = await UsuarioService.findOrCreateFromSession(session.user);
    const inventario = await InventarioService.findByName(nomeInventario);

    if (!inventario) {
      return NextResponse.json(
        { error: "Inventário não encontrado." },
        { status: 404 }
      );
    }

    if (inventario.proprietarioId !== usuario.id) {
      await AuditoriaService.log("ACESSO_NEGADO_EXCLUSAO", session.user, {
        ip: obterIP(request),
        inventario: nomeInventario,
        motivo: "Usuario nao e proprietario",
        userAgent: request.headers.get("user-agent") || "N/A",
      });

      return NextResponse.json(
        { error: "Apenas o proprietário pode excluir o inventário." },
        { status: 403 }
      );
    }

    // Excluir o inventário e todos os dados relacionados
    await InventarioService.excluirCompleto(inventario.id);

    // Log da exclusão
    await AuditoriaService.log("EXCLUSAO_INVENTARIO", session.user, {
      ip: obterIP(request),
      inventario: nomeInventario,
      inventarioId: inventario.id,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    console.log(
      `[EXCLUSAO] ${session.user?.name || session.user?.email} excluiu inventário ${nomeInventario} (ID: ${inventario.id})`
    );

    return NextResponse.json({
      message: "Inventário excluído com sucesso!",
      inventario: nomeInventario,
    });
  } catch (error) {
    console.error("[EXCLUSAO] Erro durante exclusão:", error);

    // Obter parâmetros novamente para o log de erro
    const { searchParams } = new URL(request.url);
    const nomeInventario = searchParams.get("inventario");

    // Log do erro
    await AuditoriaService.log("ERRO_EXCLUSAO_INVENTARIO", session.user, {
      ip: obterIP(request),
      erro: error.message,
      inventario: nomeInventario,
      userAgent: request.headers.get("user-agent") || "N/A",
    });

    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    );
  }
}
