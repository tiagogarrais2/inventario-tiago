import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { isOwner } from "../../../lib/permissoes.js";
import { ServidorService } from "../../../../lib/services.js";

// Atualizar emails de servidores (somente proprietário)
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    const { inventario, emails } = await request.json();

    if (!inventario || !emails || typeof emails !== "object") {
      return NextResponse.json(
        { error: "Parâmetros 'inventario' e 'emails' são obrigatórios." },
        { status: 400 }
      );
    }

    // Somente proprietário pode atualizar emails
    const proprietario = await isOwner(inventario, session.user.email);
    if (!proprietario) {
      return NextResponse.json(
        {
          error:
            "Apenas o proprietário do inventário pode gerenciar emails de servidores.",
        },
        { status: 403 }
      );
    }

    await ServidorService.updateEmailsBatch(inventario, emails);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar emails:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar emails dos servidores." },
      { status: 500 }
    );
  }
}

// Listar servidores com emails
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
      { error: "Apenas o proprietário pode visualizar emails dos servidores." },
      { status: 403 }
    );
  }

  try {
    const servidores =
      await ServidorService.listByInventarioComEmail(inventario);
    return NextResponse.json(servidores);
  } catch (error) {
    console.error("Erro ao listar servidores com email:", error);
    return NextResponse.json(
      { error: "Erro ao listar servidores." },
      { status: 500 }
    );
  }
}
