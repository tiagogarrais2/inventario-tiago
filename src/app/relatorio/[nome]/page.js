"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RelatorioPage({ params }) {
  const [nome, setNome] = useState("");
  
  useEffect(() => {
    if (params?.nome) {
      setNome(params.nome);
    }
  }, [params]);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [itensPorSala, setItensPorSala] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);

  // Verificar permissões de acesso
  useEffect(() => {
    async function verificarPermissoes() {
      if (status === "loading") return;

      if (status === "unauthenticated") {
        router.push("/");
        return;
      }

      try {
        const response = await fetch(
          `/api/verificar-acesso?inventario=${nome}`
        );
        const data = await response.json();

        if (response.ok) {
          setHasAccess(data.hasAccess);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        setHasAccess(false);
      }

      setAccessLoading(false);
    }

    verificarPermissoes();
  }, [nome, status, router]);

  useEffect(() => {
    if (!hasAccess || accessLoading) return;

    async function fetchRelatorio() {
      try {
        // Buscar todas as salas e todos os itens em paralelo
        const [salasRes, itensRes] = await Promise.all([
          fetch(`/api/salas?inventario=${encodeURIComponent(nome)}`),
          fetch(`/api/inventario?inventario=${encodeURIComponent(nome)}`)
        ]);

        if (!salasRes.ok) {
          const errorData = await salasRes.json();
          throw new Error(errorData.error || "Erro ao carregar salas.");
        }
        if (!itensRes.ok) {
          const errorData = await itensRes.json();
          throw new Error(errorData.error || "Erro ao carregar inventário.");
        }

        const salas = await salasRes.json();
        const itens = await itensRes.json();

        // Inicializar todas as salas com arrays vazios
        const agrupado = {};
        salas.forEach(sala => {
          agrupado[sala] = [];
        });

        // Agrupar itens por sala (prioriza salaEncontrada, senão sala)
        itens.forEach((item) => {
          const sala = item.salaEncontrada || item.sala || "Sala não definida";
          
          // Se a sala do item não existe na lista de salas, criar uma entrada
          if (!agrupado[sala]) {
            agrupado[sala] = [];
          }
          
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
  }, [nome, hasAccess, accessLoading]);

  // Loading de autenticação
  if (status === "loading" || accessLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-lg">Verificando permissões...</div>
      </div>
    );
  }

  // Usuário não autenticado
  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
        <p className="text-gray-600 text-center">
          Você precisa estar autenticado para acessar relatórios.
        </p>
      </div>
    );
  }

  // Usuário não tem acesso ao inventário
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
        <p className="text-gray-600 text-center">
          Você não tem permissão para acessar este relatório.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  if (loading) return <p>Carregando relatório...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Relatório Geral</h2>
      <h2>{nome}</h2>
      {Object.keys(itensPorSala).sort().map((sala) => (
        <div key={sala} style={{ marginBottom: "30px" }}>
          <h2>Sala: {sala}</h2>
          {itensPorSala[sala].length === 0 ? (
            <div
              style={{
                padding: "20px",
                border: "1px solid #ddd",
                backgroundColor: "#f8f9fa",
                color: "#6c757d",
                textAlign: "center",
                fontStyle: "italic",
                borderRadius: "5px"
              }}
            >
              📦 Nenhum item encontrado nesta sala
            </div>
          ) : (
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
                    borderRadius: "5px"
                  }}
                >
                  <strong>Número:</strong> {item.numero} <br />
                  <strong>Descrição:</strong> {item.descricao || "N/A"} <br />
                  <strong>Status:</strong>{" "}
                  {item.statusInventario || item.status || "N/A"} <br />
                  <strong>Inventariante:</strong>{" "}
                  {item.inventariante?.nome || item.inventariante || "N/A"} <br />
                  <strong>Data do Inventário:</strong>{" "}
                  {item.dataInventario
                    ? new Date(item.dataInventario).toLocaleDateString()
                    : "Não inventariado"}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
