import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { InventarioService, CorrecaoService, PermissaoService } from "@/lib/services";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Await params in Next.js 15
    const { inventario, numero } = await params;

    if (!inventario || !numero) {
      return NextResponse.json(
        { error: "Parâmetros inventario e numero são obrigatórios" },
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

    // Buscar histórico de correções do item
    const correcoes = await CorrecaoService.findByNumeroOriginal(inventario, numero);

    return NextResponse.json({
      inventario,
      numeroItem: numero,
      correcoes,
      totalCorrecoes: correcoes.length,
    });

  } catch (error) {
    console.error("❌ Erro ao buscar correções:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}