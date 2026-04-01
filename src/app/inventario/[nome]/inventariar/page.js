"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "../../../components/Button";

// Lista fixa de estados de conservação
const ESTADOS_CONSERVACAO = [
  "Bom",
  "Regular",
  "Ocioso",
  "Recuperável",
  "Antieconômico",
];

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

export default function InventariarPage({ params }) {
  const unwrappedParams = React.use(params);
  const [nome, setNome] = useState(unwrappedParams?.nome || "");
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados para inventário
  const [valor, setValor] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [salas, setSalas] = useState([]);
  const [salaSelecionada, setSalaSelecionada] = useState("");
  const [inventariante, setInventariante] = useState("");
  const [statusSelecionado, setStatusSelecionado] = useState("Em Uso");
  const [estadoConservacaoSelecionado, setEstadoConservacaoSelecionado] =
    useState("Bom");
  const [cargaAtualSelecionada, setCargaAtualSelecionada] = useState("");
  const [salaItemSelecionada, setSalaItemSelecionada] = useState("");
  const [servidores, setServidores] = useState([]);
  const [ultimoTombo, setUltimoTombo] = useState("");
  const [notificacao, setNotificacao] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [serieValor, setSerieValor] = useState("");
  const [mostrarBuscaSerie, setMostrarBuscaSerie] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const inputRef = useRef(null);

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

    // Define inventariante automaticamente com base na sessão
    if (session?.user?.name) {
      setInventariante(session.user.name);
    }

    // Carrega notificação persistente do localStorage
    const notificacaoSalva = localStorage.getItem("notificacao");
    if (notificacaoSalva) {
      setNotificacao(notificacaoSalva);
      localStorage.removeItem("notificacao");
    }

    async function fetchSalas() {
      try {
        const [salasRes, servidoresRes] = await Promise.all([
          fetch(`/api/salas?inventario=${encodeURIComponent(nome)}`),
          fetch(`/api/servidores?inventario=${encodeURIComponent(nome)}`),
        ]);

        if (!salasRes.ok) {
          const errorData = await salasRes.json();
          throw new Error(
            errorData.error || `Erro ${salasRes.status}: ${salasRes.statusText}`
          );
        }

        if (!servidoresRes.ok) {
          // Servidores podem não existir ainda, então não é erro crítico
          console.warn(
            "Servidores não encontrados, continuando sem lista de servidores"
          );
          setServidores([]);
        } else {
          const servidoresData = await servidoresRes.json();
          setServidores(servidoresData);
        }

        const salasData = await salasRes.json();
        setSalas(salasData);
        const salaSalva = localStorage.getItem("salaSelecionada");
        if (salaSalva && salasData.includes(salaSalva)) {
          setSalaSelecionada(salaSalva);
        } else if (salasData.length > 0) {
          setSalaSelecionada(salasData[0]);
        }
      } catch (error) {
        console.error("Erro ao carregar salas:", error);
        setErro(`Erro ao carregar salas: ${error.message}`);
        setSalas([]);
        setServidores([]);
      }
    }
    fetchSalas();

    // Foca no input do tombo após carregamento
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [nome, hasAccess, accessLoading, session]);

  function handleSalaChange(e) {
    setSalaSelecionada(e.target.value);
    localStorage.setItem("salaSelecionada", e.target.value);
  }

  async function buscarInventario() {
    setErro("");
    setResultado(null);
    setMostrarBuscaSerie(false);
    setSerieValor("");
    if (!valor) return;

    try {
      const res = await fetch(
        `/api/inventario?inventario=${encodeURIComponent(nome)}&tombo=${encodeURIComponent(valor)}`
      );

      if (!res.ok) {
        const errorData = await res.json();
        if (
          res.status === 404 &&
          errorData.error.includes("Item não encontrado")
        ) {
          setErro("Item não encontrado.");
          setMostrarBuscaSerie(true);
          return;
        }
        throw new Error(errorData.error || "Erro ao buscar item.");
      }

      const item = await res.json();
      setResultado(item);

      // Inicializar selects com valores atuais do item (priorizar campos do inventário)
      setStatusSelecionado(item.statusInventario || item.status || "Em Uso");
      setEstadoConservacaoSelecionado(item.estadoConservacao || "Bom");
      setCargaAtualSelecionada(item.cargaAtual || "");
      setSalaItemSelecionada(item.sala || "");
      setObservacoes(item.observacoesInventario || "");
    } catch (error) {
      setErro("Erro ao buscar o item.");
      console.error("Erro na busca:", error);
    }
  }

  async function buscarPorSerie() {
    setErro("");
    setResultado(null);
    if (!serieValor) return;

    try {
      const res = await fetch(
        `/api/inventario?inventario=${encodeURIComponent(nome)}&serie=${encodeURIComponent(serieValor)}`
      );

      if (!res.ok) {
        const errorData = await res.json();
        if (
          res.status === 404 &&
          errorData.error.includes("Item não encontrado")
        ) {
          setErro("Item não encontrado pelo número de série.");
          return;
        }
        throw new Error(errorData.error || "Erro ao buscar item por série.");
      }

      const item = await res.json();
      setResultado(item);

      // Inicializar selects com valores atuais do item (priorizar campos do inventário)
      setStatusSelecionado(item.statusInventario || item.status || "Em Uso");
      setEstadoConservacaoSelecionado(item.estadoConservacao || "Bom");
      setCargaAtualSelecionada(item.cargaAtual || "");
      setSalaItemSelecionada(item.sala || "");
      setObservacoes(item.observacoesInventario || "");
    } catch (error) {
      setErro("Erro ao buscar o item por série.");
      console.error("Erro na busca por série:", error);
    }
  }

  async function confirmarEncontrado() {
    if (!resultado || !inventariante) return;

    const salaOriginal = resultado.sala || "";
    const confirmarSala =
      salaItemSelecionada !== salaOriginal
        ? window.confirm(
            `A sala selecionada (${salaItemSelecionada}) difere da sala original (${salaOriginal}). Confirmar?`
          )
        : true;

    if (!confirmarSala) return;

    const dataInventario = new Date().toISOString();

    try {
      const res = await fetch("/api/update-inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          numero: valor,
          salaEncontrada: salaSelecionada,
          sala: salaItemSelecionada,
          dataInventario,
          status: statusSelecionado,
          estadoConservacao: estadoConservacaoSelecionado,
          cargaAtual: cargaAtualSelecionada,
          inventariante,
          observacoes,
        }),
      });

      if (res.ok) {
        setUltimoTombo(valor);
        setResultado(null);
        setValor("");
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        alert("Erro ao confirmar.");
      }
    } catch (error) {
      alert("Erro ao confirmar.");
    }
  }

  function handleChange(e) {
    setValor(e.target.value);
  }

  function handleConfirmar() {
    buscarInventario();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      buscarInventario();
    }
  }

  function handleCadastrar() {
    const params = new URLSearchParams({
      nome: nome,
      numero: valor,
      sala: salaSelecionada,
      from: "inventariar", // Indica que veio da página de inventário
    });
    router.push(`/cadastrar?${params.toString()}`);
  }

  async function handleCadastrarSemEtiqueta() {
    try {
      const res = await fetch(
        `/api/proximo-numero-sem-etiqueta?inventario=${encodeURIComponent(nome)}`
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao buscar próximo número.");
      }
      const { proximoNumero } = await res.json();
      const params = new URLSearchParams({
        nome: nome,
        numero: proximoNumero,
        sala: salaSelecionada,
        from: "inventariar",
      });
      router.push(`/cadastrar?${params.toString()}`);
    } catch (error) {
      alert(`Erro ao cadastrar bem sem etiqueta: ${error.message}`);
    }
  }

  function handleDadosIncorretos() {
    if (!resultado) return;

    const params = new URLSearchParams({
      nome: nome,
      isCorrecao: "true",
      numeroOriginal: resultado.numero,
      numero: resultado.numero,
      sala: salaSelecionada,
      status: resultado.status || "",
      descricao: resultado.descricao || "",
      cargaAtual: resultado.cargaAtual || "",
      estadoConservacao: resultado.estadoConservacao || "",
      from: "inventariar", // Indica que veio da página de inventário
    });

    router.push(`/cadastrar?${params.toString()}`);
  }

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
          Você precisa estar autenticado para acessar o inventário.
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
          Você não tem permissão para acessar este inventário.
        </p>
        <p className="text-sm text-gray-500 text-center">
          Entre em contato com o proprietário do inventário para solicitar
          acesso.
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
    <div>
      {/* Notificação persistente */}
      {notificacao && (
        <div
          style={{
            padding: "10px 20px",
            backgroundColor: "#d4edda",
            color: "#155724",
            border: "1px solid #c3e6cb",
            borderRadius: "4px",
            zIndex: 1000,
            fontWeight: "bold",
          }}
        >
          {notificacao}
        </div>
      )}

      {/* Notificação de último tombo inventariado */}
      {ultimoTombo && (
        <div
          style={{
            padding: "10px 20px",
            textAlign: "center",
            backgroundColor: "#d4edda",
            color: "#155724",
            border: "1px solid #c3e6cb",
            borderRadius: "4px",
            zIndex: 1000,
            fontWeight: "bold",
          }}
        >
          Último tombo inventariado: {ultimoTombo}
        </div>
      )}

      {/* Cabeçalho */}
      <div>
        <h1>
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
            title="Voltar ao inventário"
          >
            {nome}
          </a>
        </h1>
      </div>

      <hr />

      {/* Inventariante - exibido automaticamente */}
      <p className="mb-4">
        <strong>Inventariante:</strong>{" "}
        {inventariante || "Carregando nome do usuário..."}
      </p>

      {/* Campo de seleção de sala atual do inventário */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{ display: "block", fontWeight: "bold", marginBottom: "4px" }}
        >
          🏢 Sala atual do inventário:
        </label>
        <select
          value={salaSelecionada}
          onChange={handleSalaChange}
          style={{
            padding: "4px 8px",
            fontSize: "14px",
            minWidth: "200px",
            border: "2px solid #4CAF50",
            borderRadius: "4px",
            backgroundColor: "#f0f8f0",
          }}
        >
          {salas.map((sala) => (
            <option key={sala} value={sala}>
              {sala}
            </option>
          ))}
        </select>
      </div>

      <input
        type="number"
        value={valor}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Digite o número do tombo"
        ref={inputRef}
      />
      <Button onClick={handleConfirmar}>Confirmar</Button>

      {erro && <p style={{ color: "red", textAlign: "center" }}>{erro}</p>}
      {erro === "Item não encontrado." && (
        <div style={{ textAlign: "center", marginTop: 10, marginBottom: 10 }}>
          <div
            style={{
              display: "inline-block",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>
              🔍 Deseja buscar pelo número de série?
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxWidth: "300px",
                margin: "0 auto",
              }}
            >
              <input
                type="text"
                value={serieValor}
                onChange={(e) => setSerieValor(e.target.value)}
                placeholder="Digite o número de série"
                style={{
                  padding: "6px 10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                  width: "100%",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    buscarPorSerie();
                  }
                }}
              />
              <Button
                onClick={buscarPorSerie}
                style={{ padding: "6px 12px", width: "100%" }}
              >
                Buscar por Série
              </Button>
            </div>
            <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>
              ou cadastre um novo item:
            </p>
          </div>
        </div>
      )}
      {(erro === "Item não encontrado." ||
        erro === "Item não encontrado pelo número de série.") && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 10,
          }}
        >
          <Button onClick={handleCadastrar}>Cadastrar item</Button>
          <Button
            onClick={handleCadastrarSemEtiqueta}
            style={{ backgroundColor: "#e67e22", borderColor: "#e67e22" }}
          >
            🏷️ Cadastrar Bem Sem Etiqueta
          </Button>
        </div>
      )}

      {resultado && (
        <div style={{ marginTop: 20 }}>
          {resultado.cadastradoDuranteInventario && (
            <div
              style={{
                backgroundColor: "#007bff",
                color: "white",
                padding: "8px 12px",
                borderRadius: "5px",
                marginBottom: "10px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              📝 Este item foi CADASTRADO durante o inventário
            </div>
          )}
          {resultado.temCorrecoes && (
            <div
              style={{
                backgroundColor: "#ff9800",
                color: "white",
                padding: "8px 12px",
                borderRadius: "5px",
                marginBottom: "10px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              ⚠️ Este item possui {resultado.totalCorrecoes} correção(ões) de
              dados registrada(s)
              {resultado.ultimaCorrecao && (
                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                  Última correção:{" "}
                  {new Date(resultado.ultimaCorrecao).toLocaleString()}
                </div>
              )}
              <div style={{ marginTop: "8px" }}>
                <Button
                  onClick={() =>
                    window.open(
                      `/api/correcoes/${nome}/${resultado.numero}`,
                      "_blank"
                    )
                  }
                  style={{
                    backgroundColor: "#fff",
                    color: "#ff9800",
                    border: "1px solid #fff",
                    padding: "4px 8px",
                    borderRadius: "3px",
                    fontSize: "12px",
                  }}
                >
                  📋 Ver Histórico Completo
                </Button>
              </div>
            </div>
          )}
          <div
            style={{
              backgroundColor: "var(--light-bg)",
              border: resultado.dataInventario
                ? "2px solid var(--danger-color)"
                : "1px solid var(--border-color)",
              borderRadius: "8px",
              padding: "20px",
              marginTop: "15px",
              fontFamily: "monospace",
              fontSize: "14px",
            }}
          >
            {/* Lista limitada de informações essenciais */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <div style={{ display: "flex" }}>
                <span style={{ fontWeight: "bold", minWidth: "120px" }}>
                  Número:
                </span>
                <span style={{ marginLeft: "8px" }}>
                  {resultado.numero || "N/A"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", minWidth: "120px" }}>
                  Status:
                </span>
                <select
                  value={statusSelecionado}
                  onChange={(e) => setStatusSelecionado(e.target.value)}
                  style={{
                    marginLeft: "8px",
                    padding: "2px 4px",
                    fontSize: "14px",
                  }}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex" }}>
                <span style={{ fontWeight: "bold", minWidth: "120px" }}>
                  Descrição:
                </span>
                <span style={{ marginLeft: "8px" }}>
                  {resultado.descricao || "N/A"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", minWidth: "120px" }}>
                  Carga Atual:
                </span>
                <select
                  value={cargaAtualSelecionada}
                  onChange={(e) => setCargaAtualSelecionada(e.target.value)}
                  style={{
                    marginLeft: "8px",
                    padding: "2px 4px",
                    fontSize: "14px",
                    minWidth: "200px",
                  }}
                >
                  <option value="">Selecione um servidor</option>
                  {servidores.map((servidor) => (
                    <option key={servidor} value={servidor}>
                      {servidor}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", minWidth: "120px" }}>
                  Sala:
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginLeft: "8px",
                  }}
                >
                  <span style={{ marginRight: "8px" }}>
                    {resultado.sala || "N/A"}
                  </span>
                  {resultado.sala !== salaSelecionada && resultado.sala && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#ff6b6b",
                      }}
                    >
                      <span style={{ fontSize: "16px", marginRight: "4px" }}>
                        ⚠️
                      </span>
                      <span>Item movido ou em sala diferente</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontWeight: "bold", minWidth: "120px" }}>
                  Estado Conservação:
                </span>
                <select
                  value={estadoConservacaoSelecionado}
                  onChange={(e) =>
                    setEstadoConservacaoSelecionado(e.target.value)
                  }
                  style={{
                    marginLeft: "8px",
                    padding: "2px 4px",
                    fontSize: "14px",
                  }}
                >
                  {ESTADOS_CONSERVACAO.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {resultado.dataInventario && (
            <p style={{ color: "red", fontWeight: "bold" }}>
              Este item já foi inventariado.
            </p>
          )}
          {/* Campo de observações */}
          <div style={{ marginTop: "16px", marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "4px",
              }}
            >
              📝 Observações:
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite observações sobre o item (opcional)"
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
                minHeight: "60px",
                resize: "vertical",
              }}
            />
          </div>
          {/* Campos para confirmação - sempre mostra */}
          <br />
          <Button
            onClick={confirmarEncontrado}
            style={{ marginTop: 10, marginRight: 10 }}
          >
            Confirmar Item Encontrado
          </Button>
        </div>
      )}
    </div>
  );
}
