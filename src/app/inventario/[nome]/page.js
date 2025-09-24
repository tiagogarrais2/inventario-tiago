"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function InventarioPage({ params }) {
  const { nome } = React.use(params);
  const [valor, setValor] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [salas, setSalas] = useState([]);
  const [salaSelecionada, setSalaSelecionada] = useState("");
  const [inventariante, setInventariante] = useState("");
  const [statusSelecionado, setStatusSelecionado] = useState("Em Uso");
  const [ultimoTombo, setUltimoTombo] = useState("");
  const [notificacao, setNotificacao] = useState(""); // Novo estado para notificações persistentes
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    // Carrega inventariante do localStorage
    const inventarianteSalvo = localStorage.getItem("inventariante");
    if (inventarianteSalvo) {
      setInventariante(inventarianteSalvo);
    }

    // Carrega notificação persistente do localStorage
    const notificacaoSalva = localStorage.getItem("notificacao");
    if (notificacaoSalva) {
      setNotificacao(notificacaoSalva);
      localStorage.removeItem("notificacao"); // Remove após carregar
    }

    async function fetchSalas() {
      try {
        const res = await fetch(`/${nome}/salas.json`);
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
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
        setSalas([]);
      }
    }
    fetchSalas();

    // Foca no input do tombo após carregamento
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [nome]);

  function handleSalaChange(e) {
    setSalaSelecionada(e.target.value);
    localStorage.setItem("salaSelecionada", e.target.value);
  }

  function handleInventarianteChange(e) {
    setInventariante(e.target.value);
    localStorage.setItem("inventariante", e.target.value);
  }

  async function buscarInventario() {
    setErro("");
    setResultado(null);
    if (!valor) return;

    try {
      const res = await fetch(`/${nome}/inventario.json`);
      if (!res.ok) throw new Error("Inventário não encontrado.");
      const dados = await res.json();

      const achado = dados.find((item) => String(item.NUMERO) === valor);

      if (achado) {
        setResultado(achado);
      } else {
        setErro("Item não encontrado.");
      }
    } catch (e) {
      setErro("Erro ao buscar o item.");
    }
  }

  async function confirmarEncontrado() {
    if (!resultado || !inventariante) return;

    const salaOriginal = resultado.SALA || "";
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
    router.push(`/cadastrar?nome=${nome}&numero=${valor}`);
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

  return (
    <div>
      {/* Notificação fixa e centralizada */}
      {notificacao && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
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

      {/* Último tombo inventariado */}
      {ultimoTombo && (
        <div
          style={{
            position: "fixed",
            top: "50px", // Ajuste para não sobrepor a notificação
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
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

      <h2>{nome}</h2>
      <button onClick={() => router.push(`/relatorio/${nome}`)}>
        Relatório geral deste inventário
      </button>
      <hr />
      <h2>Realizar inventário</h2>

      {/* Campo do inventariante */}
      <input
        type="text"
        value={inventariante}
        onChange={handleInventarianteChange}
        placeholder="Nome completo do servidor(a) inventariante"
      />
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
        ref={inputRef} // Adiciona ref para foco automático
      />
      <button onClick={handleConfirmar}>Confirmar</button>

      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {erro === "Item não encontrado." && (
        <button onClick={handleCadastrar} style={{ marginTop: 10 }}>
          Cadastrar item
        </button>
      )}

      {resultado && (
        <div style={{ marginTop: 20 }}>
          <pre
            style={{
              textAlign: "left",
              background: "#eee",
              padding: 10,
              border: resultado.dataInventario ? "2px solid red" : "none",
            }}
          >
            {JSON.stringify(resultado, null, 2)}
          </pre>
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
          <button onClick={confirmarEncontrado} style={{ marginTop: 10 }}>
            Confirmar Item Encontrado
          </button>
        </div>
      )}
    </div>
  );
}
