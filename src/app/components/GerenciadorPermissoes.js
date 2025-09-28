"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export default function GerenciadorPermissoes({
  inventarioNome,
  isOwner,
  onClose,
}) {
  const { data: session } = useSession();
  const [permissoes, setPermissoes] = useState([]);
  const [novoEmail, setNovoEmail] = useState("");
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
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Permissão concedida com sucesso!");
        setNovoEmail("");
        carregarPermissoes();
      } else {
        setMessage(`Erro: ${data.error}`);
      }
    } catch (error) {
      setMessage("Erro ao conceder permissão.");
    }

    setLoading(false);
  };

  const removerPermissao = async (email) => {
    if (!confirm(`Tem certeza que deseja revogar o acesso de ${email}?`)) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/permissoes", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventarioNome,
          emailUsuario: email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Permissão revogada com sucesso!");
        carregarPermissoes();
      } else {
        setMessage(`Erro: ${data.error}`);
      }
    } catch (error) {
      setMessage("Erro ao revogar permissão.");
    }

    setLoading(false);
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
            <button onClick={onClose} className="modal-close-btn">
              ✕
            </button>
          </div>
          <p style={{ color: "#6b7280", marginBottom: "16px" }}>
            Apenas o proprietário do inventário pode gerenciar permissões.
          </p>
          <button
            onClick={onClose}
            className="modal-btn modal-btn-secondary"
            style={{ width: "100%" }}
          >
            Fechar
          </button>
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
          <button onClick={onClose} className="modal-close-btn">
            ✕
          </button>
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
            <button
              type="submit"
              disabled={loading}
              className="modal-btn modal-btn-primary"
            >
              {loading ? "..." : "Conceder"}
            </button>
          </form>
        </div>

        {/* Lista de usuários com acesso */}
        <div className="modal-section">
          <h3 className="modal-section-title">Usuários com Acesso</h3>

          {/* Proprietário */}
          <div className="modal-owner-item">
            <div className="modal-list-item-content">
              <div>
                <span className="modal-user-email">{session?.user?.email}</span>
                <span className="modal-owner-badge"> - Proprietário</span>
                <hr />
              </div>
            </div>
          </div>

          {/* Usuários com permissão */}
          {permissoes.length === 0 ? (
            <p className="modal-empty-message">
              Nenhum usuário adicional tem acesso.
            </p>
          ) : (
            permissoes.map((permissao, index) => (
              <div key={index} className="modal-list-item">
                <div className="modal-list-item-content">
                  <div>
                    <span className="modal-user-email">
                      {permissao.usuario.email}
                    </span>
                    <div className="modal-user-date">
                      Concedido em:{" "}
                      {new Date(permissao.createdAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <button
                    onClick={() => removerPermissao(permissao.usuario.email)}
                    disabled={loading}
                    className="modal-btn modal-btn-danger"
                  >
                    Revogar
                  </button>
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
          <button onClick={onClose} className="modal-btn modal-btn-secondary">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
