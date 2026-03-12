import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { isOwner } from "../../../lib/permissoes.js";
import { EmailService } from "../../../../lib/services.js";

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const inventario = searchParams.get("inventario");

  if (!inventario) {
    return NextResponse.json(
      { error: "Parâmetro 'inventario' é obrigatório." },
      { status: 400 }
    );
  }

  const proprietario = await isOwner(inventario, session.user.email);
  if (!proprietario) {
    return NextResponse.json(
      { error: "Apenas o proprietário pode visualizar o histórico de emails." },
      { status: 403 }
    );
  }

  try {
    const envios = await EmailService.listarEnvios(inventario);
    return NextResponse.json(envios);
  } catch (error) {
    console.error("Erro ao listar histórico de emails:", error);
    return NextResponse.json(
      { error: "Erro ao carregar histórico de envios." },
      { status: 500 }
    );
  }
}
