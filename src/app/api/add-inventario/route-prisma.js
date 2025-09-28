import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "../../../lib/db.js";

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

    // Verificar se o inventário existe
    const inventario = await prisma.inventario.findUnique({
      where: { nome }
    });

    if (!inventario) {
      return NextResponse.json(
        { error: "Inventário não encontrado." },
        { status: 404 }
      );
    }

    // Buscar ou criar usuário atual
    let usuario = await prisma.usuario.findUnique({
      where: { email: session.user.email }
    });

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          email: session.user.email,
          nome: session.user.name || session.user.email.split('@')[0]
        }
      });
    }

    // Verificar permissões - se é proprietário ou tem permissão
    const isOwner = inventario.proprietarioId === usuario.id;
    let hasPermission = isOwner;

    if (!isOwner) {
      const permissao = await prisma.permissao.findUnique({
        where: {
          inventarioId_usuarioId: {
            inventarioId: inventario.id,
            usuarioId: usuario.id,
          },
        },
      });
      hasPermission = permissao?.ativa === true;
    }

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: "Você não tem permissão para adicionar itens neste inventário.",
        },
        { status: 403 }
      );
    }

    // Verificar se já existe item com este número
    if (itemData.NUMERO) {
      const existingItem = await prisma.itemInventario.findFirst({
        where: {
          inventarioId: inventario.id,
          dados: {
            path: ["NUMERO"],
            equals: itemData.NUMERO.toString()
          }
        }
      });

      if (existingItem) {
        return NextResponse.json(
          {
            error: `Item com número ${itemData.NUMERO} já existe neste inventário.`,
          },
          { status: 400 }
        );
      }
    }

    // Preparar dados do item
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

    // Criar o item no banco
    const novoItem = await prisma.itemInventario.create({
      data: {
        inventarioId: inventario.id,
        dados: itemParaBanco,
        criadoPorId: usuario.id,
      },
    });

    // Log de auditoria
    await prisma.auditoria.create({
      data: {
        acao: "add_item",
        usuarioId: usuario.id,
        inventario: nome,
        detalhes: {
          numero: itemData.NUMERO,
          descricao: itemData.DESCRICAO,
          item_id: novoItem.id,
        },
      },
    });

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