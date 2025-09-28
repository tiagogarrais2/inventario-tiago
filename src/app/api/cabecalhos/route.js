import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { hasPermission } from "../../lib/permissoes";
import { CabecalhoService, AuditoriaService } from "../../../lib/services.js";

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

    // Buscar cabeçalhos do inventário no banco de dados
    const cabecalhos = await CabecalhoService.listByInventario(nomeInventario);

    if (cabecalhos.length === 0) {
      return NextResponse.json(
        { error: "Nenhum cabeçalho encontrado para este inventário." },
        { status: 404 }
      );
    }

    // Retornar apenas os nomes dos campos ordenados por ordem
    const nomesCampos = cabecalhos
      .sort((a, b) => a.ordem - b.ordem)
      .map((cabecalho) => cabecalho.campo);

    return NextResponse.json(nomesCampos);
  } catch (error) {
    console.error("Erro ao buscar cabeçalhos:", error);

    // Log do erro para auditoria
    await AuditoriaService.log("ERRO_BUSCAR_CABECALHOS", session.user, {
      erro: error.message,
      inventario: nomeInventario,
    });

    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
