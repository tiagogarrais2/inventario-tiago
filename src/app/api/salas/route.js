import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { hasPermission } from "../../lib/permissoes";
import { SalaService, AuditoriaService } from "../../../lib/services.js";

export async function GET(request) {
  // Verificar autenticação
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const nomeInventario = searchParams.get("inventario");

  if (!nomeInventario) {
    return NextResponse.json(
      { error: "Parâmetro 'inventario' é obrigatório." },
      { status: 400 }
    );
  }

  try {
    // Verificar permissões de acesso ao inventário
    const permissao = await hasPermission(nomeInventario, session.user.email);

    if (!permissao.hasAccess) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Você não tem permissão para acessar este inventário.",
        },
        { status: 403 }
      );
    }

    // Buscar salas do inventário no banco de dados
    const salas = await SalaService.listByInventario(nomeInventario);

    if (salas.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma sala encontrada para este inventário." },
        { status: 404 }
      );
    }

    return NextResponse.json(salas);
  } catch (error) {
    console.error("Erro ao buscar salas:", error);

    // Log do erro para auditoria
    await AuditoriaService.log("ERRO_BUSCAR_SALAS", session.user, {
      erro: error.message,
      inventario: nomeInventario,
    });

    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
