import { useEffect, useState } from "react";
import Link from "next/link";

export default function Listar({ atualizar }) {
  const [inventarios, setInventarios] = useState([]);

  useEffect(() => {
    fetch("/api/listar")
      .then((res) => res.json())
      .then((data) => setInventarios(data.pastas || []))
      .catch(() => setInventarios([]));
  }, [atualizar]); // <- importante!

  return (
    <div>
      <h2>Inventários disponíveis</h2>
      <ul>
        {inventarios.length === 0 && <li>Nenhum inventário disponível.</li>}
        {inventarios.map((nome) => (
          <li key={nome}>
            <Link href={`/inventario/${nome}`}>{nome}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
