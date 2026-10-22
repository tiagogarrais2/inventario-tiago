"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../../../components/Button";
import { useNotifications } from "../../../components/Notifications";

const CARGOS_DISPONIVEIS = [
  "Presidente",
  "Vice-Presidente",
  "Membro",
  "Servidor(a)",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PermissoesPage({ params }) {
  const unwrappedParams = React.use(params);
  const [nome] = useState(unwrappedParams?.nome || "");
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showSuccess, showError, showConfirmation } = useNotifications();

  const [isOwner, setIsOwner] = useState(false);
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [permissoes, setPermissoes] = useState([]);
  const [cargoProprietario, setCargoProprietario] = useState("Servidor(a)");
  const [loading, setLoading] = useState(false);

  // Abas de concessão: "individual" | "lote"
  const [modoCadastro, setModoCadastro] = useState("individual");

  // Formulário Individual
  const [novoEmail, setNovoEmail] = useState("");
  const [novoCargo, setNovoCargo] = useState("Servidor(a)");

  // Formulário em Lote
  const [emailsLoteTexto, setEmailsLoteTexto] = useState("");
  const [cargoLote, setCargoLote] = useState("Servidor(a)");
  const [resultadoLote, setResultadoLote] = useState(null);

  // Mensagem de feedback
  const [message, setMessage] = useState(null); // { tipo: "sucesso" | "erro", texto: string }

  // Filtros na lista de permissões
  const [buscaEmail, setBuscaEmail] = useState("");
  const [filtroCargo, setFiltroCargo] = useState("todos");

  const carregarPermissoes = useCallback(async () => {
    if (!nome) return;
    try {
      const response = await fetch(
        `/api/permissoes?inventario=${encodeURIComponent(nome)}`
      );
      if (response.ok) {
        const data = await response.json();
        setPermissoes(data.permissoes || []);
        if (data.cargoProprietario) {
          setCargoProprietario(data.cargoProprietario);
        }
        if (data.nomeExibicao) {
          setNomeExibicao(data.nomeExibicao);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    }
  }, [nome]);

  // Verificar acesso e propriedade
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    async function verificar() {
      try {
        const res = await fetch(
          `/api/verificar-acesso?inventario=${encodeURIComponent(nome)}`
        );
        const data = await res.json();
        if (res.ok && data.isOwner) {
          setIsOwner(true);
          if (data.nomeExibicao) setNomeExibicao(data.nomeExibicao);
        } else {
          setIsOwner(false);
          if (data.nomeExibicao) setNomeExibicao(data.nomeExibicao);
        }
      } catch (err) {
        console.error("Erro ao verificar permissões:", err);
        setIsOwner(false);
      } finally {
        setCheckingAccess(false);
      }
    }

    verificar();
  }, [nome, status, router]);

  useEffect(() => {
    if (isOwner) {
      carregarPermissoes();
    }
  }, [isOwner, carregarPermissoes]);

  // Conjunto de e-mails que já possuem acesso (incluindo proprietário)
  const emailsComAcessoSet = useMemo(() => {
    const set = new Set();
    if (session?.user?.email) {
      set.add(session.user.email.toLowerCase());
    }
    permissoes.forEach((p) => {
      if (p.usuario?.email) {
        set.add(p.usuario.email.toLowerCase());
      }
    });
    return set;
  }, [permissoes, session]);

  // Análise em tempo real dos e-mails colados no modo em lote
  const analiseLote = useMemo(() => {
    if (!emailsLoteTexto.trim()) {
      return {
        todosExtraidos: [],
        novosValidos: [],
        jaPossuemAcesso: [],
        invalidos: [],
      };
    }

    // Divide por quebra de linha, vírgula, ponto e vírgula ou tabulação/espaço
    // Se alguém colar "Nome <email@dominio.com>", extrai apenas o e-mail entre < >
    const tokensBrutos = emailsLoteTexto
      .replace(/<([^>]+)>/g, " $1 ")
      .split(/[\n,;\t\s]+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const unicos = [...new Set(tokensBrutos)];
    const novosValidos = [];
    const jaPossuemAcesso = [];
    const invalidos = [];

    for (const item of unicos) {
      if (!EMAIL_REGEX.test(item)) {
        invalidos.push(item);
      } else if (emailsComAcessoSet.has(item)) {
        jaPossuemAcesso.push(item);
      } else {
        novosValidos.push(item);
      }
    }

    return {
      todosExtraidos: unicos,
      novosValidos,
      jaPossuemAcesso,
      invalidos,
    };
  }, [emailsLoteTexto, emailsComAcessoSet]);

  // Conceder permissão individual
  const adicionarPermissaoIndividual = async (e) => {
    e.preventDefault();
    if (!novoEmail.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/permissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventarioNome: nome,
          emailUsuario: novoEmail.trim(),
          cargo: novoCargo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          tipo: "sucesso",
          texto: `Permissão concedida com sucesso para ${novoEmail.trim()}!`,
        });
        setNovoEmail("");
        setNovoCargo("Servidor(a)");
        carregarPermissoes();
      } else {
        setMessage({
          tipo: "erro",
          texto: `Erro: ${data.error || "Não foi possível conceder permissão."}`,
        });
      }
    } catch {
      setMessage({
        tipo: "erro",
        texto: "Erro de conexão ao conceder permissão.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Conceder permissão em lote
  const adicionarPermissoesEmLote = async (e) => {
    e.preventDefault();
    if (analiseLote.novosValidos.length === 0) return;

    setLoading(true);
    setMessage(null);
    setResultadoLote(null);

    try {
      const response = await fetch("/api/permissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventarioNome: nome,
          emails: analiseLote.novosValidos,
          cargo: cargoLote,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResultadoLote({
          adicionados: data.adicionados || [],
          jaPossuiamAcesso: [
            ...analiseLote.jaPossuemAcesso,
            ...(data.jaPossuiamAcesso || []),
          ],
          invalidos: [
            ...analiseLote.invalidos,
            ...(data.invalidos || []),
          ],
        });
        setMessage({
          tipo: "sucesso",
          texto: data.message || "Permissões em lote processadas com sucesso!",
        });
        setEmailsLoteTexto("");
        carregarPermissoes();
      } else {
        setMessage({
          tipo: "erro",
          texto: `Erro: ${data.error || "Não foi possível processar o lote."}`,
        });
      }
    } catch {
      setMessage({
        tipo: "erro",
        texto: "Erro de conexão ao processar permissões em lote.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar cargo
  const atualizarCargo = async (email, cargo) => {
    try {
      const response = await fetch("/api/permissoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventarioNome: nome,
          emailUsuario: email,
          cargo,
        }),
      });

      if (response.ok) {
        showSuccess(`Cargo de ${email} atualizado para ${cargo}!`);
        carregarPermissoes();
      } else {
        const data = await response.json();
        showError(data.error || "Erro ao atualizar cargo");
      }
    } catch (error) {
      console.error("Erro ao atualizar cargo:", error);
      showError("Erro ao atualizar cargo");
    }
  };

  // Revogar permissão
  const removerPermissao = async (email) => {
    showConfirmation(
      `Tem certeza que deseja revogar o acesso de ${email}?`,
      async () => {
        setLoading(true);
        setMessage(null);

        try {
          const response = await fetch("/api/permissoes", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inventarioNome: nome,
              emailUsuario: email,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            showSuccess(`Acesso de ${email} revogado com sucesso!`);
            carregarPermissoes();
          } else {
            showError(data.error || "Erro ao revogar acesso");
          }
        } catch (error) {
          console.error("Erro ao revogar permissão:", error);
          showError("Erro ao revogar acesso");
        } finally {
          setLoading(false);
        }
      },
      () => {}
    );
  };

  // Filtrar e ordenar lista de permissões em ordem alfabética dos nomes
  const permissoesFiltradas = useMemo(() => {
    const termo = buscaEmail.trim().toLowerCase();
    const filtrados = permissoes.filter((p) => {
      const nome = (p.usuario?.nome || "").toLowerCase();
      const email = (p.usuario?.email || "").toLowerCase();
      const cargo = p.cargo || "Servidor(a)";
      const matchBusca = !termo || nome.includes(termo) || email.includes(termo);
      const matchCargo = filtroCargo === "todos" || cargo === filtroCargo;
      return matchBusca && matchCargo;
    });

    return filtrados.sort((a, b) => {
      const nomeA = a.usuario?.nome || a.usuario?.email || "";
      const nomeB = b.usuario?.nome || b.usuario?.email || "";
      return nomeA.localeCompare(nomeB, "pt-BR", { sensitivity: "base" });
    });
  }, [permissoes, buscaEmail, filtroCargo]);

  if (status === "loading" || checkingAccess) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        Carregando permissões...
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "40px auto",
          padding: "24px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#dc2626", marginTop: 0 }}>Acesso Negado</h2>
        <p style={{ color: "#4b5563", marginBottom: "20px" }}>
          Apenas o proprietário do inventário pode gerenciar permissões de
          acesso.
        </p>
        <Button
          onClick={() => router.push(`/inventario/${nome}`)}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ← Voltar ao Inventário
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      {/* Navegação superior */}
      <div style={{ marginBottom: "16px" }}>
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
          }}
        >
          ← Voltar ao Inventário
        </Button>
      </div>

      {/* Cabeçalho da Página */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", margin: "0 0 6px 0", color: "#111827" }}>
          🔐 Gerenciar Permissões — {nomeExibicao || nome}
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
          Gerencie a comissão de inventário e conceda acesso individualmente ou
          colando uma lista de e-mails em lote.
        </p>
      </div>

      {/* Mensagem de Feedback */}
      {message && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "8px",
            border:
              message.tipo === "sucesso"
                ? "1px solid #a7f3d0"
                : "1px solid #fecaca",
            backgroundColor:
              message.tipo === "sucesso" ? "#ecfdf5" : "#fef2f2",
            color: message.tipo === "sucesso" ? "#065f46" : "#991b1b",
            fontWeight: "500",
            fontSize: "14px",
          }}
        >
          {message.tipo === "sucesso" ? "✅ " : "❌ "}
          {message.texto}
        </div>
      )}

      {/* Card 1: Conceder Acesso */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "24px",
          marginBottom: "28px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#1f2937",
            marginTop: 0,
            marginBottom: "16px",
          }}
        >
          ➕ Conceder Acesso
        </h2>

        {/* Seletor de Modo (Abas) */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderBottom: "2px solid #e5e7eb",
            marginBottom: "20px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setModoCadastro("individual");
              setMessage(null);
            }}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom:
                modoCadastro === "individual"
                  ? "3px solid #2563eb"
                  : "3px solid transparent",
              backgroundColor:
                modoCadastro === "individual" ? "#eff6ff" : "transparent",
              color: modoCadastro === "individual" ? "#1d4ed8" : "#4b5563",
              fontWeight: modoCadastro === "individual" ? "600" : "500",
              fontSize: "14px",
              cursor: "pointer",
              borderRadius: "6px 6px 0 0",
              marginBottom: "-2px",
            }}
          >
            👤 Individual
          </button>
          <button
            type="button"
            onClick={() => {
              setModoCadastro("lote");
              setMessage(null);
            }}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom:
                modoCadastro === "lote"
                  ? "3px solid #2563eb"
                  : "3px solid transparent",
              backgroundColor:
                modoCadastro === "lote" ? "#eff6ff" : "transparent",
              color: modoCadastro === "lote" ? "#1d4ed8" : "#4b5563",
              fontWeight: modoCadastro === "lote" ? "600" : "500",
              fontSize: "14px",
              cursor: "pointer",
              borderRadius: "6px 6px 0 0",
              marginBottom: "-2px",
            }}
          >
            📋 Em Lote (Colar E-mails)
          </button>
        </div>

        {/* MODO INDIVIDUAL */}
        {modoCadastro === "individual" && (
          <form
            onSubmit={adicionarPermissaoIndividual}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                E-mail do Usuário:
              </label>
              <input
                type="email"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                placeholder="Ex: servidor@ifce.edu.br"
                disabled={loading}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Cargo na Comissão:
              </label>
              <select
                value={novoCargo}
                onChange={(e) => setNovoCargo(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "15px",
                  backgroundColor: "#fff",
                  boxSizing: "border-box",
                }}
              >
                {CARGOS_DISPONIVEIS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading || !novoEmail.trim()}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor:
                    loading || !novoEmail.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !novoEmail.trim() ? 0.6 : 1,
                }}
              >
                {loading ? "Processando..." : "✅ Conceder Acesso"}
              </Button>
            </div>
          </form>
        )}

        {/* MODO EM LOTE */}
        {modoCadastro === "lote" && (
          <form
            onSubmit={adicionarPermissoesEmLote}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Cole a lista de e-mails abaixo:
              </label>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                Você pode colar vários e-mails separados por quebra de linha,
                vírgula (,), ponto e vírgula (;) ou copiados diretamente de uma
                coluna de planilha.
              </span>
              <textarea
                value={emailsLoteTexto}
                onChange={(e) => {
                  setEmailsLoteTexto(e.target.value);
                  setResultadoLote(null);
                }}
                placeholder={
                  "joao.silva@ifce.edu.br\nmaria.souza@ifce.edu.br, pedro.santos@ifce.edu.br\nana.oliveira@ifce.edu.br; carlos.lima@ifce.edu.br"
                }
                disabled={loading}
                rows={6}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Pré-visualização em tempo real do lote */}
            {emailsLoteTexto.trim().length > 0 && (
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "13px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                    fontWeight: "600",
                  }}
                >
                  <span style={{ color: "#16a34a" }}>
                    ✅ {analiseLote.novosValidos.length} novo(s) e-mail(s)
                    válido(s)
                  </span>
                  {analiseLote.jaPossuemAcesso.length > 0 && (
                    <span style={{ color: "#d97706" }}>
                      ℹ️ {analiseLote.jaPossuemAcesso.length} já possui(em)
                      acesso (serão ignorados)
                    </span>
                  )}
                  {analiseLote.invalidos.length > 0 && (
                    <span style={{ color: "#dc2626" }}>
                      ⚠️ {analiseLote.invalidos.length} formato(s) inválido(s)
                    </span>
                  )}
                </div>

                {analiseLote.invalidos.length > 0 && (
                  <div
                    style={{
                      marginTop: "8px",
                      color: "#b91c1c",
                      fontSize: "12px",
                    }}
                  >
                    <strong>Ignorados por formato inválido:</strong>{" "}
                    {analiseLote.invalidos.join(", ")}
                  </div>
                )}
              </div>
            )}

            {/* Resumo após processamento do lote */}
            {resultadoLote && (
              <div
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  fontSize: "13px",
                  color: "#166534",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  📋 Resumo do processamento em lote:
                </div>
                <div>
                  • <strong>Adicionados agora:</strong>{" "}
                  {resultadoLote.adicionados.length}
                </div>
                {resultadoLote.jaPossuiamAcesso.length > 0 && (
                  <div>
                    • <strong>Já possuíam acesso (ignorados):</strong>{" "}
                    {resultadoLote.jaPossuiamAcesso.length}
                  </div>
                )}
                {resultadoLote.invalidos.length > 0 && (
                  <div>
                    • <strong>Formato inválido (ignorados):</strong>{" "}
                    {resultadoLote.invalidos.length}
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Cargo na Comissão para os e-mails deste lote:
              </label>
              <select
                value={cargoLote}
                onChange={(e) => setCargoLote(e.target.value)}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "15px",
                  backgroundColor: "#fff",
                  boxSizing: "border-box",
                }}
              >
                {CARGOS_DISPONIVEIS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading || analiseLote.novosValidos.length === 0}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor:
                    loading || analiseLote.novosValidos.length === 0
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    loading || analiseLote.novosValidos.length === 0 ? 0.6 : 1,
                }}
              >
                {loading
                  ? "Processando lote..."
                  : `✅ Conceder Acesso a ${analiseLote.novosValidos.length} novo(s) usuário(s)`}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Card 2: Lista de Pessoas com Acesso */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#1f2937",
              margin: 0,
            }}
          >
            👥 Pessoas com Acesso ({permissoes.length + 1})
          </h2>
        </div>

        {/* Proprietário */}
        <div
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            padding: "14px 16px",
            marginBottom: "18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontWeight: "600", color: "#1e3a8a" }}>
              ⭐ {session?.user?.email}{" "}
              <span
                style={{
                  fontSize: "12px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  marginLeft: "6px",
                }}
              >
                Proprietário
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label
              style={{
                fontSize: "13px",
                color: "#374151",
                fontWeight: "500",
              }}
            >
              Cargo:
            </label>
            <select
              value={cargoProprietario}
              onChange={(e) => {
                setCargoProprietario(e.target.value);
                atualizarCargo(session?.user?.email, e.target.value);
              }}
              style={{
                padding: "6px 10px",
                fontSize: "13px",
                borderRadius: "6px",
                border: "1px solid #93c5fd",
                backgroundColor: "#fff",
              }}
            >
              {CARGOS_DISPONIVEIS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de Busca e Filtro por Cargo */}
        {permissoes.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <input
              type="text"
              value={buscaEmail}
              onChange={(e) => setBuscaEmail(e.target.value)}
              placeholder="🔍 Filtrar por nome ou e-mail..."
              style={{
                flex: "1 1 240px",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
            <select
              value={filtroCargo}
              onChange={(e) => setFiltroCargo(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "#fff",
              }}
            >
              <option value="todos">Todos os cargos ({permissoes.length})</option>
              {CARGOS_DISPONIVEIS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lista de Usuários com Permissão */}
        {permissoes.length === 0 ? (
          <p
            style={{
              color: "#6b7280",
              fontStyle: "italic",
              textAlign: "center",
              padding: "20px 0",
              margin: 0,
            }}
          >
            Nenhum membro ou servidor adicional cadastrado neste inventário.
          </p>
        ) : permissoesFiltradas.length === 0 ? (
          <p
            style={{
              color: "#6b7280",
              fontStyle: "italic",
              textAlign: "center",
              padding: "20px 0",
              margin: 0,
            }}
          >
            Nenhum usuário encontrado com o filtro aplicado.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {permissoesFiltradas.map((permissao) => (
              <div
                key={permissao.id || permissao.usuario.email}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  backgroundColor: "#f9fafb",
                }}
              >
                <div style={{ flex: "1 1 250px" }}>
                  {permissao.usuario?.nome &&
                  permissao.usuario.nome !== permissao.usuario.email ? (
                    <>
                      <div
                        style={{
                          fontWeight: "600",
                          color: "#111827",
                          fontSize: "14px",
                        }}
                      >
                        👤 {permissao.usuario.nome}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#4b5563",
                          marginTop: "2px",
                        }}
                      >
                        📧 {permissao.usuario.email}
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        fontWeight: "600",
                        color: "#111827",
                        fontSize: "14px",
                      }}
                    >
                      📧 {permissao.usuario.email}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "4px",
                    }}
                  >
                    Concedido em:{" "}
                    {new Date(permissao.createdAt).toLocaleString("pt-BR")}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <label style={{ fontSize: "12px", color: "#4b5563" }}>
                      Cargo:
                    </label>
                    <select
                      value={permissao.cargo || "Servidor(a)"}
                      onChange={(e) =>
                        atualizarCargo(permissao.usuario.email, e.target.value)
                      }
                      style={{
                        padding: "5px 10px",
                        fontSize: "13px",
                        borderRadius: "6px",
                        border: "1px solid #d1d5db",
                        backgroundColor: "#fff",
                      }}
                    >
                      {CARGOS_DISPONIVEIS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    onClick={() => removerPermissao(permissao.usuario.email)}
                    disabled={loading}
                    style={{
                      backgroundColor: "#dc2626",
                      color: "white",
                      padding: "6px 12px",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    Revogar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
