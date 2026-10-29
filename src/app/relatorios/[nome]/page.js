"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../../components/Button";
import { useFocusTrap } from "../../lib/useFocusTrap";

export default function RelatoriosPage({ params }) {
  const [nome, setNome] = useState("");
  const [nomeExibicao, setNomeExibicao] = useState("");

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
  const { modalRef: modalExportacaoRef } = useFocusTrap({
    isOpen: modalExportacaoAberto,
    onClose: cancelarExportacao,
  });

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
          if (data.nomeExibicao) {
            setNomeExibicao(data.nomeExibicao);
          }
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
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Navegação Superior */}
      <div style={{ marginBottom: "20px" }}>
        <Button
          onClick={() => router.push(`/inventario/${nome}`)}
          style={{
            backgroundColor: "#6c757d",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            width: "auto",
            display: "inline-block",
            marginBottom: "16px",
          }}
        >
          ← Voltar ao Inventário
        </Button>
        <h2 style={{ textAlign: "left", margin: "0 0 6px 0" }}>
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
            {nomeExibicao || nome}
          </a>
        </h2>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>
          Consulte indicadores, relatórios operacionais e documentos consolidados deste inventário.
        </p>
      </div>

      {/* Categoria 1: Visão Geral e Indicadores */}
      <section
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h3
          style={{
            textAlign: "left",
            fontSize: "1.2rem",
            color: "#1f2937",
            marginTop: 0,
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          📊 Visão Geral e Indicadores
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "16px",
            textAlign: "left",
          }}
        >
          Acompanhamento visual do andamento e estatísticas gerais de conferência.
        </p>

        <div>
          <Button onClick={() => router.push(`/inventario/${nome}/dashboard`)}>
            📊 Painel de Controle (Dashboard)
          </Button>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              margin: "-4px 0 8px 4px",
              textAlign: "left",
            }}
          >
            Indicadores de progresso, gráficos de conferência, estatísticas de bens e status geral.
          </p>
        </div>
      </section>

      {/* Categoria 2: Relatórios Operacionais e de Localização */}
      <section
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h3
          style={{
            textAlign: "left",
            fontSize: "1.2rem",
            color: "#1f2937",
            marginTop: 0,
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          📋 Relatórios Operacionais e de Localização
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "16px",
            textAlign: "left",
          }}
        >
          Consultas detalhadas por sala, servidor responsável e movimentações físicas.
        </p>

        <div>
          <Button onClick={() => router.push(`/relatorio/${nome}`)}>
            🏢 Itens por Sala
          </Button>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              margin: "-4px 0 16px 4px",
              textAlign: "left",
            }}
          >
            Listagem completa de bens agrupados por ambiente físico e sala.
          </p>
        </div>

        <div>
          <Button onClick={() => router.push(`/relatorio-por-servidor/${nome}`)}>
            👥 Itens por Servidor
          </Button>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              margin: "-4px 0 16px 4px",
              textAlign: "left",
            }}
          >
            Bens organizados por servidor responsável, justificativas e histórico de conferências.
          </p>
        </div>

        <div>
          <Button
            onClick={() => router.push(`/relatorios/${nome}/itens-movidos`)}
          >
            🚚 Itens Movidos
          </Button>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              margin: "-4px 0 16px 4px",
              textAlign: "left",
            }}
          >
            Bens encontrados em salas diferentes da sua localização cadastrada originalmente.
          </p>
        </div>

        <div>
          <Button
            onClick={() => router.push(`/relatorios/${nome}/busca-por-nome`)}
          >
            🔍 Buscar Itens por Nome
          </Button>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              margin: "-4px 0 8px 4px",
              textAlign: "left",
            }}
          >
            Pesquisa rápida e filtragem de itens pela descrição ou denominação.
          </p>
        </div>
      </section>

      {/* Categoria 3: Relatórios Financeiros e Conclusão */}
      <section
        style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h3
          style={{
            textAlign: "left",
            fontSize: "1.2rem",
            color: "#1f2937",
            marginTop: 0,
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          💰 Relatórios Financeiros e Conclusão
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            marginBottom: "16px",
            textAlign: "left",
          }}
        >
          Valores contábeis, documento consolidado oficial e exportação completa dos dados.
        </p>

        <div>
          <Button
            onClick={() => router.push(`/relatorios/${nome}/itens-por-valor`)}
          >
            💰 Itens Ordenados por Valor
          </Button>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              margin: "-4px 0 16px 4px",
              textAlign: "left",
            }}
          >
            Classificação patrimonial dos bens por valor contábil em ordem decrescente.
          </p>
        </div>

        <div>
          <Button onClick={() => router.push(`/relatorio-final/${nome}`)}>
            📄 Relatório Final Consolidado
          </Button>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              margin: "-4px 0 16px 4px",
              textAlign: "left",
            }}
          >
            Documento consolidado de encerramento do inventário com resumo estatístico e comissão.
          </p>
        </div>

        <div>
          <Button
            onClick={abrirModalExportacao}
            disabled={exportandoJson}
            style={{ backgroundColor: "#059669", color: "#fff" }}
          >
            {exportandoJson
              ? "⏳ Exportando inventário JSON..."
              : "⬇️ Exportar Inventário Completo (JSON)"}
          </Button>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              margin: "-4px 0 8px 4px",
              textAlign: "left",
            }}
          >
            Exportação de todos os itens e metadados em formato JSON, registrada em log de auditoria.
          </p>
        </div>
      </section>

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
            ref={modalExportacaoRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-exportacao-titulo"
            tabIndex={-1}
            style={{
              width: "100%",
              maxWidth: "540px",
              backgroundColor: "#fff",
              borderRadius: "10px",
              boxShadow: "0 12px 30px rgba(0, 0, 0, 0.2)",
              padding: "1.2rem 1.25rem",
            }}
          >
            <h3
              id="modal-exportacao-titulo"
              style={{ marginTop: 0, marginBottom: "0.75rem" }}
            >
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
