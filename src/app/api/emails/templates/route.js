import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { isOwner } from "../../../lib/permissoes.js";
import { EmailTemplateService } from "../../../../lib/services.js";

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const inventario = searchParams.get("inventario");
    const tipo = searchParams.get("tipo"); // "template", "rascunho" ou null (todos)

    if (!inventario) {
      return NextResponse.json(
        { error: "Parâmetro inventario é obrigatório." },
        { status: 400 }
      );
    }

    const proprietario = await isOwner(inventario, session.user.email);
    if (!proprietario) {
      return NextResponse.json(
        { error: "Apenas o proprietário pode acessar os textos salvos." },
        { status: 403 }
      );
    }

    const templates = await EmailTemplateService.listarPorInventario(
      inventario,
      tipo
    );
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Erro ao listar templates:", error);
    return NextResponse.json(
      { error: "Erro ao listar textos salvos." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    const { inventario, titulo, assunto, mensagem, tipo } =
      await request.json();

    if (!inventario || !titulo || !assunto || !mensagem) {
      return NextResponse.json(
        {
          error: "Campos obrigatórios: inventario, titulo, assunto, mensagem.",
        },
        { status: 400 }
      );
    }

    if (tipo && !["template", "rascunho"].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo deve ser "template" ou "rascunho".' },
        { status: 400 }
      );
    }

    const proprietario = await isOwner(inventario, session.user.email);
    if (!proprietario) {
      return NextResponse.json(
        { error: "Apenas o proprietário pode criar textos salvos." },
        { status: 403 }
      );
    }

    const template = await EmailTemplateService.criar(
      inventario,
      session.user.email,
      { titulo, assunto, mensagem, tipo: tipo || "template" }
    );

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar template:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um texto salvo com esse título neste inventário." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar texto salvo." },
      { status: 500 }
    );
  }
}
