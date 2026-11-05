"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../../../components/Button";

// Estilos para impressão
const printStyles = `
  @media print {
    .page-break-before {
      page-break-before: always !important;
      break-before: page !important;
    }
    
    .page-break-after {
      page-break-after: always !important;
      break-after: page !important;
    }
    
    .no-break-inside {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Evitar quebra de página dentro dos itens de sala */
    .sala-item {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  }
`;

// Adicionar estilos ao documento
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerHTML = printStyles;
  document.head.appendChild(styleSheet);
}

export default function InventarioDashboard({ params }) {
  // Aguarda os params serem resolvidos (Next.js 15+)
  const resolvedParams = React.use(params);
  const nomeInventario = resolvedParams.nome;

  return <InventarioDashboardClient nomeInventario={nomeInventario} />;
}

function InventarioDashboardClient({ nomeInventario }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [ordenacaoSala, setOrdenacaoSala] = useState("nome-asc");

  const buscarDadosDashboard = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await fetch(
        `/api/inventario-dashboard/${encodeURIComponent(nomeInventario)}`
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Você não tem permissão para acessar este inventário"
          );
        }
        if (response.status === 404) {
          throw new Error("Inventário não encontrado");
        }
        throw new Error("Erro ao carregar dados do dashboard");
      }

      const data = await response.json();
      setDados(data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, [nomeInventario]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }

    buscarDadosDashboard();
  }, [session, status, router, buscarDadosDashboard]);

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatarAcao = (acao) => {
    const acoes = {
      ACESSO_INVENTARIO: "Acessou inventário",
      ITEM_INVENTARIADO: "Inventariou item",
      ITEM_CADASTRADO: "Cadastrou novo item",
      CORRECAO_ITEM: "Corrigiu item",
      ACESSO_RELATORIO: "Visualizou relatório",
      ACESSO_INVENTARIO_DASHBOARD: "Acessou dashboard",
    };
    return acoes[acao] || acao;
  };

  const getStatusColor = (percentual) => {
    if (percentual >= 90) return "var(--success-color)";
    if (percentual >= 70) return "var(--warning-color)";
    if (percentual >= 50) return "var(--primary-color)";
    return "var(--danger-color)";
  };

  const ordenarSalas = (salas) => {
    if (!salas || salas.length === 0) return salas;

    const salasOrdenadas = [...salas];

    switch (ordenacaoSala) {
      case "nome-asc":
        return salasOrdenadas.sort((a, b) => a.nome.localeCompare(b.nome));
      case "nome-desc":
        return salasOrdenadas.sort((a, b) => b.nome.localeCompare(a.nome));
      case "progresso-asc":
        return salasOrdenadas.sort((a, b) => a.percentual - b.percentual);
      case "progresso-desc":
        return salasOrdenadas.sort((a, b) => b.percentual - a.percentual);
      case "total-itens-asc":
        return salasOrdenadas.sort((a, b) => a.totalItens - b.totalItens);
      case "total-itens-desc":
        return salasOrdenadas.sort((a, b) => b.totalItens - a.totalItens);
      case "inventariados-asc":
        return salasOrdenadas.sort(
          (a, b) => a.itensInventariados - b.itensInventariados
        );
      case "inventariados-desc":
        return salasOrdenadas.sort(
          (a, b) => b.itensInventariados - a.itensInventariados
        );
      default:
        return salasOrdenadas.sort((a, b) => a.nome.localeCompare(b.nome));
    }
  };

  // Loading state
  if (status === "loading" || carregando) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--light-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              border: "4px solid var(--light-bg)",
              borderTop: "4px solid var(--primary-color)",
              borderRadius: "50%",
              width: "128px",
              height: "128px",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          ></div>
          <p
            style={{
              marginTop: "16px",
              color: "var(--text-color)",
              opacity: 0.6,
            }}
          >
            Carregando dashboard do inventário...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (erro) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--light-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "32px",
            borderRadius: "8px",
            boxShadow: "var(--shadow)",
            maxWidth: "512px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "var(--danger-color)",
              fontSize: "48px",
              marginBottom: "16px",
            }}
          >
            ⚠️
          </div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "var(--text-color)",
              marginBottom: "8px",
            }}
          >
            Erro ao carregar
          </h2>
          <p
            style={{
              color: "var(--text-color)",
              opacity: 0.6,
              marginBottom: "16px",
            }}
          >
            {erro}
          </p>
          <div
            style={{ display: "flex", gap: "8px", justifyContent: "center" }}
          >
            <Button onClick={buscarDadosDashboard}>Tentar Novamente</Button>
            <Button onClick={() => router.push("/")}>Voltar ao Início</Button>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--light-bg)" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          boxShadow: "var(--shadow)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 16px" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "24px 0",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "var(--text-color)",
                  marginBottom: "8px",
                }}
              >
                Dashboard do Inventário
              </h1>
              <p
                style={{
                  color: "var(--text-color)",
                  opacity: 0.7,
                  fontSize: "16px",
                }}
              >
                Proprietário: {dados?.inventario?.proprietario} | Criado em:{" "}
                {formatarData(dados?.inventario?.criadoEm)}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <Button
                onClick={() => router.push(`/inventario/${nomeInventario}`)}
              >
                📋 Inventário
              </Button>
              <Button
                onClick={() => router.push(`/relatorio/${nomeInventario}`)}
              >
                📊 Todos os itens organizados por sala
              </Button>
              <Button onClick={() => router.push("/")}>🏠 Início</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Total de Itens */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "var(--shadow)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: "30px" }}>📦</div>
                </div>
                <div style={{ marginLeft: "20px", flex: 1, minWidth: 0 }}>
                  <dl>
                    <dt
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "var(--text-color)",
                        opacity: 0.6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Total de Itens
                    </dt>
                    <dd
                      style={{
                        fontSize: "30px",
                        fontWeight: "bold",
                        color: "var(--text-color)",
                      }}
                    >
                      {dados?.estatisticas?.totalItens || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Progresso */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "var(--shadow)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: "30px" }}>✅</div>
                </div>
                <div style={{ marginLeft: "20px", flex: 1, minWidth: 0 }}>
                  <dl>
                    <dt
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "var(--text-color)",
                        opacity: 0.6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Inventariados
                    </dt>
                    <dd
                      style={{
                        fontSize: "30px",
                        fontWeight: "bold",
                        color: "var(--success-color)",
                      }}
                    >
                      {dados?.estatisticas?.itensInventariados || 0}
                    </dd>
                  </dl>
                </div>
              </div>
              <div style={{ marginTop: "12px" }}>
                <div
                  style={{
                    backgroundColor: "var(--light-bg)",
                    borderRadius: "9999px",
                    height: "8px",
                  }}
                >
                  <div
                    style={{
                      height: "8px",
                      borderRadius: "9999px",
                      transition: "all 0.3s",
                      backgroundColor: getStatusColor(
                        dados?.estatisticas?.percentualConcluido || 0
                      ),
                      width: `${dados?.estatisticas?.percentualConcluido || 0}%`,
                    }}
                  ></div>
                </div>
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "14px",
                    color: "var(--text-color)",
                    opacity: 0.6,
                  }}
                >
                  {dados?.estatisticas?.percentualConcluido || 0}% concluído
                </div>
              </div>
            </div>
          </div>

          {/* Salas */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "var(--shadow)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: "30px" }}>🏠</div>
                </div>
                <div style={{ marginLeft: "20px", flex: 1, minWidth: 0 }}>
                  <dl>
                    <dt
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "var(--text-color)",
                        opacity: 0.6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Total de Salas
                    </dt>
                    <dd
                      style={{
                        fontSize: "30px",
                        fontWeight: "bold",
                        color: "var(--info-color)",
                      }}
                    >
                      {dados?.estatisticas?.totalSalas || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Correções */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "var(--shadow)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: "30px" }}>🔧</div>
                </div>
                <div style={{ marginLeft: "20px", flex: 1, minWidth: 0 }}>
                  <dl>
                    <dt
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "var(--text-color)",
                        opacity: 0.6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Correções
                    </dt>
                    <dd
                      style={{
                        fontSize: "30px",
                        fontWeight: "bold",
                        color: "var(--warning-color)",
                      }}
                    >
                      {dados?.estatisticas?.totalCorrecoes || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ritmo de Conferência dos Últimos Dias */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "var(--shadow)",
            marginBottom: "32px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "var(--primary-color)",
                  margin: "0 0 4px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>📅</span>
                Ritmo de Conferência Recente
              </h2>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-color)",
                  opacity: 0.7,
                  margin: 0,
                }}
              >
                Acompanhamento da velocidade de trabalho e itens conferidos por período
              </p>
            </div>
            <div
              style={{
                fontSize: "12px",
                backgroundColor: "var(--light-bg)",
                padding: "4px 10px",
                borderRadius: "12px",
                fontWeight: "500",
                color: "var(--text-color)",
              }}
            >
              Últimos 14 dias
            </div>
          </div>

          <div style={{ padding: "24px" }}>
            {/* 4 Cards de Resumo Rápido */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "12px", color: "#166534", fontWeight: "600", textTransform: "uppercase" }}>
                  Hoje
                </div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#15803d", marginTop: "4px" }}>
                  {dados?.estatisticas?.ritmo?.hoje ?? 0}
                </div>
                <div style={{ fontSize: "11px", color: "#166534", opacity: 0.8, marginTop: "2px" }}>
                  itens conferidos
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "12px", color: "#1e40af", fontWeight: "600", textTransform: "uppercase" }}>
                  Ontem
                </div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb", marginTop: "4px" }}>
                  {dados?.estatisticas?.ritmo?.ontem ?? 0}
                </div>
                <div style={{ fontSize: "11px", color: "#1e40af", opacity: 0.8, marginTop: "2px" }}>
                  itens conferidos
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#faf5ff",
                  border: "1px solid #e9d5ff",
                  borderRadius: "8px",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "12px", color: "#6b21a8", fontWeight: "600", textTransform: "uppercase" }}>
                  Últimos 7 dias
                </div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#7e22ce", marginTop: "4px" }}>
                  {dados?.estatisticas?.ritmo?.ultimos7Dias ?? 0}
                </div>
                <div style={{ fontSize: "11px", color: "#6b21a8", opacity: 0.8, marginTop: "2px" }}>
                  média ~{Math.round((dados?.estatisticas?.ritmo?.ultimos7Dias || 0) / 7)}/dia
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "8px",
                  padding: "16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "12px", color: "#92400e", fontWeight: "600", textTransform: "uppercase" }}>
                  Últimos 30 dias
                </div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#b45309", marginTop: "4px" }}>
                  {dados?.estatisticas?.ritmo?.ultimos30Dias ?? 0}
                </div>
                <div style={{ fontSize: "11px", color: "#92400e", opacity: 0.8, marginTop: "2px" }}>
                  média ~{Math.round((dados?.estatisticas?.ritmo?.ultimos30Dias || 0) / 30)}/dia
                </div>
              </div>
            </div>

            {/* Gráfico de Barras Diário (Últimos 14 dias) */}
            {dados?.estatisticas?.ritmo?.historicoDias && (
              <div>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--text-color)",
                    margin: "0 0 16px 0",
                  }}
                >
                  Itens conferidos dia a dia (Últimas 2 semanas)
                </h4>

                {(() => {
                  const dias = dados.estatisticas.ritmo.historicoDias;
                  const maxQtd = Math.max(...dias.map((d) => d.quantidade), 1);
                  const totalPeriodo = dias.reduce((acc, cur) => acc + cur.quantidade, 0);

                  if (totalPeriodo === 0) {
                    return (
                      <div
                        style={{
                          padding: "20px",
                          textAlign: "center",
                          color: "var(--text-color)",
                          opacity: 0.6,
                          backgroundColor: "var(--light-bg)",
                          borderRadius: "6px",
                          fontSize: "13px",
                        }}
                      >
                        Nenhum item foi inventariado nos últimos 14 dias.
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        gap: "6px",
                        height: "150px",
                        padding: "10px 0 0 0",
                        borderBottom: "2px solid #e5e7eb",
                      }}
                    >
                      {dias.map((d, idx) => {
                        const alturaPct = Math.round((d.quantidade / maxQtd) * 100);
                        const isHoje = idx === dias.length - 1;
                        return (
                          <div
                            key={d.data}
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              height: "100%",
                              justifyContent: "flex-end",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "bold",
                                color: d.quantidade > 0 ? (isHoje ? "#15803d" : "#2563eb") : "#9ca3af",
                                marginBottom: "4px",
                              }}
                            >
                              {d.quantidade > 0 ? d.quantidade : ""}
                            </span>
                            <div
                              title={`${d.dataFormatada}: ${d.quantidade} item(ns)`}
                              style={{
                                width: "100%",
                                maxWidth: "34px",
                                height: `${Math.max(alturaPct, d.quantidade > 0 ? 8 : 2)}%`,
                                backgroundColor: d.quantidade === 0
                                  ? "#e5e7eb"
                                  : isHoje
                                  ? "#22c55e"
                                  : "#3b82f6",
                                borderRadius: "4px 4px 0 0",
                                transition: "height 0.3s ease",
                                cursor: "pointer",
                              }}
                            />
                            <span
                              style={{
                                fontSize: "10px",
                                color: isHoje ? "#15803d" : "var(--text-color)",
                                fontWeight: isHoje ? "bold" : "normal",
                                opacity: isHoje ? 1 : 0.7,
                                marginTop: "6px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {isHoje ? "Hoje" : d.dataFormatada}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Progresso por Sala */}
        <div
          className="page-break-before no-break-inside"
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "var(--shadow)",
            marginBottom: "32px",
            pageBreakBefore: "always",
            breakBefore: "page",
          }}
        >
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "var(--primary-color)",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "28px" }}>📊</span>
                Progresso por Sala
                {dados?.salas && dados.salas.length > 0 && (
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "14px",
                      fontWeight: "400",
                      color: "var(--text-color)",
                      opacity: 0.6,
                      backgroundColor: "var(--light-bg)",
                      padding: "2px 8px",
                      borderRadius: "12px",
                    }}
                  >
                    {dados.salas.length}{" "}
                    {dados.salas.length === 1 ? "sala" : "salas"}
                  </span>
                )}
              </h2>

              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "var(--text-color)",
                    opacity: 0.7,
                  }}
                >
                  Ordenar por:
                </label>
                <select
                  value={ordenacaoSala}
                  onChange={(e) => setOrdenacaoSala(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "white",
                    color: "var(--text-color)",
                    fontSize: "14px",
                    minWidth: "200px",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    outline: "none",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary-color)";
                    e.target.style.boxShadow =
                      "0 0 0 2px rgba(59, 130, 246, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border-color)";
                    e.target.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
                  }}
                >
                  <option value="nome-asc">Nome (A → Z)</option>
                  <option value="nome-desc">Nome (Z → A)</option>
                  <option value="progresso-desc">
                    Progresso (Maior → Menor)
                  </option>
                  <option value="progresso-asc">
                    Progresso (Menor → Maior)
                  </option>
                  <option value="total-itens-desc">
                    Total de Itens (Maior → Menor)
                  </option>
                  <option value="total-itens-asc">
                    Total de Itens (Menor → Maior)
                  </option>
                  <option value="inventariados-desc">
                    Inventariados (Maior → Menor)
                  </option>
                  <option value="inventariados-asc">
                    Inventariados (Menor → Maior)
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ padding: "24px" }}>
            {dados?.salas && dados.salas.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {ordenarSalas(dados.salas).map((sala, index) => (
                  <div
                    key={index}
                    className="sala-item"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "var(--text-color)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sala.nome}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginTop: "4px",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: "var(--light-bg)",
                            borderRadius: "9999px",
                            height: "8px",
                            flex: 1,
                            marginRight: "12px",
                          }}
                        >
                          <div
                            style={{
                              height: "8px",
                              borderRadius: "9999px",
                              transition: "all 0.3s",
                              backgroundColor: getStatusColor(sala.percentual),
                              width: `${sala.percentual}%`,
                            }}
                          ></div>
                        </div>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--text-color)",
                            opacity: 0.5,
                            width: "48px",
                            textAlign: "right",
                          }}
                        >
                          {sala.percentual}%
                        </span>
                      </div>
                    </div>
                    <div style={{ marginLeft: "16px", textAlign: "right" }}>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "var(--text-color)",
                        }}
                      >
                        {sala.itensInventariados}/{sala.totalItens}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  color: "var(--text-color)",
                  opacity: 0.5,
                  fontSize: "14px",
                }}
              >
                Nenhuma sala cadastrada
              </p>
            )}
          </div>
          <div
            className="page-break-after"
            style={{
              pageBreakAfter: "always",
              breakAfter: "page",
            }}
          ></div>
        </div>

        {/* Estatísticas Detalhadas */}
        <div
          style={{
            marginTop: "32px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "var(--shadow)",
          }}
        >
          <div
            style={{
              padding: "24px",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "500",
                color: "var(--text-color)",
              }}
            >
              Resumo Detalhado
            </h3>
          </div>
          <div style={{ padding: "24px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "24px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "var(--success-color)",
                  }}
                >
                  {dados?.estatisticas?.itensInventariados || 0}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-color)",
                    opacity: 0.6,
                    marginTop: "4px",
                  }}
                >
                  Itens Inventariados
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-color)",
                    opacity: 0.4,
                    marginTop: "4px",
                  }}
                >
                  {dados?.estatisticas?.percentualConcluido || 0}% do total
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "var(--danger-color)",
                  }}
                >
                  {dados?.estatisticas?.itensNaoInventariados || 0}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-color)",
                    opacity: 0.6,
                    marginTop: "4px",
                  }}
                >
                  Itens Pendentes
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-color)",
                    opacity: 0.4,
                    marginTop: "4px",
                  }}
                >
                  {100 - (dados?.estatisticas?.percentualConcluido || 0)}%
                  restante
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "var(--warning-color)",
                  }}
                >
                  {dados?.estatisticas?.totalCorrecoes || 0}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-color)",
                    opacity: 0.6,
                    marginTop: "4px",
                  }}
                >
                  Correções Realizadas
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-color)",
                    opacity: 0.4,
                    marginTop: "4px",
                  }}
                >
                  Dados atualizados
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
