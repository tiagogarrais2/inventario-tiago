import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { InventarioService, UsuarioService, AuditoriaService, PermissaoService } from "@/lib/services";
import prisma from "@/lib/db.js";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { nome, numeroOriginal, ...itemData } = await request.json();

    console.log(`📝 Dados recebidos:`, { nome, numeroOriginal, itemData });

    if (!nome || !numeroOriginal) {
      return NextResponse.json(
        { error: "Nome do inventário e número original são obrigatórios" },
        { status: 400 }
      );
    }

    console.log(`📝 Registrando correção para item ${numeroOriginal} no inventário ${nome}`);

    // Verificar se o inventário existe e o usuário tem permissão
    const inventario = await InventarioService.findByName(nome);
    if (!inventario) {
      return NextResponse.json(
        { error: "Inventário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões
    const temPermissao = await PermissaoService.canAccessInventario(
      session.user.email,
      nome
    );

    if (!temPermissao) {
      return NextResponse.json(
        { error: "Sem permissão para acessar este inventário" },
        { status: 403 }
      );
    }

    // Buscar o usuário
    const usuario = await UsuarioService.findByEmail(session.user.email);
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o item original existe
    const itemOriginal = await prisma.itemInventario.findFirst({
      where: {
        inventarioId: inventario.id,
        numero: numeroOriginal.toString(),
      },
    });

    if (!itemOriginal) {
      return NextResponse.json(
        { error: "Item original não encontrado" },
        { status: 404 }
      );
    }

    console.log(`📋 Item original encontrado:`, itemOriginal.numero);

    // Preparar dados da correção, mapeando os campos corretamente
    const dadosCorrecao = {
      inventarioId: inventario.id,
      numeroItemOriginal: numeroOriginal,
      numero: itemData.NUMERO?.toString() || "",
      status: itemData.STATUS || null,
      ed: itemData.ED || null,
      contaContabil: itemData["CONTA CONTABIL"] || null,
      descricao: itemData.DESCRICAO || null,
      rotulos: itemData.RÓTULOS || null,
      cargaAtual: itemData["CARGA ATUAL"] || null,
      setorResponsavel: itemData["SETOR DO RESPONSÁVEL"] || null,
      campusCarga: itemData["CAMPUS DA CARGA"] || null,
      cargaContabil: itemData["CARGA CONTÁBIL"] || null,
      valorAquisicao: itemData["VALOR AQUISIÇÃO"] || null,
      valorDepreciado: itemData["VALOR DEPRECIADO"] || null,
      numeroNotaFiscal: itemData["NUMERO NOTA FISCAL"] || null,
      numeroSerie: itemData["NUMERO SERIE"] || null,
      dataEntrada: itemData["DATA ENTRADA"] || null,
      dataCarga: itemData["DATA CARGA"] || null,
      fornecedor: itemData.FORNECEDOR || null,
      marca: itemData.MARCA || null,
      modelo: itemData.MODELO || null,
      sala: itemData.SALA || null,
      setor: itemData.SETOR || null,
      estadoConservacao: itemData["ESTADO DE CONSERVAÇÃO"] || null,
      inventarianteId: usuario.id,
      observacoes: `Correção registrada em ${new Date().toLocaleString()}`
    };

    // Converter strings vazias para null
    Object.keys(dadosCorrecao).forEach(key => {
      if (dadosCorrecao[key] === "") {
        dadosCorrecao[key] = null;
      }
    });

    console.log(`💾 Salvando correção no banco:`, dadosCorrecao);

    // Salvar a correção na nova tabela
    const correcao = await prisma.correcaoItem.create({
      data: dadosCorrecao,
      include: {
        inventariante: {
          select: { nome: true, email: true },
        },
      },
    });

    console.log(`✅ Correção salva com sucesso:`, correcao.id);

    // Log de auditoria
    await AuditoriaService.log(
      "item_correction",
      session.user,
      {
        numeroOriginal: numeroOriginal,
        numeroCorrigido: itemData.NUMERO,
        correcaoId: correcao.id,
      },
      nome
    );

    console.log(`📋 Log de auditoria registrado para correção`);

    return NextResponse.json(
      {
        success: true,
        correcao: {
          id: correcao.id,
          numeroOriginal: numeroOriginal,
          numeroCorrigido: correcao.numero,
          inventariante: correcao.inventariante?.nome,
          dataCorrecao: correcao.dataCorrecao,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Erro ao salvar correção:", error);

    // Log de auditoria para erro
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        await AuditoriaService.log(
          "item_correction_error",
          session.user,
          { error: error.message },
          request.body?.nome || "unknown"
        );
      }
    } catch (auditError) {
      console.error("❌ Erro ao registrar auditoria:", auditError);
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}