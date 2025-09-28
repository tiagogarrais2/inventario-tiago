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
  // Verificar autenticação
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
      salaEncontrada,
      dataInventario,
      status,
      inventariante,
    } = await request.json();

    console.log(`📝 Atualizando item ${numero} no inventário: ${nome}`);
    console.log(`👤 Usuário: ${session.user.email}`);
    console.log(`📋 Dados de atualização:`, {
      salaEncontrada,
      dataInventario,
      status,
      inventariante,
    });

    // Verificar se o inventário existe
    const inventario = await InventarioService.findByName(nome);
    if (!inventario) {
      return NextResponse.json(
        { error: "Inventário não encontrado." },
        { status: 404 }
      );
    }

    // Verificar permissões de acesso
    const hasAccess = await PermissaoService.canAccessInventario(
      session.user.email,
      nome
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            "Você não tem permissão para atualizar itens neste inventário.",
        },
        { status: 403 }
      );
    }

    // Verificar se o item existe
    const itemExistente = await ItemInventarioService.findByNumero(
      nome,
      numero
    );
    if (!itemExistente) {
      return NextResponse.json(
        { error: "Item não encontrado." },
        { status: 404 }
      );
    }

    // Preparar dados de atualização
    const updateData = {
      dataInventario: dataInventario || new Date().toISOString(),
      salaEncontrada: salaEncontrada || null,
      status: status || null,
    };

    console.log(`💾 Atualizando item no banco:`, updateData);

    // Atualizar o item no banco
    const itemAtualizado = await ItemInventarioService.updateInventario(
      nome,
      numero,
      updateData,
      session.user.email
    );

    console.log(`✅ Item atualizado com sucesso:`, itemAtualizado);

    // Log de auditoria
    await AuditoriaService.log(
      "update_item",
      session.user,
      {
        numero: numero,
        status: status,
        salaEncontrada: salaEncontrada,
        dataInventario: dataInventario,
      },
      nome
    );

    console.log(`📋 Log de auditoria registrado para item ${numero}`);

    return NextResponse.json(
      {
        success: true,
        item: itemAtualizado,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro ao atualizar item:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao atualizar item." },
      { status: 500 }
    );
  }
}
