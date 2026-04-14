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

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

import {
  buildPieProgressoData,
  buildPieStatusData,
  buildBarSalasData,
  buildPieEstadoData,
  buildBarMarcasData,
  barOptions,
  pieOptions,
} from "./chartConfig";

import Capa from "./sections/Capa";
import Introducao from "./sections/Introducao";
import Metodologia from "./sections/Metodologia";
import Resultados from "./sections/Resultados";
import SecoesFinais from "./sections/SecoesFinais";

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      try {
        const res = await fetch(
          `/api/relatorio-final?inventario=${encodeURIComponent(nome)}`,
          { signal: controller.signal, cache: "no-store" }
        );
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erro ao carregar relatório.");
        }
        setDados(await res.json());
      } catch (e) {
        if (e.name === "AbortError") {
          setError(
            "A geração do relatório excedeu o tempo limite (45s). Tente novamente ou reduza o volume de dados."
          );
        } else {
          setError(e.message || "Falha de rede ao carregar relatório.");
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }
    fetchDados();
  }, [nome, status, router]);

  // === CÁLCULO DE MÉTRICAS DE SERVIDORES (DEVE ESTAR ANTES DE RETORNOS CONDICIONAIS) ===
  const servidoresMetricas = React.useMemo(() => {
    if (
      !dados?.itensPorServidor ||
      Object.keys(dados?.itensPorServidor || {}).length === 0
    ) {
      return {
        totalServidoresComDados: 0,
        cargaMedia: 0,
        percentualInventariados: 0,
        percentualPendentes: 0,
        servidorMaiorCarga: null,
        maiorCargaTotal: 0,
        servidorMenorCarga: null,
        menorCargaTotal: 0,
      };
    }

    const itensPorServidor = dados.itensPorServidor;
    const servidores = Object.entries(itensPorServidor);
    const totalBens = servidores.reduce(
      (acc, [_, stats]) => acc + stats.total,
      0
    );
    const totalInventariados = servidores.reduce(
      (acc, [_, stats]) => acc + stats.inventariados,
      0
    );
    const totalPendentes = servidores.reduce(
      (acc, [_, stats]) => acc + stats.pendentes,
      0
    );

    let maiorCarga = { servidor: null, total: 0 };
    let menorCarga = { servidor: null, total: Infinity };

    servidores.forEach(([servidor, stats]) => {
      if (stats.total > maiorCarga.total) {
        maiorCarga = { servidor, total: stats.total };
      }
      if (stats.total < menorCarga.total) {
        menorCarga = { servidor, total: stats.total };
      }
    });

    return {
      totalServidoresComDados: servidores.length,
      cargaMedia: totalBens > 0 ? Math.round(totalBens / servidores.length) : 0,
      percentualInventariados:
        totalBens > 0 ? Math.round((totalInventariados / totalBens) * 100) : 0,
      percentualPendentes:
        totalBens > 0 ? Math.round((totalPendentes / totalBens) * 100) : 0,
      servidorMaiorCarga: maiorCarga.servidor,
      maiorCargaTotal: maiorCarga.total,
      servidorMenorCarga: menorCarga.servidor,
      menorCargaTotal: menorCarga.total,
    };
  }, [dados]);

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
    servidoresMultiplasSalas,
    itensMovidos,
    itensCadastrados,
    itensSobra,
    correcoesRealizadas,
    estadoConservacao,
    membrosComissao,
    totalServidores,
    totalSalas,
    topMarcas,
    classificacaoABC,
    timeline,
    comunicacoes,
  } = dados;

  // === DADOS DOS GRÁFICOS ===
  const pieProgressoData = buildPieProgressoData(estatisticas);
  const pieStatusData = buildPieStatusData(itensPorStatus);
  const { salasTop, chartData: barSalasData } =
    buildBarSalasData(estatisticasPorSala);
  const { entriesOrdenados: estadoEntriesOrdenados, chartData: pieEstadoData } =
    buildPieEstadoData(estadoConservacao);
  const barMarcasData = buildBarMarcasData(topMarcas);

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
          .app-cabecalho,
          .app-rodape {
            display: none !important;
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
        <Capa
          inventario={inventario}
          membrosComissao={membrosComissao}
          datas={datas}
        />
        <Introducao
          inventario={inventario}
          estatisticas={estatisticas}
          datas={datas}
          membrosComissao={membrosComissao}
          totalSalas={totalSalas}
          totalServidores={totalServidores}
        />
        <Metodologia />
        <Resultados
          estatisticas={estatisticas}
          totalSalas={totalSalas}
          totalServidores={totalServidores}
          itensPorStatus={itensPorStatus}
          itensPorServidor={itensPorServidor}
          servidoresMultiplasSalas={servidoresMultiplasSalas || []}
          servidoresMetricas={servidoresMetricas}
          itensMovidos={itensMovidos}
          itensCadastrados={itensCadastrados}
          itensSobra={itensSobra}
          correcoesRealizadas={correcoesRealizadas}
          topMarcas={topMarcas}
          pieProgressoData={pieProgressoData}
          pieStatusData={pieStatusData}
          barSalasData={barSalasData}
          salasTop={salasTop}
          pieEstadoData={pieEstadoData}
          estadoEntriesOrdenados={estadoEntriesOrdenados}
          barMarcasData={barMarcasData}
          classificacaoABC={classificacaoABC}
          barOptions={barOptions}
          pieOptions={pieOptions}
        />
        <SecoesFinais
          inventario={inventario}
          estatisticas={estatisticas}
          itensMovidos={itensMovidos}
          correcoesRealizadas={correcoesRealizadas}
          itensCadastrados={itensCadastrados}
          itensSobra={itensSobra}
          timeline={timeline}
          comunicacoes={comunicacoes}
        />
      </div>
    </>
  );
}
