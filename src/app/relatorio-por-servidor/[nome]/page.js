"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../../components/Button";

export default function RelatorioPorServidorPage({ params }) {
  const unwrappedParams = React.use(params);
  const [nome, setNome] = useState(unwrappedParams?.nome || "");

  const { data: session, status } = useSession();
  const router = useRouter();
  const [itensPorServidor, setItensPorServidor] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [servidoresFiltrados, setServidoresFiltrados] = useState([]);
  const [todosServidores, setTodosServidores] = useState([]);
  const [mostrarTodosServidores, setMostrarTodosServidores] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [salas, setSalas] = useState([]);
  const [filtroInventario, setFiltroInventario] = useState("todos");
  const [ordenacao, setOrdenacao] = useState("alfabetica");
  const [ordenacaoDropdown, setOrdenacaoDropdown] = useState("alfabetica");
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
        // Buscar todos os servidores, itens, correções e salas em paralelo
        const [servidoresRes, itensRes, correcoesRes, salasRes] =
          await Promise.all([
            fetch(`/api/servidores?inventario=${encodeURIComponent(nome)}`),
            fetch(`/api/inventario?inventario=${encodeURIComponent(nome)}`),
            fetch(`/api/correcoes-todas/${encodeURIComponent(nome)}`),
            fetch(`/api/salas?inventario=${encodeURIComponent(nome)}`),
          ]);

        if (!servidoresRes.ok) {
          const errorData = await servidoresRes.json();
          throw new Error(errorData.error || "Erro ao carregar servidores.");
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
        if (!salasRes.ok) {
          console.warn(
            "Erro ao carregar salas, continuando sem elas:",
            await salasRes.text()
          );
        }

        const servidores = await servidoresRes.json();
        const itens = await itensRes.json();
        const correcoesData = correcoesRes.ok
          ? await correcoesRes.json()
          : { correcoesPorItem: {} };
        const correcoesPorItem = correcoesData.correcoesPorItem || {};
        const salasData = salasRes.ok ? await salasRes.json() : [];

        // Coletar salas únicas dos itens
        const salasSet = new Set();
        itens.forEach((item) => {
          if (item.sala) salasSet.add(item.sala);
          if (item.salaEncontrada) salasSet.add(item.salaEncontrada);
        });
        // Adicionar salas da API também
        salasData.forEach((sala) => {
          if (sala.nome) salasSet.add(sala.nome);
        });
        const salasFromItems = Array.from(salasSet)
          .filter((s) => s)
          .sort();

        // Guardar todos os servidores para o filtro
        setTodosServidores(servidores.sort());
        setServidoresFiltrados(servidores.sort());
        setSalas(salasFromItems);

        // Agrupar itens por servidor (cargaAtual)
        const agrupado = {};
        servidores.forEach((servidor) => {
          agrupado[servidor] = [];
        });

        // Agrupar itens por servidor e incluir correções (já carregadas)
        for (const item of itens) {
          const servidor = item.cargaAtual || "Servidor não definido";

          if (!agrupado[servidor]) {
            agrupado[servidor] = [];
          }

          // Adicionar item com suas correções (já carregadas da API)
          agrupado[servidor].push({
            ...item,
            historicoCorrecoes: correcoesPorItem[item.numero] || [],
          });
        }

        setItensPorServidor(agrupado);
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
      salaEncontrada: item.salaEncontrada || item.sala || "",
      statusInventario: item.statusInventario || "Em Uso",
      cargaAtual: item.cargaAtual || "",
      estadoConservacao: item.estadoConservacao || "Bom",
      observacoes: item.observacoesInventario || "",
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
          observacoes: formData.observacoes,
        }),
      });

      if (response.ok) {
        // Atualizar o estado local
        const novosItensPorServidor = { ...itensPorServidor };
        const servidor = formData.cargaAtual;

        // Remover item do servidor antigo se mudou
        if (
          itemSelecionado.cargaAtual &&
          itemSelecionado.cargaAtual !== servidor
        ) {
          const servidorAntigo = itemSelecionado.cargaAtual;
          if (novosItensPorServidor[servidorAntigo]) {
            novosItensPorServidor[servidorAntigo] = novosItensPorServidor[
              servidorAntigo
            ].filter((item) => item.numero !== itemSelecionado.numero);
          }
        }

        // Adicionar ou atualizar no novo servidor
        if (!novosItensPorServidor[servidor]) {
          novosItensPorServidor[servidor] = [];
        }
        const itemIndex = novosItensPorServidor[servidor].findIndex(
          (item) => item.numero === itemSelecionado.numero
        );
        if (itemIndex >= 0) {
          novosItensPorServidor[servidor][itemIndex] = {
            ...novosItensPorServidor[servidor][itemIndex],
            ...formData,
            dataInventario: formData.dataInventario,
            observacoesInventario: formData.observacoes,
          };
        } else {
          novosItensPorServidor[servidor].push({
            ...itemSelecionado,
            ...formData,
            dataInventario: formData.dataInventario,
            observacoesInventario: formData.observacoes,
          });
        }

        setItensPorServidor(novosItensPorServidor);
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

  const handleToggleServidor = (servidor) => {
    if (servidoresFiltrados.includes(servidor)) {
      setServidoresFiltrados(servidoresFiltrados.filter((s) => s !== servidor));
    } else {
      setServidoresFiltrados([...servidoresFiltrados, servidor]);
    }
    setMostrarTodosServidores(false);
  };

  const handleMostrarTodos = () => {
    setMostrarTodosServidores(true);
    setServidoresFiltrados([...todosServidores]);
  };

  const handleLimparFiltros = () => {
    setMostrarTodosServidores(false);
    setServidoresFiltrados([]);
  };

  // Função para filtrar itens por status de inventário
  const filtrarItens = (itens) => {
    if (filtroInventario === "inventariados")
      return itens.filter((i) => i.dataInventario);
    if (filtroInventario === "naoInventariados")
      return itens.filter((i) => !i.dataInventario);
    return itens;
  };

  // Contadores gerais
  const totalGeral = Object.values(itensPorServidor).flat();
  const totalInventariados = totalGeral.filter((i) => i.dataInventario).length;
  const totalNaoInventariados = totalGeral.length - totalInventariados;

  const servidoresParaExibir = (() => {
    let lista = mostrarTodosServidores
      ? Object.keys(itensPorServidor)
      : Object.keys(itensPorServidor).filter((servidor) =>
          servidoresFiltrados.includes(servidor)
        );

    // Ocultar servidores sem itens após a filtragem
    if (filtroInventario !== "todos") {
      lista = lista.filter(
        (servidor) => filtrarItens(itensPorServidor[servidor] || []).length > 0
      );
    }

    // Ordenação
    if (ordenacao === "maisNaoInventariados") {
      lista.sort((a, b) => {
        const naoInvA = (itensPorServidor[a] || []).filter(
          (i) => !i.dataInventario
        ).length;
        const naoInvB = (itensPorServidor[b] || []).filter(
          (i) => !i.dataInventario
        ).length;
        if (naoInvB !== naoInvA) return naoInvB - naoInvA;
        return a.localeCompare(b);
      });
    } else if (ordenacao === "maiorPorcentagem") {
      lista.sort((a, b) => {
        const totalA = (itensPorServidor[a] || []).length;
        const totalB = (itensPorServidor[b] || []).length;
        const pctA =
          totalA > 0
            ? (itensPorServidor[a] || []).filter((i) => !i.dataInventario)
                .length / totalA
            : 0;
        const pctB =
          totalB > 0
            ? (itensPorServidor[b] || []).filter((i) => !i.dataInventario)
                .length / totalB
            : 0;
        if (pctB !== pctA) return pctB - pctA;
        return a.localeCompare(b);
      });
    } else {
      lista.sort();
    }

    return lista;
  })();

  return (
    <div style={{ padding: "20px" }}>
      <h2>Relatório por Carga Atual</h2>
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

      {/* Resumo Geral */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          backgroundColor: "#e9ecef",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "16px" }}>
          📊 Resumo Geral:
        </div>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <span
            style={{
              padding: "4px 10px",
              backgroundColor: "#6c757d",
              color: "white",
              borderRadius: "12px",
              fontSize: "14px",
            }}
          >
            📦 {totalGeral.length} bens
          </span>
          <span
            style={{
              padding: "4px 10px",
              backgroundColor: "#28a745",
              color: "white",
              borderRadius: "12px",
              fontSize: "14px",
            }}
          >
            ✅ {totalInventariados} inventariados
          </span>
          <span
            style={{
              padding: "4px 10px",
              backgroundColor: "#dc3545",
              color: "white",
              borderRadius: "12px",
              fontSize: "14px",
            }}
          >
            ⏳ {totalNaoInventariados} pendentes
          </span>
          <span
            style={{
              padding: "4px 10px",
              backgroundColor: "#007bff",
              color: "white",
              borderRadius: "12px",
              fontSize: "14px",
            }}
          >
            {totalGeral.length > 0
              ? Math.round((totalInventariados / totalGeral.length) * 100)
              : 0}
            % concluído
          </span>
        </div>
      </div>

      {/* Filtro de Servidores */}
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
          🔍 Filtrar por Carga Atual
        </h3>
        <div style={{ marginBottom: "10px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "5px",
              fontWeight: "bold",
            }}
          >
            Selecione uma carga atual:
          </label>
          <select
            value={
              mostrarTodosServidores
                ? ""
                : servidoresFiltrados.length === 1
                  ? servidoresFiltrados[0]
                  : ""
            }
            onChange={(e) => {
              const selectedValue = e.target.value;
              if (selectedValue === "") {
                setServidoresFiltrados([...todosServidores]);
                setMostrarTodosServidores(true);
              } else {
                setServidoresFiltrados([selectedValue]);
                setMostrarTodosServidores(false);
              }
            }}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontSize: "14px",
              backgroundColor: "white",
            }}
          >
            <option value="">Mostrar todos os servidores</option>
            {[...todosServidores]
              .sort((a, b) => {
                if (ordenacaoDropdown === "maisNaoInventariados") {
                  const naoInvA = (itensPorServidor[a] || []).filter(
                    (i) => !i.dataInventario
                  ).length;
                  const naoInvB = (itensPorServidor[b] || []).filter(
                    (i) => !i.dataInventario
                  ).length;
                  if (naoInvB !== naoInvA) return naoInvB - naoInvA;
                } else if (ordenacaoDropdown === "maiorPorcentagem") {
                  const totalA = (itensPorServidor[a] || []).length;
                  const totalB = (itensPorServidor[b] || []).length;
                  const pctA =
                    totalA > 0
                      ? (itensPorServidor[a] || []).filter(
                          (i) => !i.dataInventario
                        ).length / totalA
                      : 0;
                  const pctB =
                    totalB > 0
                      ? (itensPorServidor[b] || []).filter(
                          (i) => !i.dataInventario
                        ).length / totalB
                      : 0;
                  if (pctB !== pctA) return pctB - pctA;
                }
                return a.localeCompare(b);
              })
              .map((servidor) => {
                const pendentes = (itensPorServidor[servidor] || []).filter(
                  (i) => !i.dataInventario
                ).length;
                const total = (itensPorServidor[servidor] || []).length;
                const pct =
                  total > 0 ? Math.round((pendentes / total) * 100) : 0;
                return (
                  <option key={servidor} value={servidor}>
                    {servidor} ({pendentes} pendente{pendentes !== 1 ? "s" : ""}{" "}
                    de {total} — {pct}%)
                  </option>
                );
              })}
          </select>
        </div>
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ fontSize: "14px", color: "#6c757d" }}>
            {mostrarTodosServidores
              ? `Exibindo todos os ${todosServidores.length} cargas atuais`
              : servidoresFiltrados.length === 1
                ? `Exibindo apenas: ${servidoresFiltrados[0]}`
                : `Exibindo todos os ${todosServidores.length} cargas atuais`}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "#6c757d" }}>
              Ordenar lista:
            </span>
            <select
              value={ordenacaoDropdown}
              onChange={(e) => setOrdenacaoDropdown(e.target.value)}
              style={{
                padding: "4px 10px",
                fontSize: "13px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "white",
                cursor: "pointer",
              }}
            >
              <option value="alfabetica">🔤 Alfabética</option>
              <option value="maisNaoInventariados">⏳ Mais pendentes</option>
              <option value="maiorPorcentagem">📊 Maior % pendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtro de Status do Inventário e Ordenação */}
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
          🎯 Filtro e Ordenação
        </h3>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Status do Inventário:
            </label>
            <select
              value={filtroInventario}
              onChange={(e) => setFiltroInventario(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "white",
              }}
            >
              <option value="todos">Mostrar todos os bens</option>
              <option value="inventariados">Apenas inventariados ✅</option>
              <option value="naoInventariados">
                Apenas não inventariados ⏳
              </option>
            </select>
          </div>
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
              }}
            >
              Ordenar servidores por:
            </label>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "white",
              }}
            >
              <option value="alfabetica">Ordem alfabética (A → Z)</option>
              <option value="maisNaoInventariados">
                Mais bens não inventariados primeiro
              </option>
              <option value="maiorPorcentagem">
                Maior % de não inventariados primeiro
              </option>
            </select>
          </div>
        </div>
      </div>

      {servidoresParaExibir.length === 0 && (
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
          📭 Nenhuma carga atual selecionada. Use o filtro acima para selecionar
          as cargas atuais que deseja visualizar.
        </div>
      )}

      {servidoresParaExibir.map((servidor) => {
        const itensDoServidor = itensPorServidor[servidor] || [];
        const itensFiltrados = filtrarItens(itensDoServidor);
        const totalServidor = itensDoServidor.length;
        const invServidor = itensDoServidor.filter(
          (i) => i.dataInventario
        ).length;
        const pendServidor = totalServidor - invServidor;

        return (
          <div key={servidor} style={{ marginBottom: "30px" }}>
            <h2>
              Carga Atual: {servidor}{" "}
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "normal",
                  color: "#6c757d",
                }}
              >
                ({totalServidor} {totalServidor === 1 ? "bem" : "bens"} —{" "}
                <span style={{ color: "#28a745" }}>
                  {invServidor}{" "}
                  {invServidor === 1 ? "inventariado" : "inventariados"}
                </span>
                ,{" "}
                <span style={{ color: "#dc3545" }}>
                  {pendServidor} {pendServidor === 1 ? "pendente" : "pendentes"}
                </span>
                )
              </span>
            </h2>
            {itensFiltrados.length === 0 ? (
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
                📦 Nenhum item encontrado para esta carga atual
                {filtroInventario !== "todos"
                  ? " com o filtro selecionado"
                  : ""}
              </div>
            ) : (
              <ul>
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
                    <strong>Sala:</strong> {item.sala || "N/A"} <br />
                    <strong>Status:</strong>{" "}
                    {item.statusInventario || item.status || "N/A"} <br />
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
        );
      })}

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
                  {todosServidores.map((servidor) => (
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
