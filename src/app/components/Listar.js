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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: "center",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        {inventarios.length === 0 && (
          <TimerText
            initialTime={4}
            finalText={
              <span>
                Solicite seu acesso ao inventário do IFCE no seguinte{" "}
                <a
                  href="https://forms.gle/Vb68rtPgdmfF9BwKA"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#007bff", textDecoration: "underline" }}
                >
                  link
                </a>
                .
              </span>
            }
          />
        )}
        {inventarios.map((nome) => {
          const isNovo = novoInventario && nome === novoInventario;
          return (
            <div
              key={nome}
              style={{
                width: "100%",
                padding: isNovo ? "12px 16px" : "8px 12px",
                backgroundColor: isNovo ? "#d4edda" : "#f8f9fa",
                border: isNovo ? "2px solid #28a745" : "1px solid #dee2e6",
                borderRadius: "8px",
                transition: "all 0.3s ease",
                boxShadow: isNovo
                  ? "0 4px 12px rgba(40, 167, 69, 0.15)"
                  : "0 2px 4px rgba(0,0,0,0.1)",
                position: "relative",
              }}
            >
              {isNovo && (
                <span
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "12px",
                    backgroundColor: "#28a745",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    zIndex: 1,
                  }}
                >
                  NOVO!
                </span>
              )}
              <Button
                onClick={() => router.push(`/inventario/${nome}`)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  backgroundColor: isNovo ? "#28a745" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                  display: "block",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = isNovo
                    ? "#218838"
                    : "#0056b3";
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = isNovo
                    ? "#28a745"
                    : "#007bff";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                📋 {nome}
              </Button>
            </div>
          );
        })}
      </div>
      {/* <div style={{ marginTop: "24px", textAlign: "center" }}>
        <Button onClick={() => router.push("/dashboard")}>
          📊 Dashboard dos seus inventários
        </Button>
      </div> */}
    </div>
  );
}
