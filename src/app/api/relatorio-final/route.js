import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "../../../lib/db.js";
import { InventarioService, AuditoriaService } from "../../../lib/services.js";

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

    const inventario = await InventarioService.findByName(nomeInventario);
    if (!inventario) {
      return NextResponse.json(
        { error: "Inventário não encontrado." },
        { status: 404 }
      );
    }

    // Buscar todos os dados em paralelo
    const [
      itens,
      salas,
      servidores,
      estatisticas,
      estatisticasPorSala,
      resumoCorrecoes,
      permissoesInventario,
      auditLogs,
      emailLogs,
      listaCorrecoes,
    ] = await Promise.all([
      prisma.itemInventario.findMany({
        where: { inventarioId: inventario.id },
        include: {
          inventariante: { select: { nome: true, email: true } },
        },
      }),
      prisma.sala.findMany({
        where: { inventarioId: inventario.id },
        orderBy: { nome: "asc" },
      }),
      prisma.servidor.findMany({
        where: { inventarioId: inventario.id },
        orderBy: { nome: "asc" },
      }),
      InventarioService.getEstatisticasInventario(inventario.id),
      InventarioService.getEstatisticasPorSala(inventario.id),
      InventarioService.getResumoCorrecoes(inventario.id),
      prisma.permissao.findMany({
        where: { inventarioId: inventario.id, ativa: true },
        include: { usuario: { select: { nome: true, email: true } } },
      }),
      prisma.auditLog.findMany({
        where: { inventarioId: inventario.id },
        include: { usuario: { select: { nome: true } } },
        orderBy: { timestamp: "asc" },
      }),
      prisma.emailLog.findMany({
        where: { inventarioId: inventario.id },
        include: { remetente: { select: { nome: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.correcaoItem.findMany({
        where: { inventarioId: inventario.id },
        include: {
          inventariante: { select: { nome: true } },
        },
        orderBy: { dataCorrecao: "desc" },
      }),
    ]);

    // Datas do inventário (primeiro e último item inventariado)
    const itensInventariados = itens.filter((i) => i.dataInventario);
    const datasInventario = itensInventariados
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
    if (resumoCorrecoes.total > 0) {
      itensPorStatus["CORRIGIDO"] = resumoCorrecoes.total;
    }

    // Distribuição por servidor/carga atual
    const itensPorServidor = {};
    itens.forEach((item) => {
      const carga = item.cargaAtual || "Sem carga definida";
      if (!itensPorServidor[carga]) {
        itensPorServidor[carga] = { total: 0, inventariados: 0, pendentes: 0 };
      }
      itensPorServidor[carga].total++;
      if (item.dataInventario) {
        itensPorServidor[carga].inventariados++;
      } else {
        itensPorServidor[carga].pendentes++;
      }
    });

    // Itens movidos (salaEncontrada diferente de sala)
    const itensMovidos = itens.filter(
      (i) => i.salaEncontrada && i.salaEncontrada !== i.sala
    );

    // Itens cadastrados durante inventário
    const itensCadastrados = itens.filter((i) => i.cadastradoDuranteInventario);

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
    let valorTotalAquisicao = 0;
    let valorTotalDepreciado = 0;
    itens.forEach((item) => {
      const vAq = parseFloat(
        (item.valorAquisicao || "0").replace(/[^\d.,]/g, "").replace(",", ".")
      );
      const vDep = parseFloat(
        (item.valorDepreciado || "0").replace(/[^\d.,]/g, "").replace(",", ".")
      );
      if (!isNaN(vAq)) valorTotalAquisicao += vAq;
      if (!isNaN(vDep)) valorTotalDepreciado += vDep;
    });

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

    // Correções por usuário (com nomes)
    const correcoesPorUsuarioDetalhado = await Promise.all(
      (resumoCorrecoes.porUsuario || []).map(async (item) => {
        if (!item.inventarianteId)
          return { nome: "Desconhecido", total: item._count.id };
        const usuario = await prisma.usuario.findUnique({
          where: { id: item.inventarianteId },
          select: { nome: true },
        });
        return {
          nome: usuario?.nome || "Desconhecido",
          total: item._count.id,
        };
      })
    );

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
      correcoesRealizadas: {
        total: resumoCorrecoes.total,
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
      timeline,
      comunicacoes: {
        total: emailLogs.length,
        lista: emailLogs.map((e) => ({
          data: e.createdAt,
          assunto: e.assunto,
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
