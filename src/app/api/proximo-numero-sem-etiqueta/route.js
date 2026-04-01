import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import {
  InventarioService,
  ItemInventarioService,
  PermissaoService,
} from "../../../lib/services.js";

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
    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) {
      return NextResponse.json(
        { error: "Inventário não encontrado." },
        { status: 404 }
      );
    }

    const hasAccess = await PermissaoService.canAccessInventario(
      session.user.email,
      nomeInventario
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Você não tem permissão para acessar este inventário." },
        { status: 403 }
      );
    }

    const proximoNumero =
      await ItemInventarioService.findProximoNumeroSemEtiqueta(nomeInventario);

    return NextResponse.json({ proximoNumero });
  } catch (error) {
    console.error("[PROXIMO-NUMERO-SEM-ETIQUETA] Erro:", error);
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    );
  }
}
