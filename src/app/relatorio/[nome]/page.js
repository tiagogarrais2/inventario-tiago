"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../../components/Button";

export default function RelatorioPage({ params }) {
  const unwrappedParams = React.use(params);
  const [nome, setNome] = useState(unwrappedParams?.nome || "");

  const { data: session, status } = useSession();
  const router = useRouter();
  const [itensPorSala, setItensPorSala] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [salasFiltradas, setSalasFiltradas] = useState([]);
  const [todasSalas, setTodasSalas] = useState([]);
  const [mostrarTodasSalas, setMostrarTodasSalas] = useState(true);
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(true);

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

  useEffect(() => {
    if (!hasAccess || accessLoading) return;

    async function fetchRelatorio() {
      try {
        // Buscar todas as salas, itens e correções em paralelo
        const [salasRes, itensRes, correcoesRes] = await Promise.all([
          fetch(`/api/salas?inventario=${encodeURIComponent(nome)}`),
          fetch(`/api/inventario?inventario=${encodeURIComponent(nome)}`),
          fetch(`/api/correcoes-todas/${encodeURIComponent(nome)}`),
        ]);

        if (!salasRes.ok) {
          const errorData = await salasRes.json();
          throw new Error(errorData.error || "Erro ao carregar salas.");
        }
        if (!itensRes.ok) {
          const errorData = await itensRes.json();
          throw new Error(errorData.error || "Erro ao carregar inventário.");
        }
        if (!correcoesRes.ok) {
          console.warn(
            "Erro ao carregar correções, continuando sem elas:",
            await correcoesRes.text()
          );
        }

        const salas = await salasRes.json();
        const itens = await itensRes.json();
        const correcoesData = correcoesRes.ok
          ? await correcoesRes.json()
          : { correcoesPorItem: {} };
        const correcoesPorItem = correcoesData.correcoesPorItem || {};

        // Guardar todas as salas para o filtro
        setTodasSalas(salas.sort());
        setSalasFiltradas(salas.sort());

        // Agrupar itens por sala
        const agrupado = {};
        salas.forEach((sala) => {
          agrupado[sala] = [];
        });

        // Agrupar itens por sala e incluir correções (já carregadas)
        for (const item of itens) {
          const sala = item.salaEncontrada || item.sala || "Sala não definida";

          if (!agrupado[sala]) {
            agrupado[sala] = [];
          }

          // Adicionar item com suas correções (já carregadas da API)
          agrupado[sala].push({
            ...item,
            historicoCorrecoes: correcoesPorItem[item.numero] || [],
          });
        }

        setItensPorSala(agrupado);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRelatorio();
  }, [nome, hasAccess, accessLoading]);

  // Loading de autenticação
  if (status === "loading" || accessLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-lg">Verificando permissões...</div>
      </div>
    );
  }

  // Usuário não autenticado
  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
        <p className="text-gray-600 text-center">
          Você precisa estar autenticado para acessar relatórios.
        </p>
      </div>
    );
  }

  // Usuário não tem acesso ao inventário
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
        <p className="text-gray-600 text-center">
          Você não tem permissão para acessar este relatório.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
        >
          Voltar ao Início
        </Button>
      </div>
    );
  }

  if (loading) return <p>Carregando relatório...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const handleToggleSala = (sala) => {
    if (salasFiltradas.includes(sala)) {
      setSalasFiltradas(salasFiltradas.filter((s) => s !== sala));
    } else {
      setSalasFiltradas([...salasFiltradas, sala]);
    }
    setMostrarTodasSalas(false);
  };

  const handleMostrarTodas = () => {
    setMostrarTodasSalas(true);
    setSalasFiltradas([...todasSalas]);
  };

  const handleLimparFiltros = () => {
    setMostrarTodasSalas(false);
    setSalasFiltradas([]);
  };

  const salasParaExibir = mostrarTodasSalas
    ? Object.keys(itensPorSala).sort()
    : Object.keys(itensPorSala)
        .filter((sala) => salasFiltradas.includes(sala))
        .sort();

  return (
    <div style={{ padding: "20px" }}>
      <h2>Relatório Geral</h2>
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

      {/* Filtro de Salas */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          backgroundColor: "#f8f9fa",
        }}
      >
        <h3 style={{ margin: 0, marginBottom: "10px" }}>
          🔍 Filtrar por Salas
        </h3>
        <Button
          onClick={() => setFiltrosVisiveis(!filtrosVisiveis)}
          style={{
            backgroundColor: "#6c757d",
            color: "white",
            padding: "5px 15px",
            fontSize: "14px",
            marginBottom: "10px",
          }}
        >
          {filtrosVisiveis ? "Ocultar Filtros" : "Mostrar Filtros"}
        </Button>

        {filtrosVisiveis && (
          <>
            <div style={{ marginBottom: "10px" }}>
              <Button
                onClick={handleMostrarTodas}
                style={{
                  marginRight: "10px",
                  backgroundColor: mostrarTodasSalas ? "#28a745" : "#6c757d",
                  color: "white",
                  padding: "5px 10px",
                  fontSize: "14px",
                }}
              >
                Mostrar Todas
              </Button>
              <Button
                onClick={handleLimparFiltros}
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  padding: "5px 10px",
                  fontSize: "14px",
                }}
              >
                Limpar Filtros
              </Button>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                alignItems: "flex-start",
              }}
            >
              {todasSalas.map((sala) => (
                <label
                  key={sala}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    backgroundColor: salasFiltradas.includes(sala)
                      ? "#007bff"
                      : "white",
                    color: salasFiltradas.includes(sala) ? "white" : "black",
                    cursor: "pointer",
                    fontSize: "14px",
                    textAlign: "left",
                    width: "100%",
                    boxSizing: "border-box",
                    minHeight: "38px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={salasFiltradas.includes(sala)}
                    onChange={() => handleToggleSala(sala)}
                    style={{
                      marginRight: "8px",
                      flexShrink: 0,
                      width: "auto",
                      maxWidth: "10%",
                    }}
                  />
                  <span style={{ flex: 1 }}>{sala}</span>
                </label>
              ))}
            </div>
            <div
              style={{ marginTop: "10px", fontSize: "14px", color: "#6c757d" }}
            >
              {mostrarTodasSalas
                ? `Exibindo todas as ${todasSalas.length} salas`
                : `Exibindo ${salasFiltradas.length} de ${todasSalas.length} salas`}
            </div>
          </>
        )}
      </div>

      {salasParaExibir.length === 0 && (
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            backgroundColor: "#f8f9fa",
            color: "#6c757d",
            textAlign: "center",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          📭 Nenhuma sala selecionada. Use o filtro acima para selecionar as
          salas que deseja visualizar.
        </div>
      )}

      {Object.keys(itensPorSala)
        .sort()
        .filter((sala) => salasParaExibir.includes(sala))
        .map((sala) => (
          <div key={sala} style={{ marginBottom: "30px" }}>
            <h2>Sala: {sala}</h2>
            {itensPorSala[sala].length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  border: "1px solid #ddd",
                  backgroundColor: "#f8f9fa",
                  color: "#6c757d",
                  textAlign: "center",
                  fontStyle: "italic",
                  borderRadius: "5px",
                }}
              >
                📦 Nenhum item encontrado nesta sala
              </div>
            ) : (
              <ul>
                {itensPorSala[sala].map((item, index) => (
                  <li
                    key={index}
                    style={{
                      marginBottom: "10px",
                      padding: "10px",
                      border: item.cadastradoDuranteInventario
                        ? "2px solid #007bff"
                        : item.dataInventario
                          ? "2px solid #28a745"
                          : item.temCorrecoes
                            ? "2px solid #ff9800"
                            : "1px solid #ccc",
                      backgroundColor: item.dataInventario
                        ? "#d4edda"
                        : "#f8d7da", // Verde para inventariado, vermelho para não
                      color: item.dataInventario ? "#155724" : "#721c24",
                      borderRadius: "5px",
                      position: "relative",
                    }}
                  >
                    {/* Badge INVENTARIADO - sempre à direita quando presente */}
                    {item.dataInventario && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: "10px",
                          backgroundColor: "#28a745",
                          color: "white",
                          padding: "2px 8px",
                          fontSize: "12px",
                          borderRadius: "10px",
                          fontWeight: "bold",
                        }}
                      >
                        ✅ INVENTARIADO
                      </div>
                    )}
                    {/* Badge CORRIGIDO - posição depende se tem INVENTARIADO */}
                    {item.temCorrecoes && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: item.dataInventario ? "130px" : "10px",
                          backgroundColor: "#ff9800",
                          color: "white",
                          padding: "2px 8px",
                          fontSize: "12px",
                          borderRadius: "10px",
                          fontWeight: "bold",
                        }}
                      >
                        📋 CORRIGIDO
                      </div>
                    )}
                    {/* Badge CADASTRADO - sempre à esquerda quando presente */}
                    {item.cadastradoDuranteInventario && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right:
                            item.dataInventario && item.temCorrecoes
                              ? "250px"
                              : item.dataInventario || item.temCorrecoes
                                ? "130px"
                                : "10px",
                          backgroundColor: "#007bff",
                          color: "white",
                          padding: "2px 8px",
                          fontSize: "12px",
                          borderRadius: "10px",
                          fontWeight: "bold",
                        }}
                      >
                        📝 CADASTRADO
                      </div>
                    )}
                    {/* Badge MOVIDO - quando item foi encontrado em sala diferente */}
                    {item.salaEncontrada &&
                      item.sala &&
                      item.salaEncontrada !== item.sala && (
                        <div
                          style={{
                            position: "absolute",
                            top: "-8px",
                            right: (() => {
                              let position = 10;
                              if (item.dataInventario) position += 120;
                              if (item.temCorrecoes) position += 120;
                              if (item.cadastradoDuranteInventario)
                                position += 120;
                              return position + "px";
                            })(),
                            backgroundColor: "#9c27b0",
                            color: "white",
                            padding: "2px 8px",
                            fontSize: "12px",
                            borderRadius: "10px",
                            fontWeight: "bold",
                          }}
                        >
                          🚚 MOVIDO
                        </div>
                      )}
                    <strong>Número:</strong> {item.numero} <br />
                    <strong>Descrição:</strong> {item.descricao || "N/A"} <br />
                    <strong>Status:</strong>{" "}
                    {item.statusInventario || item.status || "N/A"} <br />
                    <strong>Inventariante:</strong>{" "}
                    {item.inventariante?.nome || item.inventariante || "N/A"}{" "}
                    <br />
                    <strong>Data do Inventário:</strong>{" "}
                    {item.dataInventario
                      ? new Date(item.dataInventario).toLocaleDateString()
                      : "Não inventariado"}
                    {item.salaEncontrada &&
                      item.sala &&
                      item.salaEncontrada !== item.sala && (
                        <>
                          <br />
                          <strong style={{ color: "#9c27b0" }}>
                            🚚 Item movido - Sala original: {item.sala}
                          </strong>
                        </>
                      )}
                    {item.cadastradoDuranteInventario && (
                      <>
                        <br />
                        <strong style={{ color: "#007bff" }}>
                          🔖 Item cadastrado durante o inventário
                        </strong>
                      </>
                    )}
                    {item.temCorrecoes && (
                      <>
                        <br />
                        <strong style={{ color: "#ff9800" }}>
                          📋 Este item possui {item.totalCorrecoes}{" "}
                          correção(ões) de dados
                        </strong>
                        {item.ultimaCorrecao && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#ff9800",
                              marginTop: "4px",
                            }}
                          >
                            Última correção:{" "}
                            {new Date(item.ultimaCorrecao).toLocaleString()}
                          </div>
                        )}

                        {/* Histórico completo de correções para impressão */}
                        {item.historicoCorrecoes &&
                          item.historicoCorrecoes.length > 0 && (
                            <div
                              style={{
                                marginTop: "15px",
                                padding: "10px",
                                backgroundColor: "#fff3cd",
                                border: "1px solid #ffeaa7",
                                borderRadius: "5px",
                                fontSize: "13px",
                              }}
                            >
                              <strong style={{ color: "#856404" }}>
                                HISTÓRICO DE CORREÇÕES:
                              </strong>
                              {item.historicoCorrecoes.map((correcao, idx) => {
                                const dataCorrecao = new Date(
                                  correcao.createdAt
                                ).toLocaleString("pt-BR");

                                // Extrair diferenças das observações
                                let dadosCorrigidos = {};
                                let observacoesLimpas =
                                  correcao.observacoes || "";

                                const regexCampos = /Campos alterados: (.+)/;
                                const match =
                                  observacoesLimpas.match(regexCampos);

                                if (match) {
                                  observacoesLimpas = observacoesLimpas
                                    .replace(/\n\nCampos alterados:.+/, "")
                                    .trim();
                                  const camposTexto = match[1];
                                  const campos = camposTexto.split(" | ");

                                  campos.forEach((campo) => {
                                    const [nome, valores] = campo.split(": ");
                                    if (valores) {
                                      const [original, novo] =
                                        valores.split(" → ");
                                      dadosCorrigidos[nome] = {
                                        original:
                                          original?.replace(/&quot;/g, "") ||
                                          "",
                                        novo:
                                          novo?.replace(/&quot;/g, "") || "",
                                      };
                                    }
                                  });
                                }

                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      marginTop: "10px",
                                      paddingTop: "10px",
                                      borderTop:
                                        idx > 0 ? "1px solid #ddd" : "none",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontWeight: "bold",
                                        color: "#856404",
                                      }}
                                    >
                                      Correção #{idx + 1} • {dataCorrecao} •
                                      Por:{" "}
                                      {correcao.inventariante?.nome ||
                                        correcao.inventariante?.email ||
                                        "Usuário não identificado"}
                                    </div>

                                    {Object.keys(dadosCorrigidos).length > 0 &&
                                      Object.entries(dadosCorrigidos).map(
                                        ([campo, valor]) => (
                                          <div
                                            key={campo}
                                            style={{ marginTop: "5px" }}
                                          >
                                            <div
                                              style={{
                                                fontWeight: "bold",
                                                fontSize: "12px",
                                              }}
                                            >
                                              {campo}
                                            </div>
                                            <div style={{ fontSize: "12px" }}>
                                              Valor original: &quot;
                                              {valor?.original ||
                                                "Não informado"}
                                              &quot; → Novo valor: &quot;
                                              {valor?.novo || "Não informado"}
                                              &quot;
                                            </div>
                                          </div>
                                        )
                                      )}

                                    {observacoesLimpas && (
                                      <div style={{ marginTop: "8px" }}>
                                        <div
                                          style={{
                                            fontWeight: "bold",
                                            fontSize: "12px",
                                          }}
                                        >
                                          📝 Observações
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "12px",
                                            fontStyle: "italic",
                                          }}
                                        >
                                          {observacoesLimpas}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
    </div>
  );
}
