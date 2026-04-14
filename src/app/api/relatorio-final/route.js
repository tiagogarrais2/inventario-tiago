import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "../../../lib/db.js";
import { InventarioService } from "../../../lib/services.js";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const nomeInventario = searchParams.get("inventario");

  if (!nomeInventario) {
    return NextResponse.json(
      { error: "Parâmetro 'inventario' é obrigatório." },
      { status: 400 }
    );
  }

  try {
    const permissoes = await InventarioService.checkPermissions(
      nomeInventario,
      session.user.email
    );
    if (!permissoes.hasAccess) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    // Reusar inventário já carregado em checkPermissions (evita query duplicada)
    const inventario = permissoes.inventario;
    if (!inventario) {
      return NextResponse.json(
        { error: "Inventário não encontrado." },
        { status: 404 }
      );
    }

    // Buscar todos os dados em paralelo — apenas queries essenciais
    // Estatísticas são calculadas em memória a partir dos itens já carregados
    const [
      itens,
      salas,
      servidores,
      permissoesInventario,
      auditLogs,
      emailLogs,
      listaCorrecoes,
    ] = await prisma.$transaction([
      prisma.itemInventario.findMany({
        where: { inventarioId: inventario.id },
        select: {
          numero: true,
          descricao: true,
          sala: true,
          salaEncontrada: true,
          cargaAtual: true,
          estadoConservacao: true,
          fornecedor: true,
          marca: true,
          valorAquisicao: true,
          valorDepreciado: true,
          dataInventario: true,
          cadastradoDuranteInventario: true,
        },
      }),
      prisma.sala.findMany({
        where: { inventarioId: inventario.id },
        select: { nome: true },
        orderBy: { nome: "asc" },
      }),
      prisma.servidor.findMany({
        where: { inventarioId: inventario.id },
        select: { nome: true },
        orderBy: { nome: "asc" },
      }),
      prisma.permissao.findMany({
        where: { inventarioId: inventario.id, ativa: true },
        select: {
          cargo: true,
          usuario: { select: { nome: true, email: true } },
        },
      }),
      prisma.auditLog.findMany({
        where: { inventarioId: inventario.id },
        select: {
          timestamp: true,
          acao: true,
          detalhes: true,
          usuario: { select: { nome: true } },
        },
        orderBy: { timestamp: "asc" },
        take: 1000,
      }),
      prisma.emailLog.findMany({
        where: { inventarioId: inventario.id },
        select: {
          createdAt: true,
          assunto: true,
          mensagem: true,
          totalEnviados: true,
          status: true,
          remetente: { select: { nome: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.correcaoItem.findMany({
        where: { inventarioId: inventario.id },
        select: {
          numero: true,
          descricao: true,
          observacoes: true,
          dataCorrecao: true,
          inventariante: { select: { nome: true } },
        },
        orderBy: { dataCorrecao: "desc" },
        take: 1000,
      }),
    ]);

    // === Calcular estatísticas em memória (evita dezenas de queries extras) ===

    const totalItens = itens.length;
    const itensInventariadosList = itens.filter((i) => i.dataInventario);
    const itensInventariadosCount = itensInventariadosList.length;
    const itensNaoInventariados = totalItens - itensInventariadosCount;
    const percentualConcluido =
      totalItens > 0
        ? Math.round((itensInventariadosCount / totalItens) * 100)
        : 0;

    const estatisticas = {
      totalItens,
      itensInventariados: itensInventariadosCount,
      itensNaoInventariados,
      totalCorrecoes: listaCorrecoes.length,
      totalSalas: salas.length,
      percentualConcluido,
    };

    // Datas do inventário (primeiro e último item inventariado)
    const datasInventario = itensInventariadosList
      .map((i) => new Date(i.dataInventario))
      .sort((a, b) => a - b);

    const primeiroItemData =
      datasInventario.length > 0 ? datasInventario[0] : null;
    const ultimoItemData =
      datasInventario.length > 0
        ? datasInventario[datasInventario.length - 1]
        : null;

    // Itens por status de inventário
    const itensPorStatus = {};
    itens.forEach((item) => {
      let status;
      if (!item.dataInventario) {
        status = "PENDENTE";
      } else if (item.numero?.startsWith("99999")) {
        status = "SEM ETIQUETA";
      } else if (item.cadastradoDuranteInventario) {
        status = "CADASTRADO";
      } else if (item.salaEncontrada && item.salaEncontrada !== item.sala) {
        status = "MOVIDO";
      } else {
        status = "INVENTARIADO";
      }
      itensPorStatus[status] = (itensPorStatus[status] || 0) + 1;
    });

    // Adicionar contagem de itens corrigidos
    if (listaCorrecoes.length > 0) {
      itensPorStatus["CORRIGIDO"] = listaCorrecoes.length;
    }

    // Estatísticas por sala — calculado em memória (substituiu N*2 queries)
    const salaPorNome = {};
    itens.forEach((item) => {
      const sala = item.sala || "Sem sala";
      if (!salaPorNome[sala]) {
        salaPorNome[sala] = { totalItens: 0, itensInventariados: 0 };
      }
      salaPorNome[sala].totalItens++;
      if (item.dataInventario) {
        salaPorNome[sala].itensInventariados++;
      }
    });
    const estatisticasPorSala = Object.entries(salaPorNome)
      .map(([nome, stats]) => ({
        nome,
        totalItens: stats.totalItens,
        itensInventariados: stats.itensInventariados,
        itensNaoInventariados: stats.totalItens - stats.itensInventariados,
        percentual:
          stats.totalItens > 0
            ? Math.round((stats.itensInventariados / stats.totalItens) * 100)
            : 0,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));

    // Distribuição por servidor/carga atual + dispersão em salas distintas
    const itensPorServidor = {};
    const servidorSalasMap = {};
    itens.forEach((item) => {
      const carga = item.cargaAtual || "Sem carga definida";
      const salaReferencia = item.salaEncontrada || item.sala || "Sem sala";

      if (!itensPorServidor[carga]) {
        itensPorServidor[carga] = { total: 0, inventariados: 0, pendentes: 0 };
      }

      if (!servidorSalasMap[carga]) {
        servidorSalasMap[carga] = {
          salas: new Set(),
          totalBens: 0,
          inventariados: 0,
          pendentes: 0,
        };
      }

      itensPorServidor[carga].total++;
      servidorSalasMap[carga].totalBens++;
      servidorSalasMap[carga].salas.add(salaReferencia);

      if (item.dataInventario) {
        itensPorServidor[carga].inventariados++;
        servidorSalasMap[carga].inventariados++;
      } else {
        itensPorServidor[carga].pendentes++;
        servidorSalasMap[carga].pendentes++;
      }
    });

    const servidoresMultiplasSalas = Object.entries(servidorSalasMap)
      .map(([servidor, stats]) => {
        const quantidadeSalas = stats.salas.size;
        return {
          servidor,
          quantidadeSalas,
          totalBens: stats.totalBens,
          inventariados: stats.inventariados,
          pendentes: stats.pendentes,
          percentualInventariado:
            stats.totalBens > 0
              ? Math.round((stats.inventariados / stats.totalBens) * 100)
              : 0,
        };
      })
      .filter((entry) => entry.quantidadeSalas >= 2)
      .sort((a, b) => {
        if (b.quantidadeSalas !== a.quantidadeSalas) {
          return b.quantidadeSalas - a.quantidadeSalas;
        }
        return b.totalBens - a.totalBens;
      });

    // Itens movidos (salaEncontrada diferente de sala)
    const itensMovidos = itens.filter(
      (i) => i.salaEncontrada && i.salaEncontrada !== i.sala
    );

    // Itens cadastrados durante inventário
    const itensCadastrados = itens.filter((i) => i.cadastradoDuranteInventario);

    // Itens sobra de inventário (bens sem etiqueta - prefixo 99999)
    const itensSobra = itens.filter((i) => i.numero?.startsWith("99999"));

    // Estado de conservação
    const estadoConservacao = {};
    itens.forEach((item) => {
      if (item.estadoConservacao) {
        const estado = item.estadoConservacao;
        estadoConservacao[estado] = (estadoConservacao[estado] || 0) + 1;
      }
    });

    // Distribuição por fornecedor (top 15)
    const fornecedorMap = {};
    itens.forEach((item) => {
      if (item.fornecedor) {
        fornecedorMap[item.fornecedor] =
          (fornecedorMap[item.fornecedor] || 0) + 1;
      }
    });
    const topFornecedores = Object.entries(fornecedorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([nome, quantidade]) => ({ nome, quantidade }));

    // Distribuição por marca (top 15)
    const marcaMap = {};
    itens.forEach((item) => {
      if (item.marca) {
        marcaMap[item.marca] = (marcaMap[item.marca] || 0) + 1;
      }
    });
    const topMarcas = Object.entries(marcaMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([nome, quantidade]) => ({ nome, quantidade }));

    // Valores patrimoniais
    // Parser monetário robusto — suporta pt-BR (1.234,56) e en-US (1,234.56)
    const parseValorMonetario = (valorStr) => {
      if (!valorStr) return 0;
      const limpo = valorStr.replace(/[^\d.,]/g, "");
      if (!limpo) return 0;
      const ultimaVirgula = limpo.lastIndexOf(",");
      const ultimoPonto = limpo.lastIndexOf(".");
      let normalizado;
      if (ultimaVirgula > ultimoPonto) {
        // pt-BR: 1.234,56 — ponto é milhar, vírgula é decimal
        normalizado = limpo.replace(/\./g, "").replace(",", ".");
      } else if (ultimoPonto > ultimaVirgula) {
        // en-US: 1,234.56 — vírgula é milhar, ponto é decimal
        normalizado = limpo.replace(/,/g, "");
      } else {
        normalizado = limpo;
      }
      const valor = parseFloat(normalizado);
      return isNaN(valor) ? 0 : valor;
    };

    let valorTotalAquisicao = 0;
    let valorTotalDepreciado = 0;
    itens.forEach((item) => {
      const vAq = parseValorMonetario(item.valorAquisicao);
      const vDep = parseValorMonetario(item.valorDepreciado);
      if (vAq > 0) valorTotalAquisicao += vAq;
      if (vDep > 0) valorTotalDepreciado += vDep;
    });

    // Classificação ABC por valor de aquisição (Categoria A = top 20% de itens)
    const itensComValorABC = itens
      .map((item) => ({
        ...item,
        _valorNum: parseValorMonetario(item.valorAquisicao),
      }))
      .filter((item) => item._valorNum > 0)
      .sort((a, b) => b._valorNum - a._valorNum);

    const valorTotalABC = itensComValorABC.reduce(
      (acc, i) => acc + i._valorNum,
      0
    );
    const totalItensComValor = itensComValorABC.length;
    const quantidadeCategoriaA =
      totalItensComValor > 0
        ? Math.max(1, Math.ceil(totalItensComValor * 0.2))
        : 0;
    const listaCategoriA = itensComValorABC.slice(0, quantidadeCategoriaA);

    const categoriaANaoLocalizados = listaCategoriA.filter(
      (i) => !i.dataInventario
    );

    const classificacaoABC = {
      regra: "Categoria A: 20% dos itens com maior valor de aquisição",
      totalItensComValor,
      valorTotalAquisicaoABC: valorTotalABC,
      categoriaA: {
        total: listaCategoriA.length,
        percentualItens:
          totalItensComValor > 0
            ? Math.round((listaCategoriA.length / totalItensComValor) * 100)
            : 0,
        lista: listaCategoriA.map((i, idx) => ({
          posicao: idx + 1,
          numero: i.numero,
          descricao: i.descricao || "—",
          valorAquisicao: i.valorAquisicao || "—",
          valorNumerico: i._valorNum,
          sala: i.salaEncontrada || i.sala || "—",
          cargaAtual: i.cargaAtual || "—",
          estadoConservacao: i.estadoConservacao || "—",
          localizado: !!i.dataInventario,
        })),
      },
      categoriaANaoLocalizados: {
        total: categoriaANaoLocalizados.length,
        lista: categoriaANaoLocalizados.map((i, idx) => ({
          posicao: idx + 1,
          numero: i.numero,
          descricao: i.descricao || "—",
          valorAquisicao: i.valorAquisicao || "—",
          valorNumerico: i._valorNum,
          sala: i.sala || "—",
          cargaAtual: i.cargaAtual || "—",
          estadoConservacao: i.estadoConservacao || "—",
        })),
      },
    };

    // Membros da comissão (apenas Presidente, Vice-Presidente e Membro)
    const cargosComissao = ["Presidente", "Vice-Presidente", "Membro"];
    const todosMembros = [
      {
        nome: inventario.proprietario.nome,
        email: inventario.proprietario.email,
        papel: inventario.cargoProprietario || "Servidor(a)",
      },
      ...permissoesInventario.map((p) => ({
        nome: p.usuario.nome,
        email: p.usuario.email,
        papel: p.cargo || "Servidor(a)",
      })),
    ];
    const membros = todosMembros.filter((m) =>
      cargosComissao.includes(m.papel)
    );

    // Correções por usuário — calculado em memória a partir das correções já carregadas
    const correcoesPorUsuarioMap = {};
    listaCorrecoes.forEach((c) => {
      const nome = c.inventariante?.nome || "Desconhecido";
      correcoesPorUsuarioMap[nome] = (correcoesPorUsuarioMap[nome] || 0) + 1;
    });
    const correcoesPorUsuarioDetalhado = Object.entries(correcoesPorUsuarioMap)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);

    // Timeline resumida (do audit log)
    const timeline = auditLogs.map((log) => ({
      data: log.timestamp,
      acao: log.acao,
      usuario: log.usuario?.nome || "Sistema",
      detalhes: log.detalhes,
    }));

    return NextResponse.json({
      inventario: {
        nome: inventario.nome,
        nomeExibicao: inventario.nomeExibicao,
        dataCriacao: inventario.createdAt,
        proprietario: inventario.proprietario.nome,
      },
      estatisticas,
      datas: {
        criacao: inventario.createdAt,
        primeiroItemInventariado: primeiroItemData,
        ultimoItemInventariado: ultimoItemData,
        duracaoDias:
          primeiroItemData && ultimoItemData
            ? Math.ceil(
                (ultimoItemData - primeiroItemData) / (1000 * 60 * 60 * 24)
              ) + 1
            : 0,
      },
      itensPorStatus,
      estatisticasPorSala,
      itensPorServidor,
      servidoresMultiplasSalas,
      itensMovidos: {
        total: itensMovidos.length,
        lista: itensMovidos.map((i) => ({
          numero: i.numero,
          descricao: i.descricao,
          salaOriginal: i.sala,
          salaEncontrada: i.salaEncontrada,
        })),
      },
      itensCadastrados: {
        total: itensCadastrados.length,
        lista: itensCadastrados.map((i) => ({
          numero: i.numero,
          descricao: i.descricao,
          sala: i.sala || i.salaEncontrada || "—",
        })),
      },
      itensSobra: {
        total: itensSobra.length,
        lista: itensSobra.map((i) => ({
          numero: i.numero,
          descricao: i.descricao,
          sala: i.sala || i.salaEncontrada || "—",
        })),
      },
      correcoesRealizadas: {
        total: listaCorrecoes.length,
        porUsuario: correcoesPorUsuarioDetalhado,
        lista: listaCorrecoes.map((c) => ({
          numero: c.numero,
          descricao: c.descricao || "—",
          observacoes: c.observacoes || "—",
          responsavel: c.inventariante?.nome || "Desconhecido",
          data: c.dataCorrecao,
        })),
      },
      estadoConservacao,
      valoresPatrimoniais: {
        valorTotalAquisicao,
        valorTotalDepreciado,
      },
      membrosComissao: membros,
      totalServidores: servidores.length,
      totalSalas: salas.length,
      topFornecedores,
      topMarcas,
      classificacaoABC,
      timeline,
      comunicacoes: {
        total: emailLogs.length,
        lista: emailLogs.map((e) => ({
          data: e.createdAt,
          assunto: e.assunto,
          mensagem: e.mensagem || "—",
          remetente: e.remetente?.nome || "Desconhecido",
          totalEnviados: e.totalEnviados,
          status: e.status,
        })),
      },
    });
  } catch (error) {
    console.error("[RELATORIO-FINAL] Erro:", error);
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    );
  }
}
