import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import {
  InventarioService,
  UsuarioService,
  AuditoriaService,
  PermissaoService,
} from "@/lib/services";
import prisma from "@/lib/db.js";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { nome, numeroOriginal, ...itemData } = await request.json();

    console.log(`📝 Dados recebidos:`, { nome, numeroOriginal, itemData });

    if (!nome || !numeroOriginal) {
      return NextResponse.json(
        { error: "Nome do inventário e número original são obrigatórios" },
        { status: 400 }
      );
    }

    console.log(
      `📝 Registrando correção para item ${numeroOriginal} no inventário ${nome}`
    );

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

    // Mapear campos para comparar os dados originais com os corrigidos
    const camposMapeamento = {
      NUMERO: "numero",
      STATUS: "status",
      ED: "ed",
      "CONTA CONTABIL": "contaContabil",
      DESCRICAO: "descricao",
      RÓTULOS: "rotulos",
      "CARGA ATUAL": "cargaAtual",
      "SETOR DO RESPONSÁVEL": "setorResponsavel",
      "CAMPUS DA CARGA": "campusCarga",
      "CARGA CONTÁBIL": "cargaContabil",
      "VALOR AQUISIÇÃO": "valorAquisicao",
      "VALOR DEPRECIADO": "valorDepreciado",
      "NUMERO NOTA FISCAL": "numeroNotaFiscal",
      "NUMERO SERIE": "numeroSerie",
      "DATA ENTRADA": "dataEntrada",
      "DATA CARGA": "dataCarga",
      FORNECEDOR: "fornecedor",
      MARCA: "marca",
      MODELO: "modelo",
      SALA: "sala",
      SETOR: "setor",
      "ESTADO DE CONSERVAÇÃO": "estadoConservacao",
    };

    // Comparar dados e criar objeto com as diferenças
    const dadosCorrigidos = {};
    for (const [campoFormulario, campoBanco] of Object.entries(
      camposMapeamento
    )) {
      const valorOriginal = itemOriginal[campoBanco];
      const valorNovo = itemData[campoFormulario];

      // Se o campo foi preenchido no formulário, usar o novo valor, senão manter original
      const valorFinal =
        valorNovo !== undefined && valorNovo !== null && valorNovo.trim() !== ""
          ? valorNovo.trim()
          : valorOriginal;

      // Normalizar para comparação
      const valorOriginalNorm =
        valorOriginal && valorOriginal.trim() !== ""
          ? valorOriginal.trim()
          : null;
      const valorFinalNorm =
        valorFinal && valorFinal.trim() !== "" ? valorFinal.trim() : null;

      // Só registra mudança se houve alteração intencional (campo foi preenchido E é diferente)
      if (
        valorNovo !== undefined &&
        valorNovo !== null &&
        valorNovo.trim() !== "" &&
        valorOriginalNorm !== valorFinalNorm
      ) {
        dadosCorrigidos[campoFormulario] = {
          original: valorOriginalNorm || "Não informado",
          novo: valorFinalNorm || "Não informado",
        };
      }
    }

    console.log(`📝 Diferenças identificadas:`, dadosCorrigidos);

    // Função para determinar valor final: usa novo se preenchido, senão mantém original
    const getValorFinal = (valorNovo, valorOriginal) => {
      return valorNovo !== undefined &&
        valorNovo !== null &&
        valorNovo.trim() !== ""
        ? valorNovo.trim()
        : valorOriginal;
    };

    // Preparar dados da correção, usando valores originais quando campos não foram preenchidos
    const dadosCorrecao = {
      inventarioId: inventario.id,
      numeroItemOriginal: numeroOriginal,
      numero: getValorFinal(itemData.NUMERO?.toString(), itemOriginal.numero),
      status: getValorFinal(itemData.STATUS, itemOriginal.status),
      ed: getValorFinal(itemData.ED, itemOriginal.ed),
      contaContabil: getValorFinal(
        itemData["CONTA CONTABIL"],
        itemOriginal.contaContabil
      ),
      descricao: getValorFinal(itemData.DESCRICAO, itemOriginal.descricao),
      rotulos: getValorFinal(itemData.RÓTULOS, itemOriginal.rotulos),
      cargaAtual: getValorFinal(
        itemData["CARGA ATUAL"],
        itemOriginal.cargaAtual
      ),
      setorResponsavel: getValorFinal(
        itemData["SETOR DO RESPONSÁVEL"],
        itemOriginal.setorResponsavel
      ),
      campusCarga: getValorFinal(
        itemData["CAMPUS DA CARGA"],
        itemOriginal.campusCarga
      ),
      cargaContabil: getValorFinal(
        itemData["CARGA CONTÁBIL"],
        itemOriginal.cargaContabil
      ),
      valorAquisicao: getValorFinal(
        itemData["VALOR AQUISIÇÃO"],
        itemOriginal.valorAquisicao
      ),
      valorDepreciado: getValorFinal(
        itemData["VALOR DEPRECIADO"],
        itemOriginal.valorDepreciado
      ),
      numeroNotaFiscal: getValorFinal(
        itemData["NUMERO NOTA FISCAL"],
        itemOriginal.numeroNotaFiscal
      ),
      numeroSerie: getValorFinal(
        itemData["NUMERO SERIE"],
        itemOriginal.numeroSerie
      ),
      dataEntrada: getValorFinal(
        itemData["DATA ENTRADA"],
        itemOriginal.dataEntrada
      ),
      dataCarga: getValorFinal(itemData["DATA CARGA"], itemOriginal.dataCarga),
      fornecedor: getValorFinal(itemData.FORNECEDOR, itemOriginal.fornecedor),
      marca: getValorFinal(itemData.MARCA, itemOriginal.marca),
      modelo: getValorFinal(itemData.MODELO, itemOriginal.modelo),
      sala: getValorFinal(itemData.SALA, itemOriginal.sala),
      setor: getValorFinal(itemData.SETOR, itemOriginal.setor),
      estadoConservacao: getValorFinal(
        itemData["ESTADO DE CONSERVAÇÃO"],
        itemOriginal.estadoConservacao
      ),
      inventarianteId: usuario.id,
      observacoes:
        itemData.observacoes ||
        `Correção registrada em ${new Date().toLocaleString()}`,
      dataCorrecao: new Date(),
    };

    // Adicionar as diferenças como observações complementares se houve mudanças
    if (Object.keys(dadosCorrigidos).length > 0) {
      const diferencasTexto = Object.entries(dadosCorrigidos)
        .map(
          ([campo, valores]) =>
            `${campo}: "${valores.original}" → "${valores.novo}"`
        )
        .join(" | ");

      dadosCorrecao.observacoes = `${dadosCorrecao.observacoes}\n\nCampos alterados: ${diferencasTexto}`;
    }

    // Converter strings vazias para null
    Object.keys(dadosCorrecao).forEach((key) => {
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
