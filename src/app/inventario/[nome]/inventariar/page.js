"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "../../../components/Button";

export default function InventariarPage({ params }) {
  const [nome, setNome] = useState("");
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
  const [ultimoTombo, setUltimoTombo] = useState("");
  const [notificacao, setNotificacao] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    if (params?.nome) {
      setNome(params.nome);
    }
  }, [params]);

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
        const res = await fetch(
          `/api/salas?inventario=${encodeURIComponent(nome)}`
        );
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || `Erro ${res.status}: ${res.statusText}`
          );
        }
        const data = await res.json();
        setSalas(data);
        const salaSalva = localStorage.getItem("salaSelecionada");
        if (salaSalva && data.includes(salaSalva)) {
          setSalaSelecionada(salaSalva);
        } else if (data.length > 0) {
          setSalaSelecionada(data[0]);
        }
      } catch (error) {
        console.error("Erro ao carregar salas:", error);
        setErro(`Erro ao carregar salas: ${error.message}`);
        setSalas([]);
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
          return;
        }
        throw new Error(errorData.error || "Erro ao buscar item.");
      }

      const item = await res.json();
      setResultado(item);
    } catch (error) {
      setErro("Erro ao buscar o item.");
      console.error("Erro na busca:", error);
    }
  }

  async function confirmarEncontrado() {
    if (!resultado || !inventariante) return;

    const salaOriginal = resultado.sala || "";
    const confirmarSala =
      salaSelecionada !== salaOriginal
        ? window.confirm(
            `A sala selecionada (${salaSelecionada}) difere da sala original (${salaOriginal}). Confirmar?`
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
          dataInventario,
          status: statusSelecionado,
          inventariante,
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

  function handleDadosIncorretos() {
    if (!resultado) return;

    const params = new URLSearchParams({
      nome: nome,
      isCorrecao: "true",
      numeroOriginal: resultado.numero,
      numero: resultado.numero,
      sala: salaSelecionada,
      status: resultado.status || "",
      ed: resultado.ed || "",
      contaContabil: resultado.contaContabil || "",
      descricao: resultado.descricao || "",
      rotulos: resultado.rotulos || "",
      cargaAtual: resultado.cargaAtual || "",
      setorResponsavel: resultado.setorResponsavel || "",
      campusCarga: resultado.campusCarga || "",
      cargaContabil: resultado.cargaContabil || "",
      valorAquisicao: resultado.valorAquisicao || "",
      valorDepreciado: resultado.valorDepreciado || "",
      numeroNotaFiscal: resultado.numeroNotaFiscal || "",
      numeroSerie: resultado.numeroSerie || "",
      dataEntrada: resultado.dataEntrada || "",
      dataCarga: resultado.dataCarga || "",
      fornecedor: resultado.fornecedor || "",
      marca: resultado.marca || "",
      modelo: resultado.modelo || "",
      setor: resultado.setor || "",
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

      {/* Campo de seleção de sala */}
      <select value={salaSelecionada} onChange={handleSalaChange}>
        {salas.map((sala) => (
          <option key={sala} value={sala}>
            {sala}
          </option>
        ))}
      </select>
      <br />

      <input
        type="number"
        value={valor}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Digite o número do tombo"
        ref={inputRef}
      />
      <Button onClick={handleConfirmar}>Confirmar</Button>

      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {erro === "Item não encontrado." && (
        <Button onClick={handleCadastrar} style={{ marginTop: 10 }}>
          Cadastrar item
        </Button>
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
            {/* Lista simples de campo: valor */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              {Object.entries(resultado).map(([campo, valor]) => {
                // Função para formatar valores corretamente
                const formatarValor = (val) => {
                  if (val === null || val === undefined) return "";
                  if (typeof val === "object") {
                    // Se for um objeto, tenta extrair informações úteis
                    if (val.name) return val.name; // Para objetos com propriedade name
                    if (val.email) return val.email; // Para objetos com propriedade email
                    if (
                      val.toString &&
                      val.toString !== Object.prototype.toString
                    ) {
                      return val.toString(); // Se tiver um toString customizado
                    }
                    // Para outros objetos, mostra as propriedades principais
                    const keys = Object.keys(val);
                    if (keys.length > 0) {
                      return keys
                        .map((key) => `${key}: ${val[key]}`)
                        .join(", ");
                    }
                    return "[objeto]";
                  }
                  return String(val);
                };

                return (
                  <div key={campo} style={{ display: "flex" }}>
                    <span style={{ fontWeight: "bold", minWidth: "150px" }}>
                      {campo}:
                    </span>
                    <span style={{ marginLeft: "8px" }}>
                      {formatarValor(valor)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {resultado.dataInventario && (
            <p style={{ color: "red", fontWeight: "bold" }}>
              Este item já foi inventariado.
            </p>
          )}
          {/* Campos para confirmação - sempre mostra */}
          <select
            value={statusSelecionado}
            onChange={(e) => setStatusSelecionado(e.target.value)}
            style={{ marginTop: 10 }}
          >
            <option value="Em Uso">Em Uso</option>
            <option value="Ocioso">Ocioso</option>
            <option value="Em Manutenção">Em Manutenção</option>
          </select>
          <br />
          <Button
            onClick={confirmarEncontrado}
            style={{ marginTop: 10, marginRight: 10 }}
          >
            Confirmar Item Encontrado
          </Button>
          <Button
            onClick={handleDadosIncorretos}
            style={{
              marginTop: 10,
              backgroundColor: "#ffc107",
              color: "#000",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
            }}
            title="Clique se os dados exibidos estão incorretos"
          >
            📝 Dados Incorretos
          </Button>
        </div>
      )}
    </div>
  );
}
