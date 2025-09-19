"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Importa o roteador

export default function InventarioPage({ params }) {
  const { nome } = params;
  const [valor, setValor] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const router = useRouter(); // Inicializa o roteador

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
        setErro("Item não encontrado."); // Mensagem de erro mais curta
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

  // Função para redirecionar para a página de cadastro
  function handleCadastrar() {
    router.push(`/cadastrar?nome=${nome}&numero=${valor}`);
  }

  return (
    <div>
      <h1>{nome}</h1>
      <input
        type="number"
        value={valor}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Digite o número do tombo"
      />
      <button onClick={handleConfirmar}>Confirmar</button>

      {/* Exibe o erro e, se for "Item não encontrado", mostra o botão de cadastro */}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
      {erro === "Item não encontrado." && (
        <button onClick={handleCadastrar} style={{ marginTop: 10 }}>
          Cadastrar item
        </button>
      )}

      {resultado && (
        <pre style={{ textAlign: "left", background: "#eee", padding: 10 }}>
          {JSON.stringify(resultado, null, 2)}
        </pre>
      )}
    </div>
  );
}
