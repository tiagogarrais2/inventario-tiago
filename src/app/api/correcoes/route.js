import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { InventarioService, CorrecaoService, PermissaoService } from "@/lib/services";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const inventario = searchParams.get("inventario");
    const numeroOriginal = searchParams.get("numeroOriginal");

    if (!inventario) {
      return NextResponse.json(
        { error: "Parâmetro 'inventario' é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o inventário existe e o usuário tem permissão
    const inventarioObj = await InventarioService.findByName(inventario);
    if (!inventarioObj) {
      return NextResponse.json(
        { error: "Inventário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões
    const temPermissao = await PermissaoService.canAccessInventario(
      session.user.email,
      inventario
    );

    if (!temPermissao) {
      return NextResponse.json(
        { error: "Sem permissão para acessar este inventário" },
        { status: 403 }
      );
    }

    let correcoes;

    if (numeroOriginal) {
      // Buscar correções de um item específico
      correcoes = await CorrecaoService.findByNumeroOriginal(inventario, numeroOriginal);
    } else {
      // Buscar todas as correções do inventário
      correcoes = await CorrecaoService.listByInventario(inventario);
    }

    // Contar total de correções
    const totalCorrecoes = await CorrecaoService.countByInventario(inventario);

    return NextResponse.json({
      correcoes,
      total: totalCorrecoes,
      inventario: inventario,
      filtroNumeroOriginal: numeroOriginal || null,
    });

  } catch (error) {
    console.error("❌ Erro ao buscar correções:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}