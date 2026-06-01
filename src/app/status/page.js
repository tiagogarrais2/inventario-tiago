"use client";
import { useState, useEffect, useCallback } from "react";

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min ${s}s`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

function StatusBadge({ ok }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "12px",
        fontSize: "0.78rem",
        fontWeight: 600,
        backgroundColor: ok ? "#d4edda" : "#f8d7da",
        color: ok ? "#155724" : "#721c24",
        border: `1px solid ${ok ? "#c3e6cb" : "#f5c6cb"}`,
      }}
    >
      {ok ? "✓ OK" : "✗ Erro"}
    </span>
  );
}

function Row({ label, children }) {
  return (
    <tr
      style={{
        borderBottom: "1px solid #e9ecef",
      }}
    >
      <td
        style={{
          padding: "10px 14px",
          color: "#6c757d",
          fontWeight: 500,
          whiteSpace: "nowrap",
          width: "220px",
        }}
      >
        {label}
      </td>
      <td style={{ padding: "10px 14px" }}>{children}</td>
    </tr>
  );
}

function Card({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "8px",
        border: "1px solid #dee2e6",
        marginBottom: "20px",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #e9ecef",
          background: "#f8f9fa",
          fontWeight: 600,
          fontSize: "0.9rem",
          color: "#495057",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setLastFetch(new Date());
    } catch (err) {
      setError("Não foi possível conectar à API de status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const overallOk = data?.status === "ok";

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "0 16px",
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#212529",
              margin: 0,
            }}
          >
            📋 Status do Sistema
          </h1>
          {lastFetch && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.82rem",
                color: "#6c757d",
              }}
            >
              Atualizado em: {lastFetch.toLocaleString("pt-BR")} · atualiza a
              cada 30s
            </p>
          )}
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          style={{
            padding: "8px 18px",
            borderRadius: "6px",
            border: "none",
            background: loading ? "#adb5bd" : "var(--primary-color, #007bff)",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "0.9rem",
            transition: "background 0.2s",
          }}
        >
          {loading ? "Verificando..." : "↻ Atualizar"}
        </button>
      </div>

      {/* Banner de estado geral */}
      {data && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "8px",
            marginBottom: "24px",
            background: overallOk ? "#d4edda" : "#f8d7da",
            border: `1px solid ${overallOk ? "#c3e6cb" : "#f5c6cb"}`,
            color: overallOk ? "#155724" : "#721c24",
            fontWeight: 600,
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "1.3rem" }}>{overallOk ? "✅" : "⚠️"}</span>
          {overallOk
            ? "Todos os serviços estão operando normalmente."
            : "Um ou mais serviços apresentam problemas."}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "8px",
            marginBottom: "24px",
            background: "#f8d7da",
            border: "1px solid #f5c6cb",
            color: "#721c24",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {loading && !data && (
        <div
          style={{ textAlign: "center", color: "#6c757d", padding: "40px 0" }}
        >
          Verificando status...
        </div>
      )}

      {data && (
        <>
          {/* Banco de dados */}
          <Card title="🗄️ Banco de Dados">
            <Row label="Conexão">
              <StatusBadge ok={data.database.status === "ok"} />
            </Row>
            {data.database.latencyMs !== null && (
              <Row label="Latência">{data.database.latencyMs} ms</Row>
            )}
            {data.database.errorType && (
              <Row label="Tipo de Erro">
                <code style={{ fontSize: "0.82rem", color: "#721c24" }}>
                  {data.database.errorType}
                </code>
              </Row>
            )}
            {data.database.message && (
              <Row label="Detalhe do Erro">
                <span
                  style={{
                    color: "#721c24",
                    fontSize: "0.85rem",
                    wordBreak: "break-word",
                  }}
                >
                  {data.database.message}
                </span>
              </Row>
            )}
            {data.database.hint && (
              <Row label="Sugestão">
                <span style={{ color: "#856404", fontSize: "0.85rem" }}>
                  💡 {data.database.hint}
                </span>
              </Row>
            )}
          </Card>

          {/* Aplicação */}
          <Card title="⚙️ Aplicação">
            <Row label="Versão">{data.version}</Row>
            <Row label="Ambiente">
              <span
                style={{
                  fontWeight: 600,
                  color:
                    data.environment === "production" ? "#155724" : "#856404",
                }}
              >
                {data.environment}
              </span>
            </Row>
            <Row label="Uptime do servidor">
              {formatUptime(data.uptimeSeconds)}
            </Row>
            <Row label="Data/hora do servidor">
              {new Date(data.timestamp).toLocaleString("pt-BR", {
                timeZone: "America/Fortaleza",
              })}
            </Row>
          </Card>

          {/* Variáveis de Ambiente */}
          <Card title="🔑 Variáveis de Ambiente">
            <Row label="DATABASE_URL">
              <StatusBadge ok={data.config.databaseUrl} />
            </Row>
            <Row label="NEXTAUTH_SECRET">
              <StatusBadge ok={data.config.nextauthSecret} />
            </Row>
            <Row label="NEXTAUTH_URL">
              <StatusBadge ok={data.config.nextauthUrl} />
            </Row>
            <Row label="GOOGLE_CLIENT_ID">
              <StatusBadge ok={data.config.googleClientId} />
            </Row>
            <Row label="GOOGLE_CLIENT_SECRET">
              <StatusBadge ok={data.config.googleClientSecret} />
            </Row>
          </Card>
        </>
      )}
    </div>
  );
}
