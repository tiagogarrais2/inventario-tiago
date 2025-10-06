"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../components/Button";

export default function Dashboard() {
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
  }, [session, status, router]);

  const buscarDadosDashboard = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await fetch("/api/dashboard");

      if (!response.ok) {
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
      UPLOAD_INVENTARIO: "Fez upload de inventário",
      ITEM_INVENTARIADO: "Inventariou item",
      ITEM_CADASTRADO: "Cadastrou novo item",
      CORRECAO_ITEM: "Corrigiu item",
      ACESSO_RELATORIO: "Visualizou relatório",
      EXCLUSAO_INVENTARIO: "Excluiu inventário",
      ACESSO_DADOS: "Acessou listagem",
      ACESSO_DASHBOARD: "Acessou dashboard",
    };
    return acoes[acao] || acao;
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
              animation: "spin 1s linear infinite",
              borderRadius: "50%",
              height: "128px",
              width: "128px",
              borderBottom: "4px solid var(--primary-color)",
              margin: "0 auto",
            }}
          ></div>
          <p
            style={{
              marginTop: "16px",
              color: "var(--text-color)",
              fontSize: "16px",
            }}
          >
            Carregando dashboard...
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
            maxWidth: "448px",
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
              marginBottom: "16px",
            }}
          >
            {erro}
          </p>
          <Button onClick={buscarDadosDashboard}>Tentar Novamente</Button>
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
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 16px",
          }}
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
                Dashboard
              </h1>
              <p
                style={{
                  color: "var(--text-color)",
                  opacity: 0.7,
                }}
              >
                Bem-vindo, {dados?.usuario?.nome}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
              }}
            >
              <Button onClick={() => router.push("/")}>
                🏠 Página Inicial
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 16px 32px 16px",
        }}
      >
        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Inventários */}
          <div
            style={{
              backgroundColor: "white",
              overflow: "hidden",
              boxShadow: "var(--shadow)",
              borderRadius: "8px",
            }}
          >
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    fontSize: "30px",
                  }}
                >
                  📋
                </div>
                <div
                  style={{
                    marginLeft: "20px",
                    flex: "1 1 0%",
                    minWidth: 0,
                  }}
                >
                  <dl>
                    <dt
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "var(--text-color)",
                        opacity: 0.7,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Meus Inventários
                    </dt>
                    <dd
                      style={{
                        fontSize: "30px",
                        fontWeight: "bold",
                        color: "var(--text-color)",
                      }}
                    >
                      {dados?.inventarios?.total || 0}
                    </dd>
                  </dl>
                </div>
              </div>
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "14px",
                  color: "var(--text-color)",
                  opacity: 0.7,
                }}
              >
                <span style={{ fontWeight: "500" }}>
                  {dados?.inventarios?.proprietario || 0}
                </span>{" "}
                próprios,{" "}
                <span style={{ fontWeight: "500" }}>
                  {dados?.inventarios?.comPermissao -
                    dados?.inventarios?.proprietario || 0}
                </span>{" "}
                compartilhados
              </div>
            </div>
          </div>

          {/* Total de Itens */}
          <div
            style={{
              backgroundColor: "white",
              overflow: "hidden",
              boxShadow: "var(--shadow)",
              borderRadius: "8px",
            }}
          >
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    fontSize: "30px",
                  }}
                >
                  📦
                </div>
                <div
                  style={{
                    marginLeft: "20px",
                    flex: "1 1 0%",
                    minWidth: 0,
                  }}
                >
                  <dl>
                    <dt
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "var(--text-color)",
                        opacity: 0.7,
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
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "14px",
                  color: "var(--text-color)",
                  opacity: 0.7,
                }}
              >
                Em todos os inventários
              </div>
            </div>
          </div>

          {/* Progresso */}
          <div
            style={{
              backgroundColor: "white",
              overflow: "hidden",
              boxShadow: "var(--shadow)",
              borderRadius: "8px",
            }}
          >
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    fontSize: "30px",
                  }}
                >
                  📊
                </div>
                <div
                  style={{
                    marginLeft: "20px",
                    flex: "1 1 0%",
                    minWidth: 0,
                  }}
                >
                  <dl>
                    <dt
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "var(--text-color)",
                        opacity: 0.7,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Progresso Geral
                    </dt>
                    <dd
                      style={{
                        fontSize: "30px",
                        fontWeight: "bold",
                        color: "var(--text-color)",
                      }}
                    >
                      {dados?.estatisticas?.percentualConcluido || 0}%
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
                      backgroundColor: "var(--success-color)",
                      height: "8px",
                      borderRadius: "9999px",
                      transition: "width 0.3s ease",
                      width: `${dados?.estatisticas?.percentualConcluido || 0}%`,
                    }}
                  ></div>
                </div>
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "14px",
                    color: "var(--text-color)",
                    opacity: 0.7,
                  }}
                >
                  {dados?.estatisticas?.itensInventariados || 0} de{" "}
                  {dados?.estatisticas?.totalItens || 0} itens inventariados
                </div>
              </div>
            </div>
          </div>

          {/* Correções */}
          <div
            style={{
              backgroundColor: "white",
              overflow: "hidden",
              boxShadow: "var(--shadow)",
              borderRadius: "8px",
            }}
          >
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    fontSize: "30px",
                  }}
                >
                  🔧
                </div>
                <div
                  style={{
                    marginLeft: "20px",
                    flex: "1 1 0%",
                    minWidth: 0,
                  }}
                >
                  <dl>
                    <dt
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "var(--text-color)",
                        opacity: 0.7,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Correções Feitas
                    </dt>
                    <dd
                      style={{
                        fontSize: "30px",
                        fontWeight: "bold",
                        color: "var(--text-color)",
                      }}
                    >
                      {dados?.estatisticas?.totalCorrecoes || 0}
                    </dd>
                  </dl>
                </div>
              </div>
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "14px",
                  color: "var(--text-color)",
                  opacity: 0.7,
                }}
              >
                Dados corrigidos no sistema
              </div>
            </div>
          </div>
        </div>

        {/* Duas Colunas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "32px",
          }}
        >
          {/* Informações do Usuário */}
          <div
            style={{
              backgroundColor: "white",
              boxShadow: "var(--shadow)",
              borderRadius: "8px",
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
                Informações da Conta
              </h3>
            </div>
            <div style={{ padding: "24px" }}>
              <dl
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <dt
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "var(--text-color)",
                      opacity: 0.7,
                    }}
                  >
                    Nome
                  </dt>
                  <dd
                    style={{
                      marginTop: "4px",
                      fontSize: "14px",
                      color: "var(--text-color)",
                    }}
                  >
                    {dados?.usuario?.nome}
                  </dd>
                </div>
                <div>
                  <dt
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "var(--text-color)",
                      opacity: 0.7,
                    }}
                  >
                    Email
                  </dt>
                  <dd
                    style={{
                      marginTop: "4px",
                      fontSize: "14px",
                      color: "var(--text-color)",
                    }}
                  >
                    {dados?.usuario?.email}
                  </dd>
                </div>
                <div>
                  <dt
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "var(--text-color)",
                      opacity: 0.7,
                    }}
                  >
                    Membro desde
                  </dt>
                  <dd
                    style={{
                      marginTop: "4px",
                      fontSize: "14px",
                      color: "var(--text-color)",
                    }}
                  >
                    {formatarData(dados?.usuario?.criadoEm)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Atividade Recente */}
          <div
            style={{
              backgroundColor: "white",
              boxShadow: "var(--shadow)",
              borderRadius: "8px",
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
                  {dados.atividade.slice(0, 8).map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
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
                        }}
                      ></div>
                      <div
                        style={{
                          flex: "1 1 0%",
                          minWidth: 0,
                        }}
                      >
                        <p
                          style={{
                            fontSize: "14px",
                            color: "var(--text-color)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatarAcao(item.acao)}
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text-color)",
                            opacity: 0.6,
                          }}
                        >
                          {formatarData(item.timestamp)}
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
            boxShadow: "var(--shadow)",
            borderRadius: "8px",
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
                  {dados?.estatisticas?.totalItens > 0
                    ? `${Math.round((dados?.estatisticas?.itensInventariados / dados?.estatisticas?.totalItens) * 100)}% do total`
                    : "0% do total"}
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
                  {dados?.estatisticas?.totalItens > 0
                    ? `${Math.round((dados?.estatisticas?.itensNaoInventariados / dados?.estatisticas?.totalItens) * 100)}% do total`
                    : "0% do total"}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "var(--primary-color)",
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
