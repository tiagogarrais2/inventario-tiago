"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../../../components/Button";

export default async function InventarioDashboard({ params }) {
  // Aguarda os params serem resolvidos (Next.js 15+)
  const resolvedParams = await params;
  const nomeInventario = resolvedParams.nome;

  return <InventarioDashboardClient nomeInventario={nomeInventario} />;
}

function InventarioDashboardClient({ nomeInventario }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }

    buscarDadosDashboard();
  }, [session, status, router, nomeInventario]);

  const buscarDadosDashboard = async () => {
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
  };

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
    if (percentual >= 90) return "bg-green-500";
    if (percentual >= 70) return "bg-yellow-500";
    if (percentual >= 50) return "bg-orange-500";
    return "bg-red-500";
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
              border: "4px solid #e5e7eb",
              borderTop: "4px solid var(--primary-color)",
              borderRadius: "50%",
              width: "128px",
              height: "128px",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          ></div>
          <p style={{ marginTop: "16px", color: "#6b7280" }}>
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
          <p style={{ color: "#6b7280", marginBottom: "16px" }}>{erro}</p>
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
              justifyContent: "space-between",
              alignItems: "center",
              padding: "24px 0",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "30px",
                  fontWeight: "bold",
                  color: "var(--text-color)",
                }}
              >
                Dashboard do Inventário
              </h1>
              <p style={{ color: "#6b7280" }}>
                {dados?.inventario?.nomeExibicao || nomeInventario}
              </p>
              <p style={{ fontSize: "14px", color: "#9ca3af" }}>
                Proprietário: {dados?.inventario?.proprietario} | Criado em:{" "}
                {formatarData(dados?.inventario?.criadoEm)}
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <Button
                onClick={() => router.push(`/inventario/${nomeInventario}`)}
              >
                📋 Inventário
              </Button>
              <Button
                onClick={() => router.push(`/relatorio/${nomeInventario}`)}
              >
                📊 Relatório
              </Button>
              <Button onClick={() => router.push("/")}>🏠 Início</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 16px" }}
      >
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
                        color: "#6b7280",
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
                        color: "#6b7280",
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
                    backgroundColor: "#e5e7eb",
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
                    color: "#6b7280",
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
                        color: "#6b7280",
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
                        color: "#6b7280",
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

        {/* Duas Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Progresso por Sala */}
          <div
            style={{
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
                Progresso por Sala
              </h3>
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
                  {dados.salas.slice(0, 8).map((sala, index) => (
                    <div
                      key={index}
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
                              backgroundColor: "#e5e7eb",
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
                                backgroundColor: getStatusColor(
                                  sala.percentual
                                ),
                                width: `${sala.percentual}%`,
                              }}
                            ></div>
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
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
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                  Nenhuma sala cadastrada
                </p>
              )}
            </div>
          </div>

          {/* Atividade Recente */}
          <div
            style={{
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
                Atividade Recente
              </h3>
            </div>
            <div style={{ padding: "24px" }}>
              {dados?.atividade && dados.atividade.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {dados.atividade.slice(0, 10).map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          backgroundColor: "var(--primary-color)",
                          borderRadius: "50%",
                          flexShrink: 0,
                          marginTop: "8px",
                        }}
                      ></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "14px",
                            color: "var(--text-color)",
                          }}
                        >
                          <span style={{ fontWeight: "500" }}>
                            {item.usuario?.nome || "Sistema"}
                          </span>{" "}
                          {formatarAcao(item.acao)}
                        </p>
                        <p style={{ fontSize: "12px", color: "#6b7280" }}>
                          {formatarData(item.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </div>
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
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Itens Inventariados
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
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
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Itens Pendentes
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
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
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Correções Realizadas
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#9ca3af",
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
