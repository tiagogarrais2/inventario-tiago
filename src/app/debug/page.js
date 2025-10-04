"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [inventarios, setInventarios] = useState([]);
  const [inventarioDetalhes, setInventarioDetalhes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      carregarInventarios();
    }
  }, [status]);

  const carregarInventarios = async () => {
    try {
      const response = await fetch("/api/listar");
      const data = await response.json();
      setInventarios(data.inventarios || []);

      // Buscar detalhes de cada inventário
      const detalhes = [];
      for (let inv of data.inventarios || []) {
        try {
          const salasResponse = await fetch(
            `/api/salas?inventario=${inv.nome}`
          );
          const salasData = await salasResponse.json();
          const quantidadeSalas = Array.isArray(salasData)
            ? salasData.length
            : 0;

          const itensResponse = await fetch(
            `/api/inventario?inventario=${inv.nome}`
          );
          const itensData = await itensResponse.json();
          const quantidadeItens = Array.isArray(itensData)
            ? itensData.length
            : 0;

          detalhes.push({
            ...inv,
            quantidadeSalas,
            quantidadeItens,
            temDados: quantidadeSalas > 0 || quantidadeItens > 0,
          });
        } catch (error) {
          detalhes.push({
            ...inv,
            quantidadeSalas: 0,
            quantidadeItens: 0,
            temDados: false,
            erro: error.message,
          });
        }
      }

      setInventarioDetalhes(detalhes);
    } catch (error) {
      console.error("Erro ao carregar inventários:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="p-8">Carregando...</div>;
  }

  if (status === "unauthenticated") {
    return <div className="p-8">Acesso negado. Faça login primeiro.</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Debug - Inventários</h1>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">ℹ️ Informações</h2>
        <p>
          Esta página mostra todos os inventários disponíveis e qual contém
          dados.
        </p>
        <p className="text-sm text-gray-600">
          Usuário: {session?.user?.email} | Total: {inventarioDetalhes.length}{" "}
          inventários
        </p>
      </div>

      <div className="grid gap-4">
        {inventarioDetalhes.map((inv, index) => (
          <div
            key={inv.nome}
            className={`p-4 rounded-lg border-2 ${
              inv.temDados
                ? "border-green-500 bg-green-50"
                : "border-red-300 bg-red-50"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {inv.temDados ? "✅" : "❌"} {inv.nomeExibicao}
                </h3>
                <p className="text-sm text-gray-600 font-mono">{inv.nome}</p>
              </div>
              <div className="text-right">
                <div className="text-sm">
                  📁 {inv.quantidadeSalas} salas | 📋 {inv.quantidadeItens}{" "}
                  itens
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(inv.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  inv.temDados
                    ? "bg-green-200 text-green-800"
                    : "bg-red-200 text-red-800"
                }`}
              >
                {inv.temDados ? "COM DADOS" : "VAZIO"}
              </span>

              <span className="px-2 py-1 rounded text-xs bg-blue-200 text-blue-800">
                Proprietário: {inv.proprietario}
              </span>
            </div>

            {inv.temDados && (
              <div className="mt-3 flex gap-2">
                <a
                  href={`/inventario/${inv.nome}`}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  📋 Ver Inventário
                </a>
                <a
                  href={`/relatorio/${inv.nome}`}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                >
                  📊 Ver Relatório
                </a>
              </div>
            )}

            {inv.erro && (
              <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
                Erro: {inv.erro}
              </div>
            )}
          </div>
        ))}
      </div>

      {inventarioDetalhes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum inventário encontrado.
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">🛠️ Ações</h3>
        <Button
          onClick={carregarInventarios}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          🔄 Recarregar
        </Button>
      </div>
    </div>
  );
}
