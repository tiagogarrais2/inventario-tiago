"use client";
import { useState } from "react";

export default function InventarioPage({ params }) {
  const { nome } = params;
  const [valor, setValor] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");

  async function buscarInventario() {
    setErro("");
    setResultado(null);
    if (!valor) return;

    try {
      const res = await fetch(`/${nome}/inventario.json`);
      if (!res.ok) throw new Error("Item não encontrado.");
      const dados = await res.json();

      // Procura pelo campo numero, tombo ou tombamento
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

  return (
    <div>
      <h1>{nome}</h1>
      <input
        type="number"
        value={valor}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Digite o número dotombo"
      />
      <button onClick={handleConfirmar}>Confirmar</button>
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {resultado && (
        <pre style={{ textAlign: "left", background: "#eee", padding: 10 }}>
          {JSON.stringify(resultado, null, 2)}
        </pre>
      )}
    </div>
  );
}
