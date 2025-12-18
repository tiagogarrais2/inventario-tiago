import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import {
  InventarioService,
  ItemInventarioService,
  PermissaoService,
  AuditoriaService,
  UsuarioService,
} from "../../../lib/services.js";
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
    const {
      nome,
      numero,
      salaEncontrada,
      sala,
      dataInventario,
      status,
      estadoConservacao,
      cargaAtual,
      inventariante,
      observacoes,
    } = await request.json();

    console.log(`📝 Atualizando item ${numero} no inventário: ${nome}`);
    console.log(`👤 Usuário: ${session.user.email}`);
    console.log(`📋 Dados de atualização:`, {
      salaEncontrada,
      sala,
      dataInventario,
      status,
      estadoConservacao,
      cargaAtual,
      inventariante,
      observacoes,
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
      statusInventario: status || null,
      estadoConservacao: estadoConservacao || null,
      cargaAtual: cargaAtual || null,
      observacoesInventario: observacoes || null,
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

    // Registrar atualizações do inventário como correções para aparecer nos relatórios
    try {
      // Buscar o usuário
      const usuario = await UsuarioService.findByEmail(session.user.email);
      if (!usuario) {
        console.warn("Usuário não encontrado para registrar correção");
      } else {
        // Mapear campos alterados durante o inventário (excluindo status e estadoConservacao)
        const camposMapeamento = {
          cargaAtual: "cargaAtual",
        };

        // Comparar dados e identificar diferenças
        const dadosCorrigidos = {};
        for (const [campoFormulario, campoBanco] of Object.entries(
          camposMapeamento
        )) {
          const valorOriginal = itemExistente[campoBanco];
          const valorNovo = updateData[campoBanco];

          // Só registra se houve mudança intencional
          if (valorNovo !== null && valorNovo !== valorOriginal) {
            dadosCorrigidos[campoFormulario] = {
              original: valorOriginal || "Não informado",
              novo: valorNovo || "Não informado",
            };
          }
        }

        // Se houve alterações, registrar como correção
        if (Object.keys(dadosCorrigidos).length > 0) {
          const diferencasTexto = Object.entries(dadosCorrigidos)
            .map(
              ([campo, valores]) =>
                `${campo}: "${valores.original}" → "${valores.novo}"`
            )
            .join(" | ");

          const dadosCorrecao = {
            inventarioId: inventario.id,
            numeroItemOriginal: numero,
            numero: itemExistente.numero,
            status: updateData.statusInventario || itemExistente.status,
            estadoConservacao:
              updateData.estadoConservacao || itemExistente.estadoConservacao,
            cargaAtual: updateData.cargaAtual || itemExistente.cargaAtual,
            sala: itemExistente.sala,
            inventarianteId: usuario.id,
            observacoes: `Atualização realizada durante inventário em ${new Date().toLocaleString()}\n\nCampos alterados: ${diferencasTexto}`,
            dataCorrecao: new Date(),
          };

          // Salvar a correção
          await prisma.correcaoItem.create({
            data: dadosCorrecao,
          });

          console.log(
            `📝 Correção registrada para atualizações do inventário:`,
            dadosCorrigidos
          );
        }
      }
    } catch (error) {
      console.error("❌ Erro ao registrar correção do inventário:", error);
      // Não falha a operação se não conseguir registrar a correção
    }

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
