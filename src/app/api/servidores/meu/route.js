import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { hasPermission } from "../../../lib/permissoes.js";
import { ServidorService } from "../../../../lib/services.js";

export async function GET(request) {
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

    const servidores = await ServidorService.listByInventario(nomeInventario);

    const meusServidores = servidores
      .filter((s) => s.email === session.user.email)
      .map((s) => s.nome);

    return NextResponse.json(meusServidores);
  } catch (error) {
    console.error("Erro ao buscar servidores do usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
