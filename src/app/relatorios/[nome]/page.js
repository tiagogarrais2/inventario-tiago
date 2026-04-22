"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../../components/Button";

export default function RelatoriosPage({ params }) {
  const [nome, setNome] = useState("");

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
  const [exportandoJson, setExportandoJson] = useState(false);
  const [modalExportacaoAberto, setModalExportacaoAberto] = useState(false);

  const normalizarNomeArquivo = (valor) => {
    if (!valor) return "inventario";

    const base = valor
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    return base || "inventario";
  };

  async function handleExportarInventarioJson() {
    if (!nome || exportandoJson) return;

    setExportandoJson(true);

    try {
      const res = await fetch(
        `/api/inventario?inventario=${encodeURIComponent(nome)}&origem=relatorios&formato=json-completo`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        let mensagemErro = "Nao foi possivel exportar o inventario em JSON.";

        try {
          const erroJson = await res.json();
          if (erroJson?.error) {
            mensagemErro = erroJson.error;
          }
        } catch {
          // Mantem mensagem padrao se o retorno nao for JSON
        }

        throw new Error(mensagemErro);
      }

      const itens = await res.json();
      const listaItens = Array.isArray(itens) ? itens : [];

      const payloadExportacao = {
        inventario: nome,
        exportadoEm: new Date().toISOString(),
        totalItens: listaItens.length,
        itens: listaItens,
      };

      const blob = new Blob([JSON.stringify(payloadExportacao, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `inventario-${normalizarNomeArquivo(nome)}-completo.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message || "Erro ao exportar inventario em JSON.");
    } finally {
      setExportandoJson(false);
    }
  }

  function abrirModalExportacao() {
    if (exportandoJson) return;
    setModalExportacaoAberto(true);
  }

  function cancelarExportacao() {
    if (exportandoJson) return;
    setModalExportacaoAberto(false);
  }

  async function confirmarExportacao() {
    await handleExportarInventarioJson();
    setModalExportacaoAberto(false);
  }

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

  // Loading de autenticação
  if (status === "loading" || accessLoading) {
    return (
      <div>
        <div>Verificando permissões...</div>
      </div>
    );
  }

  // Usuário não autenticado
  if (status === "unauthenticated") {
    return (
      <div>
        <h1>Acesso Restrito</h1>
        <p>Você precisa estar autenticado para acessar relatórios.</p>
      </div>
    );
  }

  // Usuário não tem acesso ao inventário
  if (!hasAccess) {
    return (
      <div>
        <h1>Acesso Negado</h1>
        <p>
          Você não tem permissão para acessar os relatórios deste inventário.
        </p>
        <p>
          Entre em contato com o proprietário do inventário para solicitar
          acesso.
        </p>
        <Button onClick={() => router.push("/")}>Voltar ao Início</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div>
        <h2>
          Relatórios:{" "}
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
            title="Clique para voltar ao inventário"
          >
            {nome}
          </a>
        </h2>
      </div>

      {/* Lista de Relatórios Disponíveis */}
      <div>
        {/* Dashboard */}
        <Button onClick={() => router.push(`/inventario/${nome}/dashboard`)}>
          📊 Painel de Controle
        </Button>
        {/* Relatório Geral */}
        <Button onClick={() => router.push(`/relatorio/${nome}`)}>
          🏢 Itens organizados por sala
        </Button>
        {/* Relatório por Carga Atual */}
        <Button onClick={() => router.push(`/relatorio-por-servidor/${nome}`)}>
          👥 Itens organizados por servidor
        </Button>
        {/* Relatório de Itens Movidos */}
        <Button
          onClick={() => router.push(`/relatorios/${nome}/itens-movidos`)}
        >
          🚚 Itens Movidos
        </Button>
        {/* Relatório por Valor Financeiro */}
        <Button
          onClick={() => router.push(`/relatorios/${nome}/itens-por-valor`)}
        >
          💰 Itens ordenados por valor
        </Button>
        {/* Busca por nome */}
        <Button
          onClick={() => router.push(`/relatorios/${nome}/busca-por-nome`)}
        >
          🔍 Buscar itens por nome
        </Button>
        {/* Relatório Final */}
        <Button onClick={() => router.push(`/relatorio-final/${nome}`)}>
          📄 Relatório Final
        </Button>
        <Button
          onClick={abrirModalExportacao}
          disabled={exportandoJson}
          style={{ backgroundColor: "#059669", color: "#fff" }}
        >
          {exportandoJson
            ? "⏳ Exportando inventário JSON..."
            : "⬇️ Exportar inventário completo (JSON)"}
        </Button>
        <hr />
      </div>

      {modalExportacaoAberto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "540px",
              backgroundColor: "#fff",
              borderRadius: "10px",
              boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2)",
              padding: "1.2rem 1.25rem",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
              Confirmar exportação auditável
            </h3>
            <p style={{ margin: "0 0 0.6rem 0" }}>
              Este download do inventário completo em JSON será registrado nos
              logs de auditoria.
            </p>
            <p style={{ margin: "0 0 0.9rem 0" }}>
              O registro incluirá usuário, inventário, data e hora da
              exportação.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.6rem",
              }}
            >
              <button
                type="button"
                onClick={cancelarExportacao}
                disabled={exportandoJson}
                style={{
                  border: "1px solid #d1d5db",
                  backgroundColor: "#fff",
                  color: "#111827",
                  borderRadius: "6px",
                  padding: "0.55rem 0.9rem",
                  cursor: exportandoJson ? "not-allowed" : "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarExportacao}
                disabled={exportandoJson}
                style={{
                  border: "none",
                  backgroundColor: "#059669",
                  color: "#fff",
                  borderRadius: "6px",
                  padding: "0.55rem 0.9rem",
                  cursor: exportandoJson ? "not-allowed" : "pointer",
                }}
              >
                {exportandoJson ? "Exportando..." : "Confirmar e exportar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
