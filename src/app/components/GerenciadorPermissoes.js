"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Button from "./Button";
import { useNotifications } from "./Notifications";

const CARGOS_DISPONIVEIS = [
  "Presidente",
  "Vice-Presidente",
  "Membro",
  "Servidor(a)",
];

export default function GerenciadorPermissoes({
  inventarioNome,
  isOwner,
  onClose,
}) {
  const { data: session } = useSession();
  const { showSuccess, showError, showConfirmation } = useNotifications();
  const [permissoes, setPermissoes] = useState([]);
  const [novoEmail, setNovoEmail] = useState("");
  const [novoCargo, setNovoCargo] = useState("Servidor(a)");
  const [cargoProprietario, setCargoProprietario] = useState("Servidor(a)");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const carregarPermissoes = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/permissoes?inventario=${inventarioNome}`
      );
      if (response.ok) {
        const data = await response.json();
        setPermissoes(data.permissoes);
        if (data.cargoProprietario) {
          setCargoProprietario(data.cargoProprietario);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    }
  }, [inventarioNome]);

  useEffect(() => {
    if (isOwner) {
      carregarPermissoes();
    }
  }, [isOwner, carregarPermissoes]);

  const adicionarPermissao = async (e) => {
    e.preventDefault();
    if (!novoEmail.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/permissoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventarioNome,
          emailUsuario: novoEmail.trim(),
          cargo: novoCargo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Permissão concedida com sucesso!");
        setNovoEmail("");
        setNovoCargo("Servidor(a)");
        carregarPermissoes();
      } else {
        setMessage(`Erro: ${data.error}`);
      }
    } catch (error) {
      setMessage("Erro ao conceder permissão.");
    }

    setLoading(false);
  };

  const atualizarCargo = async (email, cargo) => {
    try {
      const response = await fetch("/api/permissoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventarioNome,
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

  const removerPermissao = async (email) => {
    showConfirmation(
      `Tem certeza que deseja revogar o acesso de ${email}?`,
      async () => {
        setLoading(true);
        setMessage("");

        try {
          const response = await fetch("/api/permissoes", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inventario: inventarioNome,
              email: email,
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
      () => {
        // Cancelado - não faz nada
      }
    );
  };

  if (!isOwner) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content modal-content-small"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 className="modal-title">Acesso Negado</h2>
            <Button onClick={onClose} className="modal-close-btn">
              ✕
            </Button>
          </div>
          <p style={{ color: "#6b7280", marginBottom: "16px" }}>
            Apenas o proprietário do inventário pode gerenciar permissões.
          </p>
          <Button
            onClick={onClose}
            className="modal-btn modal-btn-primary"
            style={{ width: "100%" }}
          >
            Entendido
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            Gerenciar Permissões - {inventarioNome}
          </h2>
          <Button onClick={onClose} className="modal-close-btn">
            ✕
          </Button>
        </div>

        {/* Adicionar nova permissão */}
        <div className="modal-section">
          <h3 className="modal-section-title">Conceder Acesso</h3>
          <form onSubmit={adicionarPermissao} className="modal-form">
            <input
              type="email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="Email do usuário"
              className="modal-input"
              disabled={loading}
              required
            />
            <select
              value={novoCargo}
              onChange={(e) => setNovoCargo(e.target.value)}
              className="modal-input"
              style={{ maxWidth: "180px" }}
              disabled={loading}
            >
              {CARGOS_DISPONIVEIS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              disabled={loading}
              className="modal-btn modal-btn-primary"
            >
              {loading ? "..." : "Conceder"}
            </Button>
          </form>
        </div>

        {/* Lista de usuários com acesso */}
        <div className="modal-section">
          <h3 className="modal-section-title">Comissão de Inventário</h3>

          {/* Proprietário */}
          <div className="modal-owner-item">
            <div className="modal-list-item-content">
              <div style={{ flex: 1 }}>
                <span className="modal-user-email">{session?.user?.email}</span>
                <span className="modal-owner-badge"> - Proprietário</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "4px",
                  }}
                >
                  <label style={{ fontSize: "12px", color: "#6b7280" }}>
                    Cargo:
                  </label>
                  <select
                    value={cargoProprietario}
                    onChange={(e) => {
                      setCargoProprietario(e.target.value);
                      atualizarCargo(session?.user?.email, e.target.value);
                    }}
                    style={{
                      padding: "2px 8px",
                      fontSize: "12px",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                      background: "#fff",
                    }}
                  >
                    {CARGOS_DISPONIVEIS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <hr />
              </div>
            </div>
          </div>

          {/* Usuários com permissão */}
          {permissoes.length === 0 ? (
            <p className="modal-empty-message">
              Nenhum membro adicional na comissão.
            </p>
          ) : (
            permissoes.map((permissao, index) => (
              <div key={index} className="modal-list-item">
                <div className="modal-list-item-content">
                  <div style={{ flex: 1 }}>
                    <span className="modal-user-email">
                      {permissao.usuario.email}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "4px",
                      }}
                    >
                      <label style={{ fontSize: "12px", color: "#6b7280" }}>
                        Cargo:
                      </label>
                      <select
                        value={permissao.cargo || "Servidor(a)"}
                        onChange={(e) =>
                          atualizarCargo(
                            permissao.usuario.email,
                            e.target.value
                          )
                        }
                        style={{
                          padding: "2px 8px",
                          fontSize: "12px",
                          borderRadius: "4px",
                          border: "1px solid #d1d5db",
                          background: "#fff",
                        }}
                      >
                        {CARGOS_DISPONIVEIS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="modal-user-date">
                      Concedido em:{" "}
                      {new Date(permissao.createdAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <Button
                    onClick={() => removerPermissao(permissao.usuario.email)}
                    disabled={loading}
                    className="modal-btn modal-btn-danger"
                  >
                    Revogar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mensagens */}
        {message && (
          <div
            className={`modal-message ${
              message.includes("sucesso")
                ? "modal-message-success"
                : "modal-message-error"
            }`}
          >
            {message}
          </div>
        )}

        {/* Botões de ação */}
        <div className="modal-actions">
          <Button onClick={onClose} className="modal-btn modal-btn-secondary">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
