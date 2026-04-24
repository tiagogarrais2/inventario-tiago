"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../../../components/Button";

export default function EmailsPage({ params }) {
  const unwrappedParams = React.use(params);
  const [nome, setNome] = useState(unwrappedParams?.nome || "");
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [servidores, setServidores] = useState([]);
  const [itensPorServidor, setItensPorServidor] = useState({});
  const [emailsEditados, setEmailsEditados] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [historicoAberto, setHistoricoAberto] = useState(false);

  // Filtro
  const [filtroMin, setFiltroMin] = useState(0);
  const [filtroMax, setFiltroMax] = useState(100);

  // Composição
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Teste de configuração
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState(null);

  // Templates / Textos salvos
  const [templates, setTemplates] = useState([]);
  const [templateSelecionado, setTemplateSelecionado] = useState("");
  const [editandoTemplate, setEditandoTemplate] = useState(null);
  const [novoTemplate, setNovoTemplate] = useState({
    titulo: "",
    assunto: "",
    mensagem: "",
    tipo: "template",
  });
  const [criandoTemplate, setCriandoTemplate] = useState(false);
  const [salvandoTemplate, setSalvandoTemplate] = useState(false);
  const [mostrarSalvarTemplate, setMostrarSalvarTemplate] = useState(false);
  const [tituloSalvarTemplate, setTituloSalvarTemplate] = useState("");

  // Modo de envio
  const [modoEnvio, setModoEnvio] = useState("filtro"); // "filtro" | "manual"
  const [emailsManuais, setEmailsManuais] = useState("");

  // Abas
  const [abaAtiva, setAbaAtiva] = useState("compor"); // "compor", "emails", "historico", "textos"

  // Verificar se é proprietário
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
        if (data.isOwner) {
          setIsOwner(true);
        } else {
          router.push(`/inventario/${nome}`);
          return;
        }
      } catch {
        router.push(`/inventario/${nome}`);
        return;
      }
      setLoading(false);
    }
    verificar();
  }, [nome, status, router]);

  // Carregar dados
  const carregarDados = useCallback(async () => {
    if (!isOwner) return;
    try {
      const [srvRes, itensRes] = await Promise.all([
        fetch(`/api/servidores/email?inventario=${encodeURIComponent(nome)}`),
        fetch(`/api/inventario?inventario=${encodeURIComponent(nome)}`),
      ]);

      if (srvRes.ok) {
        const srvData = await srvRes.json();
        setServidores(srvData);
        const emailsMap = {};
        srvData.forEach((s) => {
          emailsMap[s.nome] = s.email || "";
        });
        setEmailsEditados(emailsMap);
      }

      if (itensRes.ok) {
        const itens = await itensRes.json();
        const agrupado = {};
        for (const item of itens) {
          const srv = item.cargaAtual || "Servidor não definido";
          if (!agrupado[srv]) agrupado[srv] = { total: 0, pendentes: 0 };
          agrupado[srv].total++;
          if (!item.dataInventario) agrupado[srv].pendentes++;
        }
        setItensPorServidor(agrupado);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, [nome, isOwner]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Carregar histórico
  const carregarHistorico = useCallback(async () => {
    if (!isOwner) return;
    try {
      const res = await fetch(
        `/api/emails/historico?inventario=${encodeURIComponent(nome)}`
      );
      if (res.ok) {
        setHistorico(await res.json());
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  }, [nome, isOwner]);

  useEffect(() => {
    if (abaAtiva === "historico") carregarHistorico();
  }, [abaAtiva, carregarHistorico]);

  // Carregar templates
  const carregarTemplates = useCallback(async () => {
    if (!isOwner) return;
    try {
      const res = await fetch(
        `/api/emails/templates?inventario=${encodeURIComponent(nome)}`
      );
      if (res.ok) {
        setTemplates(await res.json());
      }
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
    }
  }, [nome, isOwner]);

  useEffect(() => {
    if (abaAtiva === "textos" || abaAtiva === "compor") carregarTemplates();
  }, [abaAtiva, carregarTemplates]);

  // Criar template
  const criarTemplate = async (dados) => {
    setSalvandoTemplate(true);
    try {
      const res = await fetch("/api/emails/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventario: nome, ...dados }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Texto salvo com sucesso!");
        setNovoTemplate({
          titulo: "",
          assunto: "",
          mensagem: "",
          tipo: "template",
        });
        setCriandoTemplate(false);
        carregarTemplates();
        return true;
      } else {
        alert(data.error || "Erro ao salvar texto.");
        return false;
      }
    } catch {
      alert("Erro ao salvar texto.");
      return false;
    } finally {
      setSalvandoTemplate(false);
    }
  };

  // Atualizar template
  const atualizarTemplate = async (id, dados) => {
    setSalvandoTemplate(true);
    try {
      const res = await fetch(`/api/emails/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Texto atualizado com sucesso!");
        setEditandoTemplate(null);
        carregarTemplates();
      } else {
        alert(data.error || "Erro ao atualizar texto.");
      }
    } catch {
      alert("Erro ao atualizar texto.");
    }
    setSalvandoTemplate(false);
  };

  // Excluir template
  const excluirTemplate = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este texto salvo?")) return;
    try {
      const res = await fetch(`/api/emails/templates/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        carregarTemplates();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir texto.");
      }
    } catch {
      alert("Erro ao excluir texto.");
    }
  };

  // Carregar template na composição
  const carregarTextoNaComposicao = (template) => {
    setAssunto(template.assunto);
    setMensagem(template.mensagem);
    setTemplateSelecionado(template.id);
    setAbaAtiva("compor");
  };

  // Salvar emails
  const salvarEmails = async () => {
    setSalvando(true);
    try {
      const res = await fetch("/api/servidores/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventario: nome, emails: emailsEditados }),
      });
      if (res.ok) {
        alert("Emails salvos com sucesso!");
        carregarDados();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar emails.");
      }
    } catch {
      alert("Erro ao salvar emails.");
    }
    setSalvando(false);
  };

  // Testar configuração de email
  const testarEmail = async () => {
    setTestando(true);
    setResultadoTeste(null);
    try {
      const res = await fetch("/api/emails/testar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventario: nome }),
      });
      const data = await res.json();
      if (res.ok) {
        setResultadoTeste({
          tipo: "sucesso",
          mensagem: `Email de teste enviado com sucesso para ${data.email}. Verifique sua caixa de entrada.`,
        });
      } else {
        setResultadoTeste({
          tipo: "erro",
          mensagem: data.error || "Erro ao testar configuração de email.",
        });
      }
    } catch {
      setResultadoTeste({
        tipo: "erro",
        mensagem: "Erro de conexão. Não foi possível testar o envio de email.",
      });
    }
    setTestando(false);
  };

  // Calcular servidores filtrados
  const servidoresFiltrados = servidores
    .filter((s) => {
      const stats = itensPorServidor[s.nome];
      if (!stats) return false;
      const pct = stats.total > 0 ? (stats.pendentes / stats.total) * 100 : 0;
      return pct >= filtroMin && pct <= filtroMax;
    })
    .map((s) => {
      const stats = itensPorServidor[s.nome] || { total: 0, pendentes: 0 };
      const pct =
        stats.total > 0 ? Math.round((stats.pendentes / stats.total) * 100) : 0;
      return { ...s, ...stats, pct, email: emailsEditados[s.nome] || s.email };
    })
    .sort((a, b) => b.pct - a.pct);

  const comEmail = servidoresFiltrados.filter((s) => s.email);
  const semEmail = servidoresFiltrados.filter((s) => !s.email);

  // Enviar emails
  const enviarEmails = async () => {
    if (!assunto.trim() || !mensagem.trim()) {
      alert("Preencha o assunto e a mensagem.");
      return;
    }

    if (modoEnvio === "manual") {
      const listaEmails = emailsManuais
        .split(/[\n,;]+/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      if (listaEmails.length === 0) {
        alert("Informe ao menos um endereço de email.");
        return;
      }

      const emailInvalido = listaEmails.find(
        (e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
      );
      if (emailInvalido) {
        alert(`Email inválido: ${emailInvalido}`);
        return;
      }

      const confirmar = confirm(
        `Enviar email em CCO para ${listaEmails.length} endereço(s)?\n\nAssunto: ${assunto}\n\nDestinatários:\n${listaEmails.join("\n")}`
      );
      if (!confirmar) return;

      setEnviando(true);
      try {
        const res = await fetch("/api/emails/enviar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inventario: nome,
            assunto,
            mensagem,
            emailsManuais: listaEmails,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          alert(
            `Emails enviados com sucesso para ${data.totalEnviados} endereço(s)!`
          );
          setMostrarSalvarTemplate(true);
          carregarHistorico();
        } else {
          alert(data.error || "Erro ao enviar emails.");
        }
      } catch {
        alert("Erro ao enviar emails.");
      }
      setEnviando(false);
      return;
    }

    if (comEmail.length === 0) {
      alert("Nenhum servidor com email cadastrado na faixa selecionada.");
      return;
    }

    const confirmar = confirm(
      `Enviar email para ${comEmail.length} servidor(es) em CCO?\n\nAssunto: ${assunto}\nFaixa: ${filtroMin}% a ${filtroMax}% de pendência`
    );
    if (!confirmar) return;

    setEnviando(true);
    try {
      const res = await fetch("/api/emails/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventario: nome,
          assunto,
          mensagem,
          filtroMin,
          filtroMax,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(
          `Emails enviados com sucesso para ${data.totalEnviados} servidor(es)!`
        );
        setMostrarSalvarTemplate(true);
        carregarHistorico();
      } else {
        alert(data.error || "Erro ao enviar emails.");
      }
    } catch {
      alert("Erro ao enviar emails.");
    }
    setEnviando(false);
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Verificando permissões...
      </div>
    );
  }

  if (!isOwner) return null;

  const abaStyle = (aba) => ({
    padding: "10px 20px",
    cursor: "pointer",
    border: "1px solid #ddd",
    borderBottom: abaAtiva === aba ? "none" : "1px solid #ddd",
    backgroundColor: abaAtiva === aba ? "white" : "#f8f9fa",
    fontWeight: abaAtiva === aba ? "bold" : "normal",
    borderRadius: "5px 5px 0 0",
    marginRight: "5px",
  });

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2>📧 Disparador de Emails</h2>
      <h3>
        <a
          href={`/inventario/${nome}`}
          style={{ color: "#007bff", textDecoration: "none" }}
        >
          {nome}
        </a>
      </h3>

      {/* Abas */}
      <div style={{ display: "flex", marginBottom: "-1px", marginTop: "20px" }}>
        <div style={abaStyle("compor")} onClick={() => setAbaAtiva("compor")}>
          ✉️ Compor Email
        </div>
        <div style={abaStyle("textos")} onClick={() => setAbaAtiva("textos")}>
          📝 Textos Salvos ({templates.length})
        </div>
        <div style={abaStyle("emails")} onClick={() => setAbaAtiva("emails")}>
          👥 Gerenciar Emails ({servidores.filter((s) => s.email).length}/
          {servidores.length})
        </div>
        <div
          style={abaStyle("historico")}
          onClick={() => setAbaAtiva("historico")}
        >
          📋 Histórico ({historico.length})
        </div>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          borderRadius: "0 5px 5px 5px",
          backgroundColor: "white",
        }}
      >
        {/* Aba: Compor Email */}
        {abaAtiva === "compor" && (
          <div>
            {/* Testar Configuração */}
            <div
              style={{
                padding: "15px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                backgroundColor: "#f8f9fa",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                  🔧 Configuração SMTP
                </span>
                <Button
                  onClick={testarEmail}
                  disabled={testando}
                  disableTime={3000}
                  style={{
                    backgroundColor: "#17a2b8",
                    color: "white",
                    padding: "6px 14px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  {testando
                    ? "⏳ Testando..."
                    : "📨 Testar Configuração de Email"}
                </Button>
              </div>
              {resultadoTeste && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    backgroundColor:
                      resultadoTeste.tipo === "sucesso" ? "#d4edda" : "#f8d7da",
                    color:
                      resultadoTeste.tipo === "sucesso" ? "#155724" : "#721c24",
                    border: `1px solid ${resultadoTeste.tipo === "sucesso" ? "#c3e6cb" : "#f5c6cb"}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flex: 1,
                  }}
                >
                  <span>
                    {resultadoTeste.tipo === "sucesso" ? "✅" : "❌"}{" "}
                    {resultadoTeste.mensagem}
                  </span>
                  <button
                    onClick={() => setResultadoTeste(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "inherit",
                      marginLeft: "auto",
                      padding: "0 4px",
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Toggle modo de envio */}
            <div
              style={{
                padding: "12px 15px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                backgroundColor: "#f8f9fa",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                🎯 Modo de envio:
              </span>
              <button
                onClick={() => setModoEnvio("filtro")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "4px",
                  border: "1px solid #007bff",
                  cursor: "pointer",
                  fontWeight: modoEnvio === "filtro" ? "bold" : "normal",
                  backgroundColor: modoEnvio === "filtro" ? "#007bff" : "white",
                  color: modoEnvio === "filtro" ? "white" : "#007bff",
                  fontSize: "13px",
                }}
              >
                📊 Por filtro de pendência
              </button>
              <button
                onClick={() => setModoEnvio("manual")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "4px",
                  border: "1px solid #6f42c1",
                  cursor: "pointer",
                  fontWeight: modoEnvio === "manual" ? "bold" : "normal",
                  backgroundColor: modoEnvio === "manual" ? "#6f42c1" : "white",
                  color: modoEnvio === "manual" ? "white" : "#6f42c1",
                  fontSize: "13px",
                }}
              >
                ✍️ Destinatários manuais
              </button>
            </div>

            {/* Filtro de % */}
            {modoEnvio === "filtro" && (
              <div
                style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  backgroundColor: "#f8f9fa",
                  marginBottom: "20px",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0" }}>
                  🎯 Filtro por Pendência
                </h4>
                <div
                  style={{
                    display: "flex",
                    gap: "15px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                      Mínimo (%):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={filtroMin}
                      onChange={(e) =>
                        setFiltroMin(
                          Math.min(100, Math.max(0, Number(e.target.value)))
                        )
                      }
                      style={{
                        width: "80px",
                        padding: "6px",
                        marginLeft: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                      Máximo (%):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={filtroMax}
                      onChange={(e) =>
                        setFiltroMax(
                          Math.min(100, Math.max(0, Number(e.target.value)))
                        )
                      }
                      style={{
                        width: "80px",
                        padding: "6px",
                        marginLeft: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#e9ecef",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                  >
                    {servidoresFiltrados.length} servidor(es) na faixa •{" "}
                    <strong style={{ color: "#28a745" }}>
                      {comEmail.length} com email
                    </strong>{" "}
                    •{" "}
                    <strong style={{ color: "#dc3545" }}>
                      {semEmail.length} sem email
                    </strong>
                  </div>
                </div>
                {/* Atalhos */}
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#6c757d" }}>
                    Atalhos:
                  </span>
                  <button
                    onClick={() => {
                      setFiltroMin(100);
                      setFiltroMax(100);
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: "12px",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      cursor: "pointer",
                      backgroundColor: "#fff3cd",
                      color: "black",
                    }}
                  >
                    100% pendentes
                  </button>
                  <button
                    onClick={() => {
                      setFiltroMin(50);
                      setFiltroMax(100);
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: "12px",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      cursor: "pointer",
                      backgroundColor: "#f8d7da",
                      color: "black",
                    }}
                  >
                    50%+ pendentes
                  </button>
                  <button
                    onClick={() => {
                      setFiltroMin(30);
                      setFiltroMax(60);
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: "12px",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      cursor: "pointer",
                      backgroundColor: "#d4edda",
                      color: "black",
                    }}
                  >
                    30% a 60%
                  </button>
                  <button
                    onClick={() => {
                      setFiltroMin(1);
                      setFiltroMax(100);
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: "12px",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      cursor: "pointer",
                      backgroundColor: "#d1ecf1",
                      color: "black",
                    }}
                  >
                    Qualquer pendência
                  </button>
                  <button
                    onClick={() => {
                      setFiltroMin(0);
                      setFiltroMax(100);
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: "12px",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      cursor: "pointer",
                      backgroundColor: "#e9ecef",
                      color: "black",
                    }}
                  >
                    Todos
                  </button>
                </div>
              </div>
            )}

            {/* Preview dos destinatários */}
            {modoEnvio === "filtro" && servidoresFiltrados.length > 0 && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  maxHeight: "250px",
                  overflowY: "auto",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0" }}>
                  👥 Destinatários ({comEmail.length} receberão o email)
                </h4>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "2px solid #ddd",
                        textAlign: "left",
                      }}
                    >
                      <th style={{ padding: "6px" }}>Servidor</th>
                      <th style={{ padding: "6px" }}>Email</th>
                      <th style={{ padding: "6px", textAlign: "center" }}>
                        Pendentes
                      </th>
                      <th style={{ padding: "6px", textAlign: "center" }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servidoresFiltrados.map((s) => (
                      <tr
                        key={s.nome}
                        style={{
                          borderBottom: "1px solid #eee",
                          backgroundColor: s.email ? "white" : "#fff3cd",
                        }}
                      >
                        <td style={{ padding: "6px" }}>{s.nome}</td>
                        <td
                          style={{
                            padding: "6px",
                            color: s.email ? "#333" : "#dc3545",
                          }}
                        >
                          {s.email || "⚠️ Sem email"}
                        </td>
                        <td style={{ padding: "6px", textAlign: "center" }}>
                          {s.pendentes}/{s.total}
                        </td>
                        <td
                          style={{
                            padding: "6px",
                            textAlign: "center",
                            fontWeight: "bold",
                            color:
                              s.pct >= 80
                                ? "#dc3545"
                                : s.pct >= 50
                                  ? "#ffc107"
                                  : "#28a745",
                          }}
                        >
                          {s.pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Destinatários manuais */}
            {modoEnvio === "manual" && (
              <div
                style={{
                  padding: "15px",
                  border: "1px solid #6f42c1",
                  borderRadius: "5px",
                  backgroundColor: "#f5f0ff",
                  marginBottom: "20px",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0" }}>
                  ✍️ Destinatários Manuais
                </h4>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#555",
                    margin: "0 0 10px 0",
                  }}
                >
                  Informe os endereços de email separados por vírgula, ponto e
                  vírgula ou uma por linha. O email será enviado em CCO para
                  todos.
                </p>
                <textarea
                  value={emailsManuais}
                  onChange={(e) => setEmailsManuais(e.target.value)}
                  placeholder={
                    "email1@exemplo.com\nemail2@exemplo.com\nemail3@exemplo.com"
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #b39ddb",
                    borderRadius: "4px",
                    fontSize: "14px",
                    minHeight: "100px",
                    fontFamily: "monospace",
                    boxSizing: "border-box",
                  }}
                />
                {emailsManuais.trim() && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "13px",
                      color: "#6f42c1",
                    }}
                  >
                    {(() => {
                      const lista = emailsManuais
                        .split(/[\n,;]+/)
                        .map((e) => e.trim())
                        .filter((e) => e.length > 0);
                      return `${lista.length} endereço(s) informado(s)`;
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Carregar texto salvo */}
            {templates.length > 0 && (
              <div
                style={{
                  padding: "12px 15px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  backgroundColor: "#f8f9fa",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <label style={{ fontWeight: "bold", fontSize: "14px" }}>
                  📝 Carregar texto salvo:
                </label>
                <select
                  value={templateSelecionado}
                  onChange={(e) => {
                    const t = templates.find((t) => t.id === e.target.value);
                    if (t) carregarTextoNaComposicao(t);
                    else setTemplateSelecionado("");
                  }}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "13px",
                    flex: 1,
                    minWidth: "200px",
                  }}
                >
                  <option value="">-- Selecionar --</option>
                  {templates.filter((t) => t.tipo === "template").length >
                    0 && (
                    <optgroup label="Templates">
                      {templates
                        .filter((t) => t.tipo === "template")
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.titulo} — {t.assunto}
                          </option>
                        ))}
                    </optgroup>
                  )}
                  {templates.filter((t) => t.tipo === "rascunho").length >
                    0 && (
                    <optgroup label="Rascunhos">
                      {templates
                        .filter((t) => t.tipo === "rascunho")
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.titulo} — {t.assunto}
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>
            )}

            {/* Composição */}
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Assunto:
              </label>
              <input
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Ex: Pendência de Inventário - Ação Necessária"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Mensagem (HTML permitido):
              </label>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Prezado(a) Servidor(a),&#10;&#10;Informamos que existem bens sob sua responsabilidade que ainda não foram inventariados..."
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                  minHeight: "150px",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Button
                onClick={enviarEmails}
                disabled={
                  enviando ||
                  (modoEnvio === "filtro"
                    ? comEmail.length === 0
                    : !emailsManuais.trim())
                }
                style={{
                  backgroundColor:
                    modoEnvio === "filtro"
                      ? comEmail.length > 0
                        ? "#28a745"
                        : "#6c757d"
                      : emailsManuais.trim()
                        ? "#6f42c1"
                        : "#6c757d",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    modoEnvio === "filtro"
                      ? comEmail.length > 0
                        ? "pointer"
                        : "not-allowed"
                      : emailsManuais.trim()
                        ? "pointer"
                        : "not-allowed",
                  fontWeight: "bold",
                  fontSize: "15px",
                }}
              >
                {enviando
                  ? "⏳ Enviando..."
                  : modoEnvio === "manual"
                    ? `📧 Enviar CCO para destinatários manuais`
                    : `📧 Enviar CCO para ${comEmail.length} servidor(es)`}
              </Button>
              {modoEnvio === "filtro" && semEmail.length > 0 && (
                <span style={{ fontSize: "13px", color: "#dc3545" }}>
                  ⚠️ {semEmail.length} servidor(es) sem email não receberão a
                  mensagem.{" "}
                  <span
                    style={{
                      color: "#007bff",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                    onClick={() => setAbaAtiva("emails")}
                  >
                    Cadastrar emails
                  </span>
                </span>
              )}
              {(assunto.trim() || mensagem.trim()) && (
                <Button
                  onClick={() => {
                    setTituloSalvarTemplate("");
                    setMostrarSalvarTemplate(true);
                  }}
                  style={{
                    backgroundColor: "#6f42c1",
                    color: "white",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  💾 Salvar como Rascunho
                </Button>
              )}
            </div>

            {/* Salvar como template após envio */}
            {mostrarSalvarTemplate && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  border: "1px solid #b8daff",
                  borderRadius: "5px",
                  backgroundColor: "#e7f1ff",
                }}
              >
                <h4 style={{ margin: "0 0 10px 0" }}>
                  💾 Salvar texto como template reutilizável
                </h4>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="text"
                    value={tituloSalvarTemplate}
                    onChange={(e) => setTituloSalvarTemplate(e.target.value)}
                    placeholder="Nome do template (ex: Cobrança Padrão)"
                    style={{
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "14px",
                      flex: 1,
                      minWidth: "200px",
                    }}
                  />
                  <Button
                    onClick={async () => {
                      if (!tituloSalvarTemplate.trim()) {
                        alert("Informe um nome para o template.");
                        return;
                      }
                      const ok = await criarTemplate({
                        titulo: tituloSalvarTemplate,
                        assunto,
                        mensagem,
                        tipo: "template",
                      });
                      if (ok) {
                        setMostrarSalvarTemplate(false);
                        setTituloSalvarTemplate("");
                      }
                    }}
                    disabled={salvandoTemplate}
                    style={{
                      backgroundColor: "#28a745",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {salvandoTemplate ? "Salvando..." : "✅ Salvar Template"}
                  </Button>
                  <button
                    onClick={() => setMostrarSalvarTemplate(false)}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      cursor: "pointer",
                      backgroundColor: "white",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Aba: Gerenciar Emails */}
        {abaAtiva === "emails" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h4 style={{ margin: 0 }}>
                Cadastrar emails dos servidores (
                {Object.values(emailsEditados).filter((e) => e).length}/
                {servidores.length} preenchidos)
              </h4>
              <Button
                onClick={salvarEmails}
                disabled={salvando}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {salvando ? "Salvando..." : "💾 Salvar Emails"}
              </Button>
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #ddd",
                    textAlign: "left",
                    backgroundColor: "#f8f9fa",
                  }}
                >
                  <th style={{ padding: "8px" }}>Servidor</th>
                  <th style={{ padding: "8px" }}>Email</th>
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      width: "100px",
                    }}
                  >
                    Bens
                  </th>
                  <th
                    style={{
                      padding: "8px",
                      textAlign: "center",
                      width: "100px",
                    }}
                  >
                    % Pendente
                  </th>
                </tr>
              </thead>
              <tbody>
                {servidores.map((s) => {
                  const stats = itensPorServidor[s.nome] || {
                    total: 0,
                    pendentes: 0,
                  };
                  const pct =
                    stats.total > 0
                      ? Math.round((stats.pendentes / stats.total) * 100)
                      : 0;
                  return (
                    <tr key={s.nome} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "8px", fontWeight: "500" }}>
                        {s.nome}
                      </td>
                      <td style={{ padding: "8px" }}>
                        <input
                          type="email"
                          value={emailsEditados[s.nome] || ""}
                          onChange={(e) =>
                            setEmailsEditados({
                              ...emailsEditados,
                              [s.nome]: e.target.value,
                            })
                          }
                          placeholder="email@exemplo.com"
                          style={{
                            width: "100%",
                            padding: "6px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            fontSize: "13px",
                          }}
                        />
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          fontSize: "13px",
                        }}
                      >
                        {stats.pendentes}/{stats.total}
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          fontWeight: "bold",
                          color:
                            pct >= 80
                              ? "#dc3545"
                              : pct >= 50
                                ? "#ffc107"
                                : "#28a745",
                        }}
                      >
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: "15px", textAlign: "right" }}>
              <Button
                onClick={salvarEmails}
                disabled={salvando}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {salvando ? "Salvando..." : "💾 Salvar Emails"}
              </Button>
            </div>
          </div>
        )}

        {/* Aba: Textos Salvos */}
        {abaAtiva === "textos" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h4 style={{ margin: 0 }}>Banco de Textos de Email</h4>
              <Button
                onClick={() => {
                  setCriandoTemplate(true);
                  setNovoTemplate({
                    titulo: "",
                    assunto: "",
                    mensagem: "",
                    tipo: "template",
                  });
                }}
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ➕ Novo Texto
              </Button>
            </div>

            {/* Formulário criar/editar */}
            {(criandoTemplate || editandoTemplate) && (
              <div
                style={{
                  padding: "15px",
                  border: "1px solid #007bff",
                  borderRadius: "5px",
                  backgroundColor: "#e7f1ff",
                  marginBottom: "20px",
                }}
              >
                <h4 style={{ margin: "0 0 12px 0" }}>
                  {editandoTemplate ? "✏️ Editar Texto" : "➕ Novo Texto"}
                </h4>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "4px",
                        fontWeight: "bold",
                        fontSize: "13px",
                      }}
                    >
                      Título:
                    </label>
                    <input
                      type="text"
                      value={
                        editandoTemplate
                          ? editandoTemplate.titulo
                          : novoTemplate.titulo
                      }
                      onChange={(e) => {
                        if (editandoTemplate)
                          setEditandoTemplate({
                            ...editandoTemplate,
                            titulo: e.target.value,
                          });
                        else
                          setNovoTemplate({
                            ...novoTemplate,
                            titulo: e.target.value,
                          });
                      }}
                      placeholder="Ex: Cobrança de Inventário"
                      style={{
                        width: "100%",
                        padding: "6px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                  <div style={{ width: "150px" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "4px",
                        fontWeight: "bold",
                        fontSize: "13px",
                      }}
                    >
                      Tipo:
                    </label>
                    <select
                      value={
                        editandoTemplate
                          ? editandoTemplate.tipo
                          : novoTemplate.tipo
                      }
                      onChange={(e) => {
                        if (editandoTemplate)
                          setEditandoTemplate({
                            ...editandoTemplate,
                            tipo: e.target.value,
                          });
                        else
                          setNovoTemplate({
                            ...novoTemplate,
                            tipo: e.target.value,
                          });
                      }}
                      style={{
                        width: "100%",
                        padding: "6px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "13px",
                      }}
                    >
                      <option value="template">Template</option>
                      <option value="rascunho">Rascunho</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    Assunto:
                  </label>
                  <input
                    type="text"
                    value={
                      editandoTemplate
                        ? editandoTemplate.assunto
                        : novoTemplate.assunto
                    }
                    onChange={(e) => {
                      if (editandoTemplate)
                        setEditandoTemplate({
                          ...editandoTemplate,
                          assunto: e.target.value,
                        });
                      else
                        setNovoTemplate({
                          ...novoTemplate,
                          assunto: e.target.value,
                        });
                    }}
                    placeholder="Assunto do email"
                    style={{
                      width: "100%",
                      padding: "6px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "4px",
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    Mensagem (HTML permitido):
                  </label>
                  <textarea
                    value={
                      editandoTemplate
                        ? editandoTemplate.mensagem
                        : novoTemplate.mensagem
                    }
                    onChange={(e) => {
                      if (editandoTemplate)
                        setEditandoTemplate({
                          ...editandoTemplate,
                          mensagem: e.target.value,
                        });
                      else
                        setNovoTemplate({
                          ...novoTemplate,
                          mensagem: e.target.value,
                        });
                    }}
                    placeholder="Corpo do email..."
                    style={{
                      width: "100%",
                      padding: "6px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "13px",
                      minHeight: "120px",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Button
                    onClick={() => {
                      if (editandoTemplate) {
                        atualizarTemplate(
                          editandoTemplate.id,
                          editandoTemplate
                        );
                      } else {
                        if (
                          !novoTemplate.titulo.trim() ||
                          !novoTemplate.assunto.trim() ||
                          !novoTemplate.mensagem.trim()
                        ) {
                          alert("Preencha todos os campos.");
                          return;
                        }
                        criarTemplate(novoTemplate);
                      }
                    }}
                    disabled={salvandoTemplate}
                    style={{
                      backgroundColor: "#007bff",
                      color: "white",
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    {salvandoTemplate ? "Salvando..." : "💾 Salvar"}
                  </Button>
                  <button
                    onClick={() => {
                      setCriandoTemplate(false);
                      setEditandoTemplate(null);
                    }}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      cursor: "pointer",
                      backgroundColor: "white",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de templates */}
            {["template", "rascunho"].map((tipo) => {
              const lista = templates.filter((t) => t.tipo === tipo);
              if (lista.length === 0) return null;
              return (
                <div key={tipo} style={{ marginBottom: "20px" }}>
                  <h4
                    style={{
                      margin: "0 0 10px 0",
                      color: tipo === "template" ? "#007bff" : "#6f42c1",
                    }}
                  >
                    {tipo === "template" ? "📋 Templates" : "📝 Rascunhos"} (
                    {lista.length})
                  </h4>
                  {lista.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: "12px 15px",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        marginBottom: "8px",
                        backgroundColor: "white",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "6px",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: "15px" }}>
                            {t.titulo}
                          </strong>
                          <span
                            style={{
                              marginLeft: "8px",
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "11px",
                              backgroundColor:
                                tipo === "template" ? "#cce5ff" : "#e2d9f3",
                              color:
                                tipo === "template" ? "#004085" : "#4a235a",
                            }}
                          >
                            {tipo}
                          </span>
                        </div>
                        <span style={{ fontSize: "12px", color: "#6c757d" }}>
                          {new Date(t.updatedAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#555",
                          marginBottom: "4px",
                        }}
                      >
                        <strong>Assunto:</strong> {t.assunto}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#888",
                          marginBottom: "8px",
                          maxHeight: "40px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.mensagem.replace(/<[^>]*>/g, "").substring(0, 150)}
                        {t.mensagem.length > 150 ? "..." : ""}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          fontSize: "12px",
                        }}
                      >
                        <button
                          onClick={() => carregarTextoNaComposicao(t)}
                          style={{
                            padding: "4px 10px",
                            border: "1px solid #28a745",
                            borderRadius: "3px",
                            cursor: "pointer",
                            backgroundColor: "#d4edda",
                            color: "#155724",
                          }}
                        >
                          ✉️ Usar
                        </button>
                        <button
                          onClick={() => {
                            setEditandoTemplate({ ...t });
                            setCriandoTemplate(false);
                          }}
                          style={{
                            padding: "4px 10px",
                            border: "1px solid #007bff",
                            borderRadius: "3px",
                            cursor: "pointer",
                            backgroundColor: "#cce5ff",
                            color: "#004085",
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => excluirTemplate(t.id)}
                          style={{
                            padding: "4px 10px",
                            border: "1px solid #dc3545",
                            borderRadius: "3px",
                            cursor: "pointer",
                            backgroundColor: "#f8d7da",
                            color: "#721c24",
                          }}
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {templates.length === 0 && !criandoTemplate && (
              <p style={{ color: "#6c757d", fontStyle: "italic" }}>
                Nenhum texto salvo ainda. Clique em "➕ Novo Texto" para criar
                um template ou rascunho.
              </p>
            )}
          </div>
        )}

        {/* Aba: Histórico */}
        {abaAtiva === "historico" && (
          <div>
            <h4 style={{ margin: "0 0 15px 0" }}>Histórico de Envios</h4>
            {historico.length === 0 ? (
              <p style={{ color: "#6c757d", fontStyle: "italic" }}>
                Nenhum email enviado ainda.
              </p>
            ) : (
              historico.map((envio) => (
                <div
                  key={envio.id}
                  style={{
                    padding: "15px",
                    border: `1px solid ${envio.status === "erro" ? "#dc3545" : "#28a745"}`,
                    borderRadius: "5px",
                    marginBottom: "10px",
                    backgroundColor:
                      envio.status === "erro" ? "#f8d7da" : "#d4edda",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <strong>{envio.assunto}</strong>
                    <span style={{ fontSize: "13px", color: "#6c757d" }}>
                      {new Date(envio.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", marginBottom: "5px" }}>
                    <strong>Remetente:</strong>{" "}
                    {envio.remetente?.nome || envio.remetente?.email}
                  </div>
                  <div style={{ fontSize: "13px", marginBottom: "5px" }}>
                    <strong>Filtro:</strong> {envio.filtroMin}% a{" "}
                    {envio.filtroMax}% de pendência
                  </div>
                  <div style={{ fontSize: "13px", marginBottom: "5px" }}>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "10px",
                        backgroundColor:
                          envio.status === "erro" ? "#dc3545" : "#28a745",
                        color: "white",
                        fontSize: "12px",
                      }}
                    >
                      {envio.status === "erro" ? "❌ Erro" : "✅ Enviado"}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px" }}>
                    <strong>Destinatários ({envio.totalEnviados}):</strong>
                    <button
                      onClick={() =>
                        setHistoricoAberto(
                          historicoAberto === envio.id ? null : envio.id
                        )
                      }
                      style={{
                        marginLeft: "8px",
                        padding: "2px 8px",
                        fontSize: "12px",
                        border: "1px solid #ccc",
                        borderRadius: "3px",
                        cursor: "pointer",
                        backgroundColor: "white",
                      }}
                    >
                      {historicoAberto === envio.id
                        ? "Ocultar"
                        : "Ver detalhes"}
                    </button>
                  </div>
                  {historicoAberto === envio.id && (
                    <div style={{ marginTop: "10px" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "12px",
                        }}
                      >
                        <thead>
                          <tr style={{ borderBottom: "1px solid #ddd" }}>
                            <th style={{ padding: "4px", textAlign: "left" }}>
                              Servidor
                            </th>
                            <th style={{ padding: "4px", textAlign: "left" }}>
                              Email
                            </th>
                            <th style={{ padding: "4px", textAlign: "center" }}>
                              Pendência
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(Array.isArray(envio.destinatarios)
                            ? envio.destinatarios
                            : []
                          ).map((d, i) => (
                            <tr
                              key={i}
                              style={{ borderBottom: "1px solid #eee" }}
                            >
                              <td style={{ padding: "4px" }}>{d.nome}</td>
                              <td style={{ padding: "4px" }}>{d.email}</td>
                              <td
                                style={{ padding: "4px", textAlign: "center" }}
                              >
                                {d.pendentes}/{d.total} ({d.pendenciaPct}%)
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {envio.mensagem && (
                        <div
                          style={{
                            marginTop: "10px",
                            padding: "10px",
                            backgroundColor: "white",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "13px",
                          }}
                        >
                          <strong>Mensagem enviada:</strong>
                          <div
                            style={{ marginTop: "5px" }}
                            dangerouslySetInnerHTML={{
                              __html: envio.mensagem,
                            }}
                          />
                        </div>
                      )}
                      {envio.erroDetalhes && (
                        <div
                          style={{
                            marginTop: "8px",
                            padding: "8px",
                            backgroundColor: "#f8d7da",
                            borderRadius: "4px",
                            fontSize: "12px",
                            color: "#721c24",
                          }}
                        >
                          <strong>Erro:</strong> {envio.erroDetalhes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
