"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import GerenciadorPermissoes from "../../components/GerenciadorPermissoes";
import Button from "../../components/Button";

export default function InventarioPage({ params }) {
  const [nome, setNome] = useState("");

  useEffect(() => {
    if (params?.nome) {
      setNome(params.nome);
    }
  }, [params]);
  const { data: session, status } = useSession();
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
  const [isOwner, setIsOwner] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [showPermissoes, setShowPermissoes] = useState(false);
  const [excluindoInventario, setExcluindoInventario] = useState(false);
  const router = useRouter();
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
        // Verificar se tem permissão para acessar este inventário
        const response = await fetch(
          `/api/verificar-acesso?inventario=${nome}`
        );
        const data = await response.json();

        if (response.ok) {
          setHasAccess(data.hasAccess);
          setIsOwner(data.isOwner);
        } else {
          setHasAccess(false);
          setIsOwner(false);
        }
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        setHasAccess(false);
        setIsOwner(false);
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
      localStorage.removeItem("notificacao"); // Remove após carregar
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

  // Função removida - inventariante não é mais editável

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
        setUltimoTombo(valor); // Define o último tombo inventariado
        setResultado(null); // Limpa o resultado após confirmação
        setValor("");
        // Mantém o foco no input do tombo
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        alert("Erro ao confirmar."); // Mantém alert para erro, ou substitua se quiser
      }
    } catch (error) {
      alert("Erro ao confirmar."); // Mantém alert para erro
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
    });
    router.push(`/cadastrar?${params.toString()}`);
  }

  function handleDadosIncorretos() {
    if (!resultado) return;

    // Criar parâmetros com todos os dados do item original para pré-preenchimento
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
    });

    router.push(`/cadastrar?${params.toString()}`);
  }

  async function handleExcluirInventario() {
    if (!isOwner) {
      alert("Apenas o proprietário pode excluir o inventário.");
      return;
    }

    const confirmacao = window.confirm(
      `⚠️ ATENÇÃO: Esta ação é irreversível!\n\n` +
        `Você está prestes a excluir PERMANENTEMENTE o inventário "${nome}" e todos os seus dados:\n\n` +
        `• Todos os itens inventariados\n` +
        `• Todas as correções de dados\n` +
        `• Todas as permissões de acesso\n` +
        `• Todo o histórico relacionado\n\n` +
        `Digite "EXCLUIR" no próximo prompt para confirmar.`
    );

    if (!confirmacao) return;

    const confirmacaoTexto = window.prompt(
      `Para confirmar a exclusão PERMANENTE do inventário "${nome}", digite exatamente: EXCLUIR`
    );

    if (confirmacaoTexto !== "EXCLUIR") {
      alert("Exclusão cancelada. Texto de confirmação incorreto.");
      return;
    }

    setExcluindoInventario(true);

    try {
      const response = await fetch(
        `/api/excluir-inventario?inventario=${encodeURIComponent(nome)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        alert(`✅ Inventário "${nome}" excluído com sucesso!`);
        router.push("/"); // Redireciona para a página inicial
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao excluir inventário");
      }
    } catch (error) {
      console.error("Erro ao excluir inventário:", error);
      alert(`❌ Erro ao excluir inventário: ${error.message}`);
    } finally {
      setExcluindoInventario(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nome = searchParams.get("nome");

    try {
      const res = await fetch("/api/add-inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, ...formData }),
      });

      if (res.ok) {
        localStorage.setItem(
          "notificacao",
          `O tombo ${formData["NUMERO"]} foi cadastrado!`
        ); // Salva notificação com o número
        router.push(`/inventario/${nome}`); // Redireciona de volta
      } else {
        alert("Erro ao cadastrar.");
      }
    } catch (error) {
      alert("Erro ao cadastrar.");
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
          Você precisa estar autenticado para acessar inventários.
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
      {/* Gerenciador de Permissões Modal */}
      {showPermissoes && (
        <GerenciadorPermissoes
          inventarioNome={nome}
          isOwner={isOwner}
          onClose={() => setShowPermissoes(false)}
        />
      )}

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

      <div>
        <h2>{nome}</h2>
        <div>
          {isOwner && (
            <>
              <Button
                onClick={() => setShowPermissoes(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-200"
              >
                Gerenciar Acesso
              </Button>
              <Button
                onClick={handleExcluirInventario}
                disabled={excluindoInventario}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200"
                style={{
                  opacity: excluindoInventario ? 0.7 : 1,
                }}
              >
                {excluindoInventario ? "Excluindo..." : "🗑️ Excluir Inventário"}
              </Button>
            </>
          )}
        </div>
      </div>
      <Button onClick={() => router.push(`/relatorios/${nome}`)}>
        📈 Relatórios
      </Button>
      <Button onClick={() => router.push(`/inventario/${nome}/inventariar`)}>
        📝 Realizar Inventário
      </Button>
    </div>
  );
}
