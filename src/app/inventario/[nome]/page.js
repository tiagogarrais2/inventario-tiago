"use client";
import React, { useState, useEffect } from "react";
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
  const router = useRouter();

  useEffect(() => {
    // Carrega inventariante do localStorage
    const inventarianteSalvo = localStorage.getItem("inventariante");
    if (inventarianteSalvo) {
      setInventariante(inventarianteSalvo);
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

    const salaOriginal = resultado.SALA || ""; // Assume que o campo é SALA no objeto
    const confirmarSala = salaSelecionada !== salaOriginal ? window.confirm(`A sala selecionada (${salaSelecionada}) difere da sala original (${salaOriginal}). Confirmar?`) : true;

    if (!confirmarSala) return;

    const dataInventario = new Date().toISOString();

    try {
      const res = await fetch('/api/update-inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        alert("Item confirmado com sucesso!");
        setResultado(null); // Limpa o resultado após confirmação
        setValor("");
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
    router.push(`/cadastrar?nome=${nome}&numero=${valor}`);
  }

  return (
    <div>
      <h1>{nome}</h1>
      <a href={`/relatorio/${nome}`} style={{ display: "block", marginBottom: 10 }}>
        Ver Relatório
      </a>
      {/* Campo do inventariante */}
      <input
        type="text"
        value={inventariante}
        onChange={handleInventarianteChange}
        placeholder="Nome completo do servidor(a) inventariante"
        style={{ marginBottom: 10, width: '100%' }}
      />
      {/* Campo de seleção de sala */}
      <select
        value={salaSelecionada}
        onChange={handleSalaChange}
        style={{ marginBottom: 10 }}
      >
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
          <pre style={{ textAlign: "left", background: "#eee", padding: 10, border: resultado.dataInventario ? "2px solid red" : "none" }}>
            {JSON.stringify(resultado, null, 2)}
          </pre>
          {resultado.dataInventario && (
            <p style={{ color: "red", fontWeight: "bold" }}>Este item já foi inventariado.</p>
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
