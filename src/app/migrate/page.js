"use client";
import { useState } from "react";
import Button from "../components/Button";
export default function MigratePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runMigration = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data);
      }
    } catch (err) {
      setError({ error: "Erro de rede", details: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Migração do Banco de Dados
          </h1>

          <p className="text-gray-600 mb-6">
            Execute as migrações do Prisma para criar as tabelas necessárias no
            banco de dados.
          </p>

          <Button
            onClick={runMigration}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Executando migrações..." : "Executar Migrações"}
          </Button>

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-green-800 font-medium">Sucesso!</h3>
              <p className="text-green-700 mt-1">{result.message}</p>
              {result.output && (
                <pre className="mt-2 text-xs text-green-600 overflow-x-auto">
                  {result.output}
                </pre>
              )}
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-800 font-medium">Erro</h3>
              <p className="text-red-700 mt-1">{error.error}</p>
              {error.details && (
                <pre className="mt-2 text-xs text-red-600 overflow-x-auto">
                  {error.details}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
