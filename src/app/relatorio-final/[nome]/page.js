"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function formatarData(data) {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const CORES = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#ea580c",
  "#9333ea",
  "#0891b2",
  "#ca8a04",
  "#be185d",
  "#4f46e5",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#0d9488",
  "#e11d48",
  "#6366f1",
];

export default function RelatorioFinalPage({ params }) {
  const unwrappedParams = React.use(params);
  const nome = unwrappedParams?.nome || "";

  const { data: session, status } = useSession();
  const router = useRouter();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (!nome) return;

    async function fetchDados() {
      try {
        const res = await fetch(
          `/api/relatorio-final?inventario=${encodeURIComponent(nome)}`
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erro ao carregar relatório.");
        }
        setDados(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDados();
  }, [nome, status, router]);

  if (status === "loading" || loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <p>Gerando relatório final...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Erro</h2>
        <p>{error}</p>
        <button onClick={() => router.back()}>Voltar</button>
      </div>
    );
  }

  if (!dados) return null;

  const {
    inventario,
    estatisticas,
    datas,
    itensPorStatus,
    estatisticasPorSala,
    itensPorServidor,
    itensMovidos,
    itensCadastrados,
    correcoesRealizadas,
    estadoConservacao,
    valoresPatrimoniais,
    membrosComissao,
    totalServidores,
    totalSalas,
    topFornecedores,
    topMarcas,
    timeline,
    comunicacoes,
  } = dados;

  // === DADOS DOS GRÁFICOS ===

  const pieProgressoData = {
    labels: ["Inventariados", "Pendentes"],
    datasets: [
      {
        data: [
          estatisticas.itensInventariados,
          estatisticas.itensNaoInventariados,
        ],
        backgroundColor: ["#16a34a", "#dc2626"],
      },
    ],
  };

  const statusLabels = Object.keys(itensPorStatus);
  const statusValues = Object.values(itensPorStatus);
  const pieStatusData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: CORES.slice(0, statusLabels.length),
      },
    ],
  };

  const salasTop10 = [...estatisticasPorSala]
    .sort((a, b) => b.totalItens - a.totalItens)
    .slice(0, 10);
  const barSalasData = {
    labels: salasTop10.map((s) =>
      s.nome.length > 20 ? s.nome.substring(0, 20) + "…" : s.nome
    ),
    datasets: [
      {
        label: "Inventariados",
        data: salasTop10.map((s) => s.itensInventariados),
        backgroundColor: "#16a34a",
      },
      {
        label: "Pendentes",
        data: salasTop10.map((s) => s.itensNaoInventariados),
        backgroundColor: "#dc2626",
      },
    ],
  };

  const servidoresEntries = Object.entries(itensPorServidor)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);
  const barServidoresData = {
    labels: servidoresEntries.map(([n]) =>
      n.length > 25 ? n.substring(0, 25) + "…" : n
    ),
    datasets: [
      {
        label: "Inventariados",
        data: servidoresEntries.map(([, v]) => v.inventariados),
        backgroundColor: "#2563eb",
      },
      {
        label: "Pendentes",
        data: servidoresEntries.map(([, v]) => v.pendentes),
        backgroundColor: "#ea580c",
      },
    ],
  };

  const ordemConservacao = [
    "Novo",
    "Bom",
    "Regular",
    "Ocioso",
    "Recuperável",
    "Antieconômico",
    "Irrecuperável",
  ];
  const estadoEntriesOrdenados = Object.entries(estadoConservacao).sort(
    ([a], [b]) => {
      const ia = ordemConservacao.findIndex(
        (o) => o.toLowerCase() === a.toLowerCase()
      );
      const ib = ordemConservacao.findIndex(
        (o) => o.toLowerCase() === b.toLowerCase()
      );
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    }
  );
  const estadoLabels = estadoEntriesOrdenados.map(([k]) => k);
  const estadoValues = estadoEntriesOrdenados.map(([, v]) => v);
  const pieEstadoData = {
    labels: estadoLabels,
    datasets: [
      {
        data: estadoValues,
        backgroundColor: CORES.slice(0, estadoLabels.length),
      },
    ],
  };

  const barFornecedoresData = {
    labels: topFornecedores.map((f) =>
      f.nome.length > 25 ? f.nome.substring(0, 25) + "…" : f.nome
    ),
    datasets: [
      {
        label: "Quantidade de bens",
        data: topFornecedores.map((f) => f.quantidade),
        backgroundColor: "#0891b2",
      },
    ],
  };

  const barMarcasData = {
    labels: topMarcas.map((m) =>
      m.nome.length > 25 ? m.nome.substring(0, 25) + "…" : m.nome
    ),
    datasets: [
      {
        label: "Quantidade de bens",
        data: topMarcas.map((m) => m.quantidade),
        backgroundColor: "#9333ea",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: {
      x: { ticks: { maxRotation: 45, minRotation: 25, font: { size: 10 } } },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "right" } },
  };

  // Numerar seção de considerações finais dinamicamente
  const temComunicacoes = comunicacoes.total > 0;
  const secaoConsideracoes = temComunicacoes ? "6" : "5";

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            background: #fff;
          }
          .no-print {
            display: none !important;
          }
          .relatorio-container {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .page-break {
            page-break-before: always;
          }
          @page {
            size: A4;
            margin: 3cm 2cm 2cm 3cm;
          }
          .grafico-container {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          table {
            font-size: 10pt;
          }
        }

        @media screen {
          .relatorio-container {
            max-width: 900px;
            margin: 2rem auto;
            padding: 2rem 3rem;
            background: #fff;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #1a1a1a;
          }
        }

        .relatorio-container h1 {
          font-size: 16pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
        }
        .relatorio-container h2 {
          font-size: 14pt;
          font-weight: bold;
          margin-top: 2rem;
          margin-bottom: 0.8rem;
          border-bottom: 1px solid #ccc;
          padding-bottom: 0.3rem;
        }
        .relatorio-container h3 {
          font-size: 13pt;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .relatorio-container p {
          text-align: justify;
          text-indent: 1.25cm;
          margin-bottom: 0.6rem;
        }
        .relatorio-container p.no-indent {
          text-indent: 0;
        }
        .relatorio-container table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          table-layout: fixed;
        }
        .relatorio-container th,
        .relatorio-container td {
          border: 1px solid #999;
          padding: 6px 10px;
          text-align: left;
          font-size: 11pt;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        .relatorio-container th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .relatorio-container .capa {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
          text-align: center;
        }
        .relatorio-container .capa h1 {
          font-size: 18pt;
          margin-bottom: 1rem;
        }
        .relatorio-container .capa p {
          text-indent: 0;
          text-align: center;
          font-size: 14pt;
        }
        .grafico-container {
          margin: 1.5rem 0;
          height: 320px;
          position: relative;
        }
        .grafico-container.pie-chart {
          height: 280px;
          max-width: 450px;
          margin-left: auto;
          margin-right: auto;
        }
        .quadro-resumo {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 1rem 1.5rem;
          margin: 1rem 0;
        }
        .quadro-resumo p {
          text-indent: 0;
          margin-bottom: 0.3rem;
        }
      `}</style>

      {/* Botões fixos - não aparecem na impressão */}
      <div
        className="no-print"
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          zIndex: 1000,
          display: "flex",
          gap: "0.5rem",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            padding: "0.6rem 1.2rem",
            background: "#6c757d",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "11pt",
          }}
        >
          ← Voltar
        </button>
        <button
          onClick={() => window.print()}
          style={{
            padding: "0.6rem 1.2rem",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "11pt",
          }}
        >
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      <div className="relatorio-container">
        {/* ============= CAPA ============= */}
        <div className="capa">
          <p style={{ fontSize: "14pt", marginBottom: "3rem" }}>
            SISTEMA DE INVENTÁRIO PATRIMONIAL
          </p>
          <h1>RELATÓRIO FINAL DE INVENTÁRIO</h1>
          <p style={{ fontSize: "16pt", fontWeight: "bold" }}>
            {inventario.nomeExibicao || inventario.nome}
          </p>
          <div style={{ marginTop: "4rem" }}>
            {membrosComissao.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <p
                  style={{
                    fontSize: "12pt",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                  }}
                >
                  Comissão de Inventário
                </p>
                {membrosComissao.map((m, i) => (
                  <p
                    key={i}
                    style={{ fontSize: "12pt", marginBottom: "0.2rem" }}
                  >
                    {m.nome} — {m.papel}
                  </p>
                ))}
              </div>
            )}
            <p style={{ marginTop: "2rem" }}>{formatarData(datas.criacao)}</p>
          </div>
        </div>

        {/* ============= FOLHA DE ROSTO ============= */}
        <div className="page-break">
          <h2>Identificação do Inventário</h2>
          <table>
            <tbody>
              <tr>
                <th>Nome do Inventário</th>
                <td>{inventario.nomeExibicao || inventario.nome}</td>
              </tr>
              <tr>
                <th>Identificador</th>
                <td>{inventario.nome}</td>
              </tr>
              <tr>
                <th>Data da Carga</th>
                <td>{formatarData(datas.criacao)}</td>
              </tr>
              <tr>
                <th>Primeiro Item Inventariado</th>
                <td>{formatarData(datas.primeiroItemInventariado)}</td>
              </tr>
              <tr>
                <th>Último Item Inventariado</th>
                <td>{formatarData(datas.ultimoItemInventariado)}</td>
              </tr>
              <tr>
                <th>Duração do Inventário</th>
                <td>
                  {datas.duracaoDias > 0 ? `${datas.duracaoDias} dia(s)` : "—"}
                </td>
              </tr>
            </tbody>
          </table>

          <h3>Comissão de Inventário</h3>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
              </tr>
            </thead>
            <tbody>
              {membrosComissao.map((m, i) => (
                <tr key={i}>
                  <td>{m.nome}</td>
                  <td>{m.email}</td>
                  <td>{m.papel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ============= 1. INTRODUÇÃO ============= */}
        <div className="page-break">
          <h2>1 INTRODUÇÃO</h2>
          <p>
            O presente relatório tem como objetivo apresentar os resultados do
            inventário patrimonial realizado por meio do Sistema de Inventário
            Patrimonial. O inventário denominado &ldquo;
            {inventario.nome}&rdquo; foi iniciado em{" "}
            {formatarData(datas.criacao)}, sob a responsabilidade do(a)
            Presidente{" "}
            {membrosComissao.find((m) => m.papel === "Presidente")?.nome ||
              inventario.proprietario}
            , contando com a participação de {membrosComissao.length} membro(s)
            na comissão de inventário.
          </p>
          <p>
            O acervo patrimonial objeto deste inventário é composto por{" "}
            {estatisticas.totalItens.toLocaleString("pt-BR")} bens distribuídos
            em {totalSalas} sala(s) e sob a responsabilidade de{" "}
            {totalServidores} servidor(es). O período de realização do
            inventário compreendeu de{" "}
            {formatarData(datas.primeiroItemInventariado)} a{" "}
            {formatarData(datas.ultimoItemInventariado)}, totalizando{" "}
            {datas.duracaoDias > 0
              ? `${datas.duracaoDias} dia(s)`
              : "período não definido"}{" "}
            de execução.
          </p>
        </div>

        {/* ============= 2. METODOLOGIA ============= */}
        <div className="page-break">
          <h2>2 METODOLOGIA</h2>
          <p>
            O inventário foi conduzido por meio de sistema informatizado
            dedicado, que permite o registro, acompanhamento e controle de todos
            os bens patrimoniais. O processo seguiu as seguintes etapas:
          </p>
          <p>
            Primeiramente, foi realizada a carga dos dados patrimoniais no
            sistema, contendo as informações de todos os bens a serem
            inventariados, incluindo número de tombamento, descrição, sala de
            localização, servidor responsável (carga atual), estado de
            conservação e valores patrimoniais.
          </p>
          <p>
            Em seguida, a comissão de inventário procedeu à verificação física
            de cada bem, registrando no sistema a confirmação de localização, o
            estado de conservação encontrado e eventuais divergências. Nos casos
            em que foram identificadas inconsistências, o sistema permitiu o
            registro de correções, mantendo o histórico completo de alterações.
          </p>
          <p>
            O acompanhamento do progresso foi realizado em tempo real por meio
            de relatórios e painéis de controle disponibilizados pelo sistema,
            permitindo à comissão identificar pendências e priorizar ações.
          </p>
        </div>

        {/* ============= 3. RESULTADOS ============= */}
        <div className="page-break">
          <h2>3 RESULTADOS</h2>

          {/* 3.1 Visão Geral */}
          <h3>3.1 Visão Geral</h3>
          <div className="quadro-resumo">
            <p>
              <strong>Total de bens:</strong>{" "}
              {estatisticas.totalItens.toLocaleString("pt-BR")}
            </p>
            <p>
              <strong>Bens inventariados:</strong>{" "}
              {estatisticas.itensInventariados.toLocaleString("pt-BR")}
            </p>
            <p>
              <strong>Bens pendentes:</strong>{" "}
              {estatisticas.itensNaoInventariados.toLocaleString("pt-BR")}
            </p>
            <p>
              <strong>Progresso:</strong> {estatisticas.percentualConcluido}%
            </p>
            <p>
              <strong>Total de salas:</strong> {totalSalas}
            </p>
            <p>
              <strong>Total de servidores:</strong> {totalServidores}
            </p>
            <p>
              <strong>Correções realizadas:</strong> {correcoesRealizadas.total}
            </p>
            <p>
              <strong>Itens movidos de sala:</strong> {itensMovidos.total}
            </p>
            <p>
              <strong>Itens cadastrados durante o inventário:</strong>{" "}
              {itensCadastrados.total}
            </p>
          </div>

          {/* 3.2 Progresso */}
          <h3>3.2 Progresso do Inventário</h3>
          <p>
            Do total de {estatisticas.totalItens.toLocaleString("pt-BR")} bens,{" "}
            {estatisticas.itensInventariados.toLocaleString("pt-BR")} foram
            inventariados, o que corresponde a{" "}
            {estatisticas.percentualConcluido}% do acervo. Restam{" "}
            {estatisticas.itensNaoInventariados.toLocaleString("pt-BR")} bens
            pendentes de verificação.
          </p>
          <p
            className="no-indent"
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "11pt",
            }}
          >
            Gráfico 1 — Progresso geral do inventário
          </p>
          <div className="grafico-container pie-chart">
            <Pie data={pieProgressoData} options={pieOptions} />
          </div>

          {/* 3.3 Itens por Status */}
          <h3>3.3 Distribuição por Status</h3>
          <p>
            Os itens do inventário foram classificados conforme seu status de
            processamento. A seguir, apresenta-se a distribuição:
          </p>
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(itensPorStatus).map(([st, qtd]) => (
                <tr key={st}>
                  <td>{st}</td>
                  <td>{qtd.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p
            className="no-indent"
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "11pt",
            }}
          >
            Gráfico 2 — Distribuição dos itens por status
          </p>
          <div className="grafico-container pie-chart">
            <Pie data={pieStatusData} options={pieOptions} />
          </div>
        </div>

        {/* 3.4 Distribuição por Sala */}
        <div className="page-break">
          <h3>3.4 Distribuição por Sala</h3>
          <p>
            Os bens patrimoniais encontram-se distribuídos em {totalSalas}{" "}
            salas. A tabela a seguir apresenta o detalhamento por sala:
          </p>
          <table>
            <thead>
              <tr>
                <th>Sala</th>
                <th>Total</th>
                <th>Inventariados</th>
                <th>Pendentes</th>
                <th>% Concluído</th>
              </tr>
            </thead>
            <tbody>
              {estatisticasPorSala.map((sala, i) => (
                <tr key={i}>
                  <td>{sala.nome}</td>
                  <td>{sala.totalItens}</td>
                  <td>{sala.itensInventariados}</td>
                  <td>{sala.itensNaoInventariados}</td>
                  <td>{sala.percentual}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {salasTop10.length > 0 && (
            <>
              <p
                className="no-indent"
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "11pt",
                }}
              >
                Gráfico 3 — Distribuição de itens por sala (top 10)
              </p>
              <div className="grafico-container" style={{ height: "380px" }}>
                <Bar data={barSalasData} options={barOptions} />
              </div>
            </>
          )}
        </div>

        {/* 3.5 Distribuição por Servidor */}
        <div className="page-break">
          <h3>3.5 Distribuição por Servidor / Carga Atual</h3>
          <p>
            Os bens estão vinculados a {totalServidores} servidores (cargas
            atuais). A tabela a seguir apresenta o detalhamento:
          </p>
          <table>
            <thead>
              <tr>
                <th>Servidor / Carga</th>
                <th>Total</th>
                <th>Inventariados</th>
                <th>Pendentes</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(itensPorServidor)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([nomeServ, v], i) => (
                  <tr key={i}>
                    <td>{nomeServ}</td>
                    <td>{v.total}</td>
                    <td>{v.inventariados}</td>
                    <td>{v.pendentes}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {servidoresEntries.length > 0 && (
            <>
              <p
                className="no-indent"
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "11pt",
                }}
              >
                Gráfico 4 — Distribuição de itens por servidor (top 10)
              </p>
              <div className="grafico-container" style={{ height: "380px" }}>
                <Bar data={barServidoresData} options={barOptions} />
              </div>
            </>
          )}
        </div>

        {/* 3.6 Movimentação Patrimonial */}
        <div className="page-break">
          <h3>3.6 Movimentação Patrimonial</h3>
          <p>
            Durante o inventário, foram identificados {itensMovidos.total}{" "}
            bem(ns) cuja localização encontrada difere da localização
            registrada, caracterizando movimentação patrimonial.
          </p>
          {itensMovidos.total > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Nº Tombo</th>
                  <th>Descrição</th>
                  <th>Sala Original</th>
                  <th>Sala Encontrada</th>
                </tr>
              </thead>
              <tbody>
                {itensMovidos.lista.map((item, i) => (
                  <tr key={i}>
                    <td>{item.numero}</td>
                    <td>{item.descricao}</td>
                    <td>{item.salaOriginal}</td>
                    <td>{item.salaEncontrada}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 3.7 Itens Cadastrados Durante o Inventário */}
        <h3>3.7 Itens Cadastrados Durante o Inventário</h3>
        <p>
          Durante o processo de inventário, {itensCadastrados.total} bem(ns)
          foi(foram) cadastrado(s) diretamente no sistema, ou seja, não
          constavam na carga inicial de dados.
        </p>
        {itensCadastrados.total > 0 && (
          <table>
            <thead>
              <tr>
                <th>Nº Tombo</th>
                <th>Descrição</th>
                <th>Sala</th>
              </tr>
            </thead>
            <tbody>
              {itensCadastrados.lista.map((item, i) => (
                <tr key={i}>
                  <td>{item.numero}</td>
                  <td>{item.descricao}</td>
                  <td>{item.sala}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 3.8 Correções Realizadas */}
        <div className="page-break">
          <h3>3.8 Correções Realizadas</h3>
          <p>
            Foram registradas {correcoesRealizadas.total} correção(ões) durante
            o inventário. As correções são alterações realizadas nos dados dos
            bens para adequação às informações verificadas in loco.
          </p>
          {correcoesRealizadas.porUsuario.length > 0 && (
            <>
              <p className="no-indent">
                <strong>Correções por membro da comissão:</strong>
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Membro</th>
                    <th>Correções Realizadas</th>
                  </tr>
                </thead>
                <tbody>
                  {correcoesRealizadas.porUsuario.map((c, i) => (
                    <tr key={i}>
                      <td>{c.nome}</td>
                      <td>{c.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {correcoesRealizadas.lista && correcoesRealizadas.lista.length > 0 && (
            <>
              <p className="no-indent">
                <strong>Detalhamento das correções:</strong>
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Nº Tombo</th>
                    <th>Descrição</th>
                    <th>Observações</th>
                    <th>Responsável</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {correcoesRealizadas.lista.map((c, i) => (
                    <tr key={i}>
                      <td>{c.numero}</td>
                      <td>{c.descricao}</td>
                      <td>{c.observacoes}</td>
                      <td>{c.responsavel}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {c.data
                          ? new Date(c.data).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* 3.9 Estado de Conservação */}
        <h3>3.9 Estado de Conservação</h3>
        <p>
          A verificação física dos bens permitiu avaliar o estado de conservação
          dos itens inventariados. A distribuição encontra-se a seguir:
        </p>
        {estadoLabels.length > 0 ? (
          <>
            <table>
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {estadoEntriesOrdenados.map(([estado, qtd]) => (
                  <tr key={estado}>
                    <td>{estado}</td>
                    <td>{qtd.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p
              className="no-indent"
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "11pt",
              }}
            >
              Gráfico 5 — Distribuição por estado de conservação
            </p>
            <div className="grafico-container pie-chart">
              <Pie data={pieEstadoData} options={pieOptions} />
            </div>
          </>
        ) : (
          <p>Nenhum dado de estado de conservação registrado.</p>
        )}

        {/* 3.10 Valores Patrimoniais */}
        <div className="page-break">
          <h3>3.10 Valores Patrimoniais</h3>
          <p>
            O acervo patrimonial inventariado apresenta valor total de aquisição
            de {formatarMoeda(valoresPatrimoniais.valorTotalAquisicao)} e valor
            depreciado de{" "}
            {formatarMoeda(valoresPatrimoniais.valorTotalDepreciado)}.
          </p>
        </div>

        {/* 3.11 Distribuição por Fornecedor */}
        {topFornecedores.length > 0 && (
          <>
            <h3>3.11 Distribuição por Fornecedor</h3>
            <p>
              Os bens patrimoniais foram adquiridos de diversos fornecedores. A
              seguir, apresentam-se os {topFornecedores.length} principais:
            </p>
            <p
              className="no-indent"
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "11pt",
              }}
            >
              Gráfico 6 — Principais fornecedores
            </p>
            <div className="grafico-container" style={{ height: "350px" }}>
              <Bar data={barFornecedoresData} options={barOptions} />
            </div>
          </>
        )}

        {/* 3.12 Distribuição por Marca */}
        {topMarcas.length > 0 && (
          <>
            <h3>3.12 Distribuição por Marca</h3>
            <p>
              A seguir, apresentam-se as {topMarcas.length} principais marcas
              entre os bens inventariados:
            </p>
            <p
              className="no-indent"
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "11pt",
              }}
            >
              Gráfico 7 — Principais marcas
            </p>
            <div className="grafico-container" style={{ height: "350px" }}>
              <Bar data={barMarcasData} options={barOptions} />
            </div>
          </>
        )}

        {/* ============= 4. CRONOLOGIA ============= */}
        <div className="page-break">
          <h2>4 CRONOLOGIA DO INVENTÁRIO</h2>
          <p>
            O registro de atividades do sistema permite reconstruir a cronologia
            do processo de inventário. A seguir, apresentam-se os principais
            eventos registrados:
          </p>
          {timeline.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Ação</th>
                  <th>Usuário</th>
                </tr>
              </thead>
              <tbody>
                {timeline.slice(0, 50).map((t, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(t.data).toLocaleString("pt-BR")}
                    </td>
                    <td>{t.acao}</td>
                    <td>{t.usuario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Nenhum registro de atividade encontrado.</p>
          )}
          {timeline.length > 50 && (
            <p className="no-indent" style={{ fontStyle: "italic" }}>
              Exibindo os primeiros 50 registros de um total de{" "}
              {timeline.length}.
            </p>
          )}
        </div>

        {/* ============= 5. COMUNICAÇÕES ============= */}
        {temComunicacoes && (
          <div className="page-break">
            <h2>5 COMUNICAÇÕES REALIZADAS</h2>
            <p>
              Durante o inventário, foram realizadas {comunicacoes.total}{" "}
              comunicação(ões) por e-mail para servidores e membros relacionados
              ao processo:
            </p>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Assunto</th>
                  <th>Remetente</th>
                  <th>Destinatários</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {comunicacoes.lista.map((c, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatarData(c.data)}
                    </td>
                    <td>{c.assunto}</td>
                    <td>{c.remetente}</td>
                    <td>{c.totalEnviados}</td>
                    <td>{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ============= CONSIDERAÇÕES FINAIS ============= */}
        <div className="page-break">
          <h2>{secaoConsideracoes} CONSIDERAÇÕES FINAIS</h2>
          <p>
            O inventário patrimonial &ldquo;
            {inventario.nomeExibicao || inventario.nome}&rdquo;{" "}
            {estatisticas.percentualConcluido >= 100
              ? "foi concluído com êxito"
              : `encontra-se com ${estatisticas.percentualConcluido}% de progresso`}
            . Do total de {estatisticas.totalItens.toLocaleString("pt-BR")} bens
            registrados,{" "}
            {estatisticas.itensInventariados.toLocaleString("pt-BR")} foram
            devidamente verificados e registrados no sistema.
          </p>
          <p>
            Durante o processo, foram identificados {itensMovidos.total} bem(ns)
            com divergência de localização, {correcoesRealizadas.total}{" "}
            correção(ões) foi(foram) realizada(s) para adequação dos registros e{" "}
            {itensCadastrados.total} bem(ns) foi(foram) cadastrado(s)
            diretamente no sistema durante a execução do inventário.
          </p>
          <p>
            O valor total do acervo patrimonial inventariado corresponde a{" "}
            {formatarMoeda(valoresPatrimoniais.valorTotalAquisicao)} em valor de
            aquisição e{" "}
            {formatarMoeda(valoresPatrimoniais.valorTotalDepreciado)} em valor
            depreciado.
          </p>
          <p>
            O presente relatório foi gerado automaticamente pelo Sistema de
            Inventário Patrimonial em{" "}
            {new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        </div>
      </div>
    </>
  );
}
