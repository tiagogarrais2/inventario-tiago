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
  const [salaSelecionada, setSalaSelecionada] = useState("");
  const [todasSalas, setTodasSalas] = useState([]);
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

  // Lista fixa de status
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

  // Lista fixa de estados de conservação
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

  useEffect(() => {
    if (!hasAccess || accessLoading) return;

    async function fetchRelatorio() {
      try {
        // Buscar todas as salas, itens, correções e servidores em paralelo
        const [salasRes, itensRes, correcoesRes, servidoresRes] =
          await Promise.all([
            fetch(`/api/salas?inventario=${encodeURIComponent(nome)}`),
            fetch(`/api/inventario?inventario=${encodeURIComponent(nome)}`),
            fetch(`/api/correcoes-todas/${encodeURIComponent(nome)}`),
            fetch(`/api/servidores?inventario=${encodeURIComponent(nome)}`),
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

        if (!servidoresRes.ok) {
          console.warn(
            "Erro ao carregar servidores, continuando sem lista de servidores:",
            await servidoresRes.text()
          );
          setServidores([]);
        } else {
          const servidoresData = await servidoresRes.json();
          setServidores(servidoresData);
        }

        const salas = await salasRes.json();
        const itens = await itensRes.json();
        const correcoesData = correcoesRes.ok
          ? await correcoesRes.json()
          : { correcoesPorItem: {} };
        const correcoesPorItem = correcoesData.correcoesPorItem || {};

        // Guardar todas as salas para o dropdown
        setTodasSalas(salas.sort());

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

  // Função para abrir modal de inventário
  const abrirModalInventario = (item) => {
    setItemSelecionado(item);
    setFormData({
      dataInventario: new Date().toISOString().split("T")[0],
      inventariante: session?.user?.email || "",
      salaEncontrada: salaSelecionada,
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

    // Validação dos campos obrigatórios
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
        headers: {
          "Content-Type": "application/json",
        },
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
        // Atualizar o estado local
        const novosItensPorSala = { ...itensPorSala };
        const sala = salaSelecionada;

        novosItensPorSala[sala] = novosItensPorSala[sala].map((item) =>
          item.numero === itemSelecionado.numero
            ? { ...item, ...formData, dataInventario: formData.dataInventario }
            : item
        );

        setItensPorSala(novosItensPorSala);
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

  const handleSalaChange = (sala) => {
    setSalaSelecionada(sala);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Relatório de Itens organizados por sala</h2>
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

      {/* Seleção de Sala */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          backgroundColor: "#f8f9fa",
        }}
      >
        <h3 style={{ margin: 0, marginBottom: "10px" }}>🏢 Selecionar Sala</h3>
        <select
          value={salaSelecionada}
          onChange={(e) => setSalaSelecionada(e.target.value)}
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px",
            minWidth: "200px",
            backgroundColor: "white",
          }}
        >
          <option value="">Selecione uma sala...</option>
          <option value="todas">🏢 Todas as salas</option>
          {todasSalas.map((sala) => (
            <option key={sala} value={sala}>
              {sala} ({itensPorSala[sala]?.length || 0} itens)
            </option>
          ))}
        </select>
        {salaSelecionada && salaSelecionada !== "todas" && (
          <span
            style={{ marginLeft: "10px", fontSize: "14px", color: "#6c757d" }}
          >
            {itensPorSala[salaSelecionada]?.length || 0} itens nesta sala
          </span>
        )}
        {salaSelecionada === "todas" && (
          <span
            style={{ marginLeft: "10px", fontSize: "14px", color: "#6c757d" }}
          >
            {todasSalas.reduce(
              (total, sala) => total + (itensPorSala[sala]?.length || 0),
              0
            )}{" "}
            itens em todas as salas
          </span>
        )}
      </div>

      {!salaSelecionada && (
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
          🏢 Selecione uma sala no dropdown acima para visualizar os itens.
        </div>
      )}

      {salaSelecionada && salaSelecionada !== "todas" && (
        <div style={{ marginBottom: "30px" }}>
          <h2>Sala: {salaSelecionada}</h2>
          {!itensPorSala[salaSelecionada] ||
          itensPorSala[salaSelecionada].length === 0 ? (
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
              {itensPorSala[salaSelecionada].map((item, index) => (
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
                  {/* Badge SEM ETIQUETA - quando número começa com 99999 */}
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
                  <strong>Carga atual:</strong> {item.cargaAtual || "N/A"}{" "}
                  <br />
                  <strong>Inventariante:</strong>{" "}
                  {item.inventariante?.nome || item.inventariante || "N/A"}{" "}
                  <br />
                  <strong>Data do Inventário:</strong>{" "}
                  {item.dataInventario
                    ? new Date(item.dataInventario).toLocaleDateString()
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
                        📋 Este item possui {item.totalCorrecoes} correção(ões)
                        de dados
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
                                        original?.replace(/&quot;/g, "") || "",
                                      novo: novo?.replace(/&quot;/g, "") || "",
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
                                    Correção #{idx + 1} • {dataCorrecao} • Por:{" "}
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
                                            {valor?.original || "Não informado"}
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
          )}
        </div>
      )}

      {salaSelecionada === "todas" && (
        <div style={{ marginBottom: "30px" }}>
          <h2>🏢 Todas as Salas</h2>
          {todasSalas.length === 0 ? (
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
              📦 Nenhuma sala encontrada
            </div>
          ) : (
            todasSalas.sort().map((sala) => (
              <div key={sala} style={{ marginBottom: "30px" }}>
                <h3>Sala: {sala}</h3>
                {!itensPorSala[sala] || itensPorSala[sala].length === 0 ? (
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
                        {/* Badge SEM ETIQUETA - quando número começa com 99999 */}
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
                        <strong>Descrição:</strong> {item.descricao || "N/A"}{" "}
                        <br />
                        <strong>Status:</strong>{" "}
                        {item.statusInventario || item.status || "N/A"} <br />
                        <strong>Carga atual:</strong> {item.cargaAtual || "N/A"}{" "}
                        <br />
                        <strong>Inventariante:</strong>{" "}
                        {item.inventariante?.nome ||
                          item.inventariante ||
                          "N/A"}{" "}
                        <br />
                        <strong>Data do Inventário:</strong>{" "}
                        {item.dataInventario
                          ? new Date(item.dataInventario).toLocaleDateString()
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
                                  {item.historicoCorrecoes.map(
                                    (correcao, idx) => {
                                      const dataCorrecao = new Date(
                                        correcao.createdAt
                                      ).toLocaleString("pt-BR");

                                      // Extrair diferenças das observações
                                      let dadosCorrigidos = {};
                                      let observacoesLimpas =
                                        correcao.observacoes || "";

                                      const regexCampos =
                                        /Campos alterados: (.+)/;
                                      const match =
                                        observacoesLimpas.match(regexCampos);

                                      if (match) {
                                        observacoesLimpas = observacoesLimpas
                                          .replace(
                                            /\n\nCampos alterados:.+/,
                                            ""
                                          )
                                          .trim();
                                        const camposTexto = match[1];
                                        const campos = camposTexto.split(" | ");

                                        campos.forEach((campo) => {
                                          const [nome, valores] =
                                            campo.split(": ");
                                          if (valores) {
                                            const [original, novo] =
                                              valores.split(" → ");
                                            dadosCorrigidos[nome] = {
                                              original:
                                                original?.replace(
                                                  /&quot;/g,
                                                  ""
                                                ) || "",
                                              novo:
                                                novo?.replace(/&quot;/g, "") ||
                                                "",
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
                                              idx > 0
                                                ? "1px solid #ddd"
                                                : "none",
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontWeight: "bold",
                                              color: "#856404",
                                            }}
                                          >
                                            Correção #{idx + 1} • {dataCorrecao}{" "}
                                            • Por:{" "}
                                            {correcao.inventariante?.nome ||
                                              correcao.inventariante?.email ||
                                              "Usuário não identificado"}
                                          </div>

                                          {Object.keys(dadosCorrigidos).length >
                                            0 &&
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
                                                  <div
                                                    style={{ fontSize: "12px" }}
                                                  >
                                                    Valor original: &quot;
                                                    {valor?.original ||
                                                      "Não informado"}
                                                    &quot; → Novo valor: &quot;
                                                    {valor?.novo ||
                                                      "Não informado"}
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
                                    }
                                  )}
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
                )}
              </div>
            ))
          )}
        </div>
      )}

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
                  {todasSalas.map((sala) => (
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
