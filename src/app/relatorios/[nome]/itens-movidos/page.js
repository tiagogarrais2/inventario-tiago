"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../../../components/Button";

export default function RelatorioItensMovidos({ params }) {
  const [nome, setNome] = useState("");
  const [itensMovidos, setItensMovidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Resolver params de forma assíncrona
    const resolveParams = async () => {
      const resolvedParams = await params;
      setNome(resolvedParams.nome);
    };
    resolveParams();
  }, [params]);

  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);

  // Verificar permissões de acesso
  useEffect(() => {
    async function verificarPermissoes() {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        router.push("/");
        return;
      }

      try {
        const response = await fetch(
          `/api/verificar-acesso?inventario=${nome}`
        );
        const data = await response.json();

        if (response.ok) {
          setHasAccess(data.hasAccess);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        setHasAccess(false);
      }

      setAccessLoading(false);
    }

    verificarPermissoes();
  }, [nome, status, router]);

  // Carregar itens movidos
  useEffect(() => {
    if (!hasAccess || accessLoading) return;

    async function fetchItensMovidos() {
      try {
        setLoading(true);
        setError("");

        // Buscar todos os itens do inventário
        const response = await fetch(
          `/api/inventario?inventario=${encodeURIComponent(nome)}`
        );

        if (!response.ok) {
          throw new Error("Erro ao carregar itens do inventário");
        }

        const itens = await response.json();

        // Filtrar apenas itens que foram movidos (salaEncontrada diferente de sala)
        const movidos = itens.filter(
          (item) =>
            item.salaEncontrada &&
            item.sala &&
            item.salaEncontrada !== item.sala
        );

        setItensMovidos(movidos);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchItensMovidos();
  }, [nome, hasAccess, accessLoading]);

  // Loading de autenticação
  if (status === "loading" || accessLoading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div>Verificando permissões...</div>
      </div>
    );
  }

  // Usuário não autenticado
  if (status === "unauthenticated") {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Acesso Restrito</h1>
        <p>Você precisa estar autenticado para acessar relatórios.</p>
      </div>
    );
  }

  // Usuário não tem acesso ao inventário
  if (!hasAccess) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>Acesso Negado</h1>
        <p>
          Você não tem permissão para acessar os relatórios deste inventário.
        </p>
        <Button onClick={() => router.push("/")}>Voltar ao Início</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div>Carregando relatório de itens movidos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
        <h2>Erro ao carregar relatório</h2>
        <p>{error}</p>
        <Button onClick={() => router.push(`/relatorios/${nome}`)}>
          Voltar aos Relatórios
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: "30px" }}>
        <h1>Relatório de Itens Movidos</h1>
        <h2>
          <a
            href={`/inventario/${nome}`}
            style={{
              color: "#007bff",
              textDecoration: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.target.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.target.style.textDecoration = "none";
            }}
            title="Clique para ir ao inventário"
          >
            {nome}
          </a>
        </h2>
        <div style={{ marginTop: "10px" }}>
          <Button onClick={() => router.push(`/relatorios/${nome}`)}>
            ← Voltar aos Relatórios
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          border: "1px solid #dee2e6",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#495057" }}>
          📊 Resumo dos Itens Movidos
        </h3>
        <p
          style={{
            margin: "0",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#9c27b0",
          }}
        >
          Total de itens movidos: {itensMovidos.length}
        </p>
      </div>

      {/* Lista de Itens Movidos */}
      {itensMovidos.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "8px",
            color: "#6c757d",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>📦</div>
          <h3>Nenhum item movido encontrado</h3>
          <p>
            Todos os itens estão nas salas onde foram cadastrados originalmente.
          </p>
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: "20px", color: "#495057" }}>
            🚚 Itens Movidos ({itensMovidos.length})
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {itensMovidos.map((item, index) => (
              <div
                key={index}
                style={{
                  border: "2px solid #9c27b0",
                  borderRadius: "8px",
                  padding: "20px",
                  backgroundColor: "#f3e5f5",
                  position: "relative",
                }}
              >
                {/* Badge MOVIDO */}
                <div
                  style={{
                    position: "absolute",
                    top: "-10px",
                    right: "20px",
                    backgroundColor: "#9c27b0",
                    color: "white",
                    padding: "4px 12px",
                    fontSize: "12px",
                    borderRadius: "15px",
                    fontWeight: "bold",
                  }}
                >
                  🚚 MOVIDO
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                  }}
                >
                  <div>
                    <h4 style={{ margin: "0 0 15px 0", color: "#9c27b0" }}>
                      📋 Informações do Item
                    </h4>
                    <div style={{ lineHeight: "1.6" }}>
                      <strong>Número:</strong> {item.numero}
                      <br />
                      <strong>Descrição:</strong> {item.descricao || "N/A"}
                      <br />
                      <strong>Status:</strong>{" "}
                      {item.statusInventario || item.status || "N/A"}
                      <br />
                      <strong>Inventariante:</strong>{" "}
                      {item.inventariante?.nome || item.inventariante || "N/A"}
                      <br />
                      <strong>Data do Inventário:</strong>{" "}
                      {item.dataInventario
                        ? new Date(item.dataInventario).toLocaleDateString(
                            "pt-BR"
                          )
                        : "Não inventariado"}
                      {item.observacoesInventario && (
                        <>
                          <br />
                          <strong>📝 Observações:</strong>{" "}
                          {item.observacoesInventario}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: "0 0 15px 0", color: "#9c27b0" }}>
                      🚚 Movimentação
                    </h4>
                    <div style={{ lineHeight: "1.6" }}>
                      <div style={{ marginBottom: "10px" }}>
                        <strong style={{ color: "#dc3545" }}>
                          Sala Original:
                        </strong>
                        <br />
                        <span
                          style={{
                            backgroundColor: "#f8d7da",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontWeight: "500",
                          }}
                        >
                          {item.sala}
                        </span>
                      </div>

                      <div style={{ marginBottom: "10px" }}>
                        <strong style={{ color: "#28a745" }}>
                          Sala Encontrada:
                        </strong>
                        <br />
                        <span
                          style={{
                            backgroundColor: "#d4edda",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontWeight: "500",
                          }}
                        >
                          {item.salaEncontrada}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <p style={{ margin: "0", color: "#6c757d" }}>
          <strong>Relatório gerado em:</strong>{" "}
          {new Date().toLocaleString("pt-BR")}
        </p>
      </div>
    </div>
  );
}
