import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import {
  InventarioService,
  ItemInventarioService,
  PermissaoService,
  AuditoriaService,
} from "../../../lib/services.js";

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    const {
      nome,
      numero,
      motivo,
      condicaoEstimada,
      relevanciaAtual,
      detalhes,
    } = await request.json();

    if (!nome || !numero) {
      return NextResponse.json(
        { error: "Inventário e número do tombo são obrigatórios." },
        { status: 400 }
      );
    }

    if (!motivo || !condicaoEstimada || !relevanciaAtual) {
      return NextResponse.json(
        {
          error:
            "Por favor, selecione uma opção em todos os 3 blocos obrigatórios.",
        },
        { status: 400 }
      );
    }

    if (motivo === "Outro motivo" && (!detalhes || !detalhes.trim())) {
      return NextResponse.json(
        {
          error:
            "Ao selecionar 'Outro motivo', o preenchimento do campo de detalhamento é obrigatório.",
        },
        { status: 400 }
      );
    }

    const inventario = await InventarioService.findByName(nome);
    if (!inventario) {
      return NextResponse.json(
        { error: "Inventário não encontrado." },
        { status: 404 }
      );
    }

    const hasAccess = await PermissaoService.canAccessInventario(
      session.user.email,
      nome
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "Você não tem permissão para registrar justificativa neste inventário.",
        },
        { status: 403 }
      );
    }

    const resultado = await ItemInventarioService.salvarJustificativa(
      nome,
      numero,
      {
        motivo,
        condicaoEstimada,
        relevanciaAtual,
        detalhes: detalhes?.trim() || "",
      },
      session.user
    );

    await AuditoriaService.log(
      "JUSTIFICAR_BEM_NAO_ENCONTRADO",
      session.user,
      {
        numero,
        motivo,
        condicaoEstimada,
        relevanciaAtual,
        detalhes: detalhes?.trim() || "",
      },
      nome
    );

    return NextResponse.json({
      success: true,
      justificativa: resultado.justificativa,
    });
  } catch (error) {
    console.error("Erro ao registrar justificativa:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao salvar justificativa." },
      { status: 500 }
    );
  }
}
