import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import {
  InventarioService,
  ItemInventarioService,
  PermissaoService,
  AuditoriaService,
  UsuarioService,
} from "../../../lib/services";

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
    const { nome, ...itemData } = await request.json();

    console.log(`📝 Iniciando cadastro de item no inventário: ${nome}`);
    console.log(`👤 Usuário: ${session.user.email}`);
    console.log(`📋 Dados do item:`, itemData);

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
            "Você não tem permissão para adicionar itens neste inventário.",
        },
        { status: 403 }
      );
    }

    // Verificar se já existe item com este número
    if (itemData.NUMERO) {
      const existingItem = await ItemInventarioService.findByNumero(
        nome,
        itemData.NUMERO
      );
      if (existingItem) {
        return NextResponse.json(
          {
            error: `Item com número ${itemData.NUMERO} já existe neste inventário.`,
          },
          { status: 400 }
        );
      }
    }

    // Buscar ou criar usuário atual
    const usuario = await UsuarioService.findOrCreateFromSession(session.user);

    // Preparar dados do item para o banco (mantendo formato esperado pelo service)
    const itemParaBanco = {
      NUMERO: itemData.NUMERO?.toString() || "",
      STATUS: itemData.STATUS || "",
      ED: itemData.ED || "",
      "CONTA CONTABIL": itemData["CONTA CONTABIL"] || "",
      DESCRICAO: itemData.DESCRICAO || "",
      RÓTULOS: itemData.RÓTULOS || "",
      "CARGA ATUAL": itemData["CARGA ATUAL"] || "",
      "SETOR DO RESPONSÁVEL": itemData["SETOR DO RESPONSÁVEL"] || "",
      "CAMPUS DA CARGA": itemData["CAMPUS DA CARGA"] || "",
      "CARGA CONTÁBIL": itemData["CARGA CONTÁBIL"] || "",
      "VALOR AQUISIÇÃO": itemData["VALOR AQUISIÇÃO"] || "",
      "VALOR DEPRECIADO": itemData["VALOR DEPRECIADO"] || "",
      "NUMERO NOTA FISCAL": itemData["NUMERO NOTA FISCAL"] || "",
      "NÚMERO DE SÉRIE": itemData["NÚMERO DE SÉRIE"] || "",
      "DATA DA ENTRADA": itemData["DATA DA ENTRADA"] || null,
      "DATA DA CARGA": itemData["DATA DA CARGA"] || null,
      FORNECEDOR: itemData.FORNECEDOR || "",
      MARCA: itemData.MARCA || "",
      MODELO: itemData.MODELO || "",
      SALA: itemData.SALA || "",
      SETOR: itemData.SETOR || "",
      "ESTADO DE CONSERVAÇÃO": itemData["ESTADO DE CONSERVAÇÃO"] || "",
    };

    console.log(`💾 Salvando item no banco:`, itemParaBanco);

    // Criar o item no banco
    const novoItem = await ItemInventarioService.create(nome, itemParaBanco);

    console.log(`✅ Item criado com sucesso:`, novoItem);

    // Log de auditoria
    await AuditoriaService.log(
      "add_item",
      session.user,
      {
        numero: itemData.NUMERO,
        descricao: itemData.DESCRICAO,
        item_id: novoItem.id,
      },
      nome
    );

    console.log(`📋 Log de auditoria registrado para item ${itemData.NUMERO}`);

    return NextResponse.json(
      {
        success: true,
        item: novoItem,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Erro ao adicionar item:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao adicionar item." },
      { status: 500 }
    );
  }
}
