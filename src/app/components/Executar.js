"use client";
import { useEffect, useState } from "react";

export default function Executar() {
  const [inventarios, setInventarios] = useState([]);

  useEffect(() => {
    fetch("/api/inventarios")
      .then((res) => res.json())
      .then(setInventarios)
      .catch(() => setInventarios([]));
  }, []);

  return (
    <div>
      <h2>Inventários disponíveis</h2>
      <ul>
        {inventarios.length === 0 && <li>Nenhum inventário disponível.</li>}
        {inventarios.map((nome) => (
          <li key={nome}>{nome}</li>
        ))}
      </ul>
    </div>
  );
}
