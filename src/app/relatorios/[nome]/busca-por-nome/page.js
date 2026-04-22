"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../../../components/Button";

export default function BuscaPorNomePage({ params }) {
  const unwrappedParams = React.use(params);
  const [nome, setNome] = useState(unwrappedParams?.nome || "");

  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [termoBusca, setTermoBusca] = useState(searchParams.get("q") || "");
  const [termoPesquisado, setTermoPesquisado] = useState(
    searchParams.get("q") || ""
  );
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscaRealizada, setBuscaRealizada] = useState(false);
  const [filtro, setFiltro] = useState("todos"); // "todos" | "inventariados" | "nao-inventariados"
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [salas, setSalas] = useState([]);
  const [servidores, setServidores] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [formData, setFormData] = useState({
    dataInventario: new Date().toISOString().split("T")[0],
    inventariante: "",
    salaEncontrada: "",
    statusInventario: "",
    cargaAtual: "",
    estadoConservacao: "",
    observacoes: "",
  });

  const STATUS_OPTIONS = [
    "Em Uso",
    "Ativo",
    "Baixado",
    "Ocioso",
    "Em Manutenção",
    "Recuperável",
    "Em Desfazimento",
    "Extraviado/Desaparecido",
    "Pendente",
  ];

  const ESTADOS_CONSERVACAO = [
    "Bom",
    "Regular",
    "Ocioso",
    "Recuperável",
    "Antieconômico",
  ];

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

  // Carregar salas e servidores uma vez ao ter acesso confirmado
  useEffect(() => {
    if (!hasAccess || accessLoading) return;

    async function carregarAuxiliares() {
      try {
        const [salasRes, servidoresRes] = await Promise.all([
          fetch(`/api/salas?inventario=${encodeURIComponent(nome)}`),
          fetch(`/api/servidores?inventario=${encodeURIComponent(nome)}`),
        ]);

        if (salasRes.ok) {
          const salasData = await salasRes.json();
          setSalas(salasData.sort());
        }

        if (servidoresRes.ok) {
          const servidoresData = await servidoresRes.json();
          setServidores(servidoresData);
        }
      } catch (error) {
        console.error("Erro ao carregar salas/servidores:", error);
      }
    }

    carregarAuxiliares();
  }, [nome, hasAccess, accessLoading]);

  // Executar busca quando o query param "q" mudar
  const executarBusca = useCallback(
    async (termo) => {
      if (!termo || !termo.trim()) {
        setItens([]);
        setBuscaRealizada(false);
        return;
      }

      setLoading(true);
      setError("");
      setBuscaRealizada(false);

      try {
        const res = await fetch(
          `/api/inventario?inventario=${encodeURIComponent(nome)}&busca=${encodeURIComponent(termo.trim())}`
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Erro ao buscar itens.");
        }

        const data = await res.json();
        setItens(data);
        setBuscaRealizada(true);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [nome]
  );

  useEffect(() => {
    if (!hasAccess || accessLoading) return;
    const q = searchParams.get("q") || "";
    setTermoBusca(q);
    setTermoPesquisado(q);
    executarBusca(q);
  }, [searchParams, hasAccess, accessLoading, executarBusca]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = termoBusca.trim();
    if (!q) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", q);
    router.push(`/relatorios/${nome}/busca-por-nome?${params.toString()}`);
  };

  // Função para abrir modal de inventário
  const abrirModalInventario = (item) => {
    setItemSelecionado(item);
    setFormData({
      dataInventario: new Date().toISOString().split("T")[0],
      inventariante: session?.user?.email || "",
      salaEncontrada: item.salaEncontrada || item.sala || "",
      statusInventario: item.statusInventario || "Em Uso",
      cargaAtual: item.cargaAtual || "",
      estadoConservacao: item.estadoConservacao || "Bom",
      observacoes: "",
    });
    setModalAberto(true);
  };

  // Função para enviar dados do inventário
  const enviarInventario = async () => {
    if (!itemSelecionado) return;

    if (!formData.cargaAtual.trim()) {
      alert('Campo "Carga Atual" é obrigatório.');
      return;
    }
    if (!formData.estadoConservacao) {
      alert('Campo "Estado de Conservação" é obrigatório.');
      return;
    }

    try {
      const response = await fetch("/api/update-inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome,
          numero: itemSelecionado.numero,
          salaEncontrada: formData.salaEncontrada,
          sala: itemSelecionado.salaEncontrada || itemSelecionado.sala,
          dataInventario: new Date().toISOString(),
          status: formData.statusInventario,
          estadoConservacao: formData.estadoConservacao,
          cargaAtual: formData.cargaAtual,
          inventariante: formData.inventariante,
        }),
      });

      if (response.ok) {
        setItens((prev) =>
          prev.map((item) =>
            item.numero === itemSelecionado.numero
              ? {
                  ...item,
                  salaEncontrada: formData.salaEncontrada,
                  statusInventario: formData.statusInventario,
                  estadoConservacao: formData.estadoConservacao,
                  cargaAtual: formData.cargaAtual,
                  inventariante: formData.inventariante,
                  dataInventario: new Date().toISOString(),
                }
              : item
          )
        );
        setModalAberto(false);
        setItemSelecionado(null);
        alert("Item inventariado com sucesso!");
      } else {
        throw new Error("Erro ao inventariar item");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao inventariar item. Tente novamente.");
    }
  };

  // Loading de autenticação
  if (status === "loading" || accessLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-lg">Verificando permissões...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
        <p className="text-gray-600 text-center">
          Você precisa estar autenticado para acessar esta página.
        </p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
        <p className="text-gray-600 text-center">
          Você não tem permissão para acessar este inventário.
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

  return (
    <div style={{ padding: "20px" }}>
      <h2>Busca de Itens por Nome</h2>
      <h2>
        <a
          href={`/inventario/${nome}`}
          style={{
            color: "#007bff",
            textDecoration: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
          title="Clique para ir ao inventário"
        >
          {nome}
        </a>
      </h2>

      {/* Formulário de Busca */}
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
          🔍 Buscar por Descrição
        </h3>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <input
            type="text"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Digite parte da descrição do item..."
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
            autoFocus
          />
          <Button
            type="submit"
            style={{
              backgroundColor: "#007bff",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              alignSelf: "flex-start",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#0056b3")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#007bff")}
          >
            🔍 Buscar
          </Button>
        </form>
        {termoPesquisado && !loading && buscaRealizada && (
          <p style={{ margin: "10px 0 0", fontSize: "14px", color: "#6c757d" }}>
            {`${itens.length} item(ns) encontrado(s) para "${termoPesquisado}"`}
          </p>
        )}

        {/* Filtro de status de inventário */}
        {buscaRealizada && itens.length > 0 && (
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <input
                type="radio"
                name="filtroInventario"
                value="todos"
                checked={filtro === "todos"}
                onChange={() => setFiltro("todos")}
              />
              Todos ({itens.length})
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontSize: "14px",
                color: "#155724",
              }}
            >
              <input
                type="radio"
                name="filtroInventario"
                value="inventariados"
                checked={filtro === "inventariados"}
                onChange={() => setFiltro("inventariados")}
              />
              ✅ Inventariados ({itens.filter((i) => i.dataInventario).length})
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontSize: "14px",
                color: "#721c24",
              }}
            >
              <input
                type="radio"
                name="filtroInventario"
                value="nao-inventariados"
                checked={filtro === "nao-inventariados"}
                onChange={() => setFiltro("nao-inventariados")}
              />
              ⏳ Não inventariados (
              {itens.filter((i) => !i.dataInventario).length})
            </label>
          </div>
        )}
      </div>

      {/* Feedback de erro */}
      {error && <p style={{ color: "red", marginBottom: "15px" }}>{error}</p>}

      {/* Carregando */}
      {loading && (
        <p style={{ color: "#6c757d", fontStyle: "italic" }}>
          Buscando itens...
        </p>
      )}

      {/* Sem resultados */}
      {buscaRealizada && !loading && itens.length === 0 && (
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
          📦 Nenhum item encontrado para &quot;{termoPesquisado}&quot;
        </div>
      )}

      {/* Estado inicial */}
      {!buscaRealizada && !loading && !termoPesquisado && (
        <div
          style={{
            padding: "20px",
            border: "1px dashed #ccc",
            backgroundColor: "#fdfdfd",
            color: "#888",
            textAlign: "center",
            fontStyle: "italic",
            borderRadius: "5px",
          }}
        >
          Digite um termo acima e clique em &quot;Buscar&quot; para encontrar
          itens pela descrição.
        </div>
      )}

      {/* Lista de Itens */}
      {!loading &&
        itens.length > 0 &&
        (() => {
          const itensFiltrados =
            filtro === "inventariados"
              ? itens.filter((i) => i.dataInventario)
              : filtro === "nao-inventariados"
                ? itens.filter((i) => !i.dataInventario)
                : itens;

          return (
            <>
              {itensFiltrados.length === 0 && (
                <div
                  style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    backgroundColor: "#f8f9fa",
                    color: "#6c757d",
                    textAlign: "center",
                    fontStyle: "italic",
                    borderRadius: "5px",
                    marginBottom: "10px",
                  }}
                >
                  Nenhum item corresponde ao filtro selecionado.
                </div>
              )}
              <ul style={{ listStyle: "none", padding: 0 }}>
                {itensFiltrados.map((item, index) => (
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
                        : "#f8d7da",
                      color: item.dataInventario ? "#155724" : "#721c24",
                      borderRadius: "5px",
                      position: "relative",
                    }}
                  >
                    {/* Badge INVENTARIADO */}
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
                    {/* Badge CORRIGIDO */}
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
                    {/* Badge CADASTRADO */}
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
                    {/* Badge SEM ETIQUETA */}
                    {item.numero?.startsWith("99999") && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-8px",
                          left: "10px",
                          backgroundColor: "#e67e22",
                          color: "white",
                          padding: "2px 8px",
                          fontSize: "12px",
                          borderRadius: "10px",
                          fontWeight: "bold",
                        }}
                      >
                        🏷️ SEM ETIQUETA
                      </div>
                    )}
                    {/* Badge MOVIDO */}
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
                    <strong>Sala:</strong>{" "}
                    {item.salaEncontrada || item.sala || "N/A"} <br />
                    <strong>Status:</strong>{" "}
                    {item.statusInventario || item.status || "N/A"} <br />
                    <strong>Carga atual:</strong> {item.cargaAtual || "N/A"}{" "}
                    <br />
                    <strong>Inventariante:</strong>{" "}
                    {item.inventariante?.nome || item.inventariante || "N/A"}{" "}
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
                    {item.salaEncontrada &&
                      item.sala &&
                      item.salaEncontrada !== item.sala && (
                        <>
                          <br />
                          <strong style={{ color: "#9c27b0" }}>
                            🚚 Item movido — Sala original: {item.sala}
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
                    {item.numero?.startsWith("99999") && (
                      <>
                        <br />
                        <strong style={{ color: "#e67e22" }}>
                          🏷️ Sobra de inventário — Bem sem etiqueta
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
                            {new Date(item.ultimaCorrecao).toLocaleString(
                              "pt-BR"
                            )}
                          </div>
                        )}
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
                                    const [nomeCampo, valores] =
                                      campo.split(": ");
                                    if (valores) {
                                      const [original, novo] =
                                        valores.split(" → ");
                                      dadosCorrigidos[nomeCampo] = {
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
                    {/* Botão de inventário apenas para itens não inventariados */}
                    {!item.dataInventario && (
                      <div style={{ marginTop: "10px" }}>
                        <Button
                          onClick={() => abrirModalInventario(item)}
                          style={{
                            backgroundColor: "#28a745",
                            color: "white",
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#218838";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#28a745";
                          }}
                        >
                          📝 Inventariar Item
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          );
        })()}

      {/* Modal de Inventário */}
      {modalAberto && itemSelecionado && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Inventariar Item: {itemSelecionado.numero}
            </h3>
            <p style={{ marginBottom: "15px" }}>
              <strong>Descrição:</strong> {itemSelecionado.descricao || "N/A"}
            </p>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Data do Inventário:
                <input
                  type="date"
                  value={formData.dataInventario}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    backgroundColor: "#f8f9fa",
                  }}
                />
              </label>

              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Inventariante:
                <input
                  type="text"
                  value={formData.inventariante}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    backgroundColor: "#f8f9fa",
                  }}
                />
              </label>

              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Sala Encontrada:
                <select
                  value={formData.salaEncontrada}
                  onChange={(e) =>
                    setFormData({ ...formData, salaEncontrada: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                >
                  <option value="">Selecione uma sala</option>
                  {salas.map((sala) => (
                    <option key={sala} value={sala}>
                      {sala}
                    </option>
                  ))}
                </select>
              </label>

              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Status do Inventário:
                <select
                  value={formData.statusInventario}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      statusInventario: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Carga Atual:
                <select
                  value={formData.cargaAtual}
                  onChange={(e) =>
                    setFormData({ ...formData, cargaAtual: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                >
                  <option value="">Selecione um servidor</option>
                  {servidores.map((servidor) => (
                    <option key={servidor} value={servidor}>
                      {servidor}
                    </option>
                  ))}
                </select>
              </label>

              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Estado de Conservação:
                <select
                  value={formData.estadoConservacao}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estadoConservacao: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                >
                  {ESTADOS_CONSERVACAO.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </label>

              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Observações:
                <textarea
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "5px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    minHeight: "60px",
                  }}
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <Button
                onClick={enviarInventario}
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#218838";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#28a745";
                }}
              >
                ✅ Confirmar Inventário
              </Button>
              <Button
                onClick={() => setModalAberto(false)}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#5a6268";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#6c757d";
                }}
              >
                ❌ Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
