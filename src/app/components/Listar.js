import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "./Button";
import TimerText from "./TimerText";

export default function Listar({ atualizar, novoInventario }) {
  const [inventarios, setInventarios] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/listar")
      .then((res) => res.json())
      .then((data) => setInventarios(data.pastas || []))
      .catch(() => setInventarios([]));
  }, [atualizar]); // <- importante!

  return (
    <div>
      <h2>Inventários disponíveis</h2>
      <ul style={{ textAlign: "center" }}>
        {inventarios.length === 0 && (
          <TimerText
            initialTime={3}
            finalText="Nenhum inventário disponível."
          />
        )}
        {inventarios.map((nome) => {
          const isNovo = novoInventario && nome === novoInventario;
          return (
            <li
              key={nome}
              style={{
                padding: isNovo ? "8px 12px" : "4px 0",
                backgroundColor: isNovo ? "#d4edda" : "transparent",
                border: isNovo ? "2px solid #28a745" : "none",
                borderRadius: isNovo ? "8px" : "0",
                margin: isNovo ? "4px 0" : "2px 0",
                transition: "all 0.3s ease",
                boxShadow: isNovo ? "0 2px 8px rgba(40, 167, 69, 0.2)" : "none",
              }}
            >
              {isNovo && (
                <span
                  style={{
                    backgroundColor: "#28a745",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    marginRight: "8px",
                    fontWeight: "bold",
                  }}
                >
                  NOVO!
                </span>
              )}
              <Link href={`/inventario/${nome}`}>{nome}</Link>
            </li>
          );
        })}
      </ul>
      <Button onClick={() => router.push("/dashboard")}>
        📊 Dashboard dos seus inventários
      </Button>
    </div>
  );
}
