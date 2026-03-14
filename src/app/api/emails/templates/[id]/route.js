import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { isOwner } from "../../../../lib/permissoes.js";
import { EmailTemplateService } from "../../../../../lib/services.js";

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const { titulo, assunto, mensagem, tipo } = await request.json();

    if (!titulo || !assunto || !mensagem) {
      return NextResponse.json(
        { error: "Campos obrigatórios: titulo, assunto, mensagem." },
        { status: 400 }
      );
    }

    if (tipo && !["template", "rascunho"].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo deve ser "template" ou "rascunho".' },
        { status: 400 }
      );
    }

    const template = await EmailTemplateService.buscarPorId(id);
    if (!template) {
      return NextResponse.json(
        { error: "Texto salvo não encontrado." },
        { status: 404 }
      );
    }

    const proprietario = await isOwner(
      template.inventario.nome,
      session.user.email
    );
    if (!proprietario) {
      return NextResponse.json(
        { error: "Apenas o proprietário pode editar textos salvos." },
        { status: 403 }
      );
    }

    const atualizado = await EmailTemplateService.atualizar(id, {
      titulo,
      assunto,
      mensagem,
      tipo,
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("Erro ao atualizar template:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um texto salvo com esse título neste inventário." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar texto salvo." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    const template = await EmailTemplateService.buscarPorId(id);
    if (!template) {
      return NextResponse.json(
        { error: "Texto salvo não encontrado." },
        { status: 404 }
      );
    }

    const proprietario = await isOwner(
      template.inventario.nome,
      session.user.email
    );
    if (!proprietario) {
      return NextResponse.json(
        { error: "Apenas o proprietário pode excluir textos salvos." },
        { status: 403 }
      );
    }

    await EmailTemplateService.excluir(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir template:", error);
    return NextResponse.json(
      { error: "Erro ao excluir texto salvo." },
      { status: 500 }
    );
  }
}
