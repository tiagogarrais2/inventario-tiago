"use client";
import React, { useState, useEffect } from "react";

export default function RelatorioPage({ params }) {
  const { nome } = React.use(params); // Desembrulha params com React.use()
  const [itensPorSala, setItensPorSala] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRelatorio() {
      try {
        const res = await fetch(`/${nome}/inventario.json`);
        if (!res.ok) throw new Error("Erro ao carregar inventário.");
        const dados = await res.json();

        // Agrupa por sala (prioriza salaEncontrada, senão SALA)
        const agrupado = {};
        dados.forEach((item) => {
          const sala = item.salaEncontrada || item.SALA || "Sala não definida";
          if (!agrupado[sala]) agrupado[sala] = [];
          agrupado[sala].push(item);
        });

        setItensPorSala(agrupado);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRelatorio();
  }, [nome]);

  if (loading) return <p>Carregando relatório...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Relatório Geral</h2>
      <h2>{nome}</h2>
      {Object.keys(itensPorSala).map((sala) => (
        <div key={sala} style={{ marginBottom: "30px" }}>
          <h2>Sala: {sala}</h2>
          <ul>
            {itensPorSala[sala].map((item, index) => (
              <li
                key={index}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  border: "1px solid #ccc",
                  backgroundColor: item.dataInventario ? "#d4edda" : "#f8d7da", // Verde para inventariado, vermelho para não
                  color: item.dataInventario ? "#155724" : "#721c24",
                }}
              >
                <strong>Número:</strong> {item.NUMERO} <br />
                <strong>Descrição:</strong> {item.DESCRICAO || "N/A"} <br />
                <strong>Status:</strong> {item.status || "N/A"} <br />
                <strong>Inventariante:</strong> {item.inventariante || "N/A"}{" "}
                <br />
                <strong>Data do Inventário:</strong>{" "}
                {item.dataInventario
                  ? new Date(item.dataInventario).toLocaleDateString()
                  : "Não inventariado"}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
