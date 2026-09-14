import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "./Button";

export default function Listar({ atualizar, novoInventario }) {
  const [inventarios, setInventarios] = useState([]);
  const [redirecionando, setRedirecionando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const noRedirect = searchParams.get("noredirect") === "true";

    fetch("/api/listar")
      .then((res) => res.json())
      .then((data) => {
        let list = [];
        if (data.inventarios && Array.isArray(data.inventarios)) {
          list = data.inventarios;
        } else if (data.pastas && Array.isArray(data.pastas)) {
          list = data.pastas.map((p) => ({ nome: p, nomeExibicao: p }));
        }
        setInventarios(list);

        // Se o usuário tem apenas 1 inventário, não está no modo noredirect e não acabou de criar um novo
        if (list.length === 1 && !noRedirect && !novoInventario) {
          const unico = list[0];
          const nomeSlug = typeof unico === "string" ? unico : unico.nome;
          setRedirecionando(true);
          router.replace(`/inventario/${nomeSlug}`);
        }
      })
      .catch(() => setInventarios([]));
  }, [atualizar, novoInventario, router]);

  if (redirecionando) {
    const unico = inventarios[0];
    const nomeExibicao =
      typeof unico === "string"
        ? unico
        : unico?.nomeExibicao || unico?.nome || "";

    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
          maxWidth: "600px",
          margin: "20px auto",
        }}
      >
        <div
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            color: "#007bff",
            marginBottom: "12px",
          }}
        >
          🚀 Redirecionando para &quot;{nomeExibicao}&quot;...
        </div>
        <div style={{ fontSize: "14px", color: "#6c757d" }}>
          Como você possui 1 inventário ativo, abriremos diretamente.
        </div>
        <div style={{ marginTop: "16px", fontSize: "13px" }}>
          Para criar um novo inventário ou ver a tela inicial,{" "}
          <Link
            href="/?noredirect=true"
            style={{ color: "#007bff", textDecoration: "underline" }}
          >
            clique aqui
          </Link>
          .
        </div>
      </div>
    );
  }

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
        {inventarios.map((inv) => {
          const nomeSlug = typeof inv === "string" ? inv : inv.nome;
          const nomeExibicao =
            typeof inv === "string" ? inv : inv.nomeExibicao || inv.nome;
          const isNovo =
            novoInventario &&
            (nomeSlug === novoInventario || nomeExibicao === novoInventario);

          return (
            <div
              key={nomeSlug}
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
                onClick={() => router.push(`/inventario/${nomeSlug}`)}
                aria-label={`Abrir inventário ${nomeExibicao}`}
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
                <span aria-hidden="true">📋</span> {nomeExibicao}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
