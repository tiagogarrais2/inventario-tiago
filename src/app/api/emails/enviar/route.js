import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { isOwner } from "../../../lib/permissoes.js";
import {
  EmailService,
  ServidorService,
  ItemInventarioService,
  InventarioService,
} from "../../../../lib/services.js";

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
      inventario,
      assunto,
      mensagem,
      tipoFiltro,
      filtroMin,
      filtroMax,
      qtdMin,
      qtdMax,
      emailsManuais,
    } = await request.json();

    if (!inventario || !assunto || !mensagem) {
      return NextResponse.json(
        { error: "Campos obrigatórios: inventario, assunto, mensagem." },
        { status: 400 }
      );
    }

    // Modo manual: lista de emails fornecida diretamente
    if (Array.isArray(emailsManuais) && emailsManuais.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalido = emailsManuais.find((e) => !emailRegex.test(e));
      if (invalido) {
        return NextResponse.json(
          { error: `Email inválido na lista: ${invalido}` },
          { status: 400 }
        );
      }

      const proprietario = await isOwner(inventario, session.user.email);
      if (!proprietario) {
        return NextResponse.json(
          { error: "Apenas o proprietário do inventário pode enviar emails." },
          { status: 403 }
        );
      }

      const destinatarios = emailsManuais.map((email) => ({
        nome: email,
        email,
        pendentes: null,
        total: null,
        pendenciaPct: null,
      }));

      let status = "enviado";
      let erroDetalhes = null;

      try {
        await EmailService.sendBCC(emailsManuais, assunto, mensagem);
      } catch (emailError) {
        console.error("Erro ao enviar email:", emailError);
        status = "erro";
        erroDetalhes = emailError.message;
      }

      await EmailService.logEnvio(inventario, session.user.email, {
        assunto,
        mensagem,
        destinatarios,
        filtroMin: null,
        filtroMax: null,
        totalEnviados: destinatarios.length,
        status,
        erroDetalhes,
      });

      if (status === "erro") {
        return NextResponse.json(
          {
            error:
              "Erro ao enviar emails. O envio foi registrado para referência.",
            detalhes: erroDetalhes,
            destinatarios,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        totalEnviados: destinatarios.length,
        destinatarios,
      });
    }

    // Modo filtro: validação dos filtros
    const isPorQuantidade = tipoFiltro === "quantidade";

    if (isPorQuantidade) {
      if (qtdMin == null || qtdMin < 0) {
        return NextResponse.json(
          { error: "Informe um valor mínimo válido para a quantidade de pendências." },
          { status: 400 }
        );
      }
      if (qtdMax != null && qtdMax !== "" && Number(qtdMax) < Number(qtdMin)) {
        return NextResponse.json(
          { error: "Quantidade mínima não pode ser maior que a máxima." },
          { status: 400 }
        );
      }
    } else {
      if (filtroMin == null || filtroMax == null) {
        return NextResponse.json(
          {
            error:
              "Informe filtroMin e filtroMax para envio por filtro, ou emailsManuais para envio manual.",
          },
          { status: 400 }
        );
      }

      if (filtroMin < 0 || filtroMax > 100 || filtroMin > filtroMax) {
        return NextResponse.json(
          {
            error:
              "Faixa de filtro inválida. Min deve ser <= Max, entre 0 e 100.",
          },
          { status: 400 }
        );
      }
    }

    const proprietario = await isOwner(inventario, session.user.email);
    if (!proprietario) {
      return NextResponse.json(
        { error: "Apenas o proprietário do inventário pode enviar emails." },
        { status: 403 }
      );
    }

    // Buscar servidores com email e itens do inventário
    const [servidores, itens] = await Promise.all([
      ServidorService.listByInventarioComEmail(inventario),
      ItemInventarioService.findByInventario(inventario),
    ]);

    // Calcular % e quantidade de pendência de cada servidor
    const itensPorServidor = {};
    for (const item of itens) {
      const srv = item.cargaAtual || "Servidor não definido";
      if (!itensPorServidor[srv])
        itensPorServidor[srv] = { total: 0, pendentes: 0 };
      itensPorServidor[srv].total++;
      if (!item.dataInventario) itensPorServidor[srv].pendentes++;
    }

    // Filtrar servidores pela faixa selecionada (% ou quantidade) e que tenham email
    const destinatarios = [];
    const minQtdNum = isPorQuantidade ? Number(qtdMin) : 0;
    const maxQtdNum =
      isPorQuantidade && qtdMax != null && qtdMax !== ""
        ? Number(qtdMax)
        : Infinity;

    for (const srv of servidores) {
      const stats = itensPorServidor[srv.nome];
      if (!stats || !srv.email) continue;

      const pct = stats.total > 0 ? (stats.pendentes / stats.total) * 100 : 0;

      let atendeFiltro = false;
      if (isPorQuantidade) {
        atendeFiltro =
          stats.pendentes >= minQtdNum && stats.pendentes <= maxQtdNum;
      } else {
        atendeFiltro = pct >= filtroMin && pct <= filtroMax;
      }

      if (atendeFiltro) {
        destinatarios.push({
          nome: srv.nome,
          email: srv.email,
          pendentes: stats.pendentes,
          total: stats.total,
          pendenciaPct: Math.round(pct),
        });
      }
    }

    if (destinatarios.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhum servidor com email cadastrado encontrado na faixa de filtro selecionada.",
        },
        { status: 404 }
      );
    }

    // Enviar email BCC
    const bccList = destinatarios.map((d) => d.email);
    let status = "enviado";
    let erroDetalhes = null;

    try {
      await EmailService.sendBCC(bccList, assunto, mensagem);
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError);
      status = "erro";
      erroDetalhes = emailError.message;
    }

    // Registrar envio no log
    await EmailService.logEnvio(inventario, session.user.email, {
      assunto,
      mensagem,
      destinatarios,
      filtroMin: isPorQuantidade ? (qtdMin != null ? Number(qtdMin) : 0) : (filtroMin != null ? Number(filtroMin) : 0),
      filtroMax: isPorQuantidade ? (qtdMax != null && qtdMax !== "" ? Number(qtdMax) : 999999) : (filtroMax != null ? Number(filtroMax) : 100),
      totalEnviados: destinatarios.length,
      status,
      erroDetalhes,
    });

    if (status === "erro") {
      return NextResponse.json(
        {
          error:
            "Erro ao enviar emails. O envio foi registrado para referência.",
          detalhes: erroDetalhes,
          destinatarios,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      totalEnviados: destinatarios.length,
      destinatarios,
    });
  } catch (error) {
    console.error("Erro no envio de emails:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar envio de emails." },
      { status: 500 }
    );
  }
}
