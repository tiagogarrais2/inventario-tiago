"use client";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Listar from "./components/Listar";
import Criar from "./components/Criar";

export default function Home() {
  const { data: session, status } = useSession();
  const [atualizar, setAtualizar] = useState(false);

  function handleUploadConcluido() {
    setAtualizar((a) => !a); // Alterna o valor para forçar atualização
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">📋 Sistema de Inventário</h1>
        <p className="text-gray-600 text-center max-w-md">
          Sistema completo para gerenciamento de inventários com autenticação, 
          controle de acesso e relatórios em tempo real.
        </p>
        
        {/* Seção de Teste */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">
            🧪 Teste o Sistema
          </h2>
          <p className="text-sm text-blue-700 mb-4">
            Baixe um arquivo de exemplo para testar o upload de inventários:
          </p>
          <div className="space-y-3">
            <a
              href="/exemplo-json/inventario.json"
              download="exemplo-inventario.json"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition duration-200"
            >
              📥 Baixar Exemplo JSON
            </a>
            <p className="text-xs text-blue-600">
              * Arquivo contém dados fictícios para demonstração
            </p>
          </div>
        </div>

        {/* Seção de Login */}
        <div className="text-center">
          <p className="text-gray-600 mb-2">
            Pronto para começar?
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Use o botão &quot;Entrar com Google&quot; no cabeçalho para fazer login.
          </p>
        </div>

        {/* Links de Documentação */}
        <div className="flex flex-col sm:flex-row gap-4 text-sm">
          <a
            href="https://github.com/tiagogarrais/inventario-tiago/blob/master/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium underline"
          >
            👨‍💻 Documentação Técnica
          </a>
          <a
            href="https://github.com/tiagogarrais/inventario-tiago/blob/master/README-USUARIOS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-green-600 hover:text-green-800 font-medium underline"
          >
            👥 Guia do Usuário
          </a>
        </div>
      </div>
    );
  }

  // Authenticated - show the main content
  return (
    <div>
      <Listar atualizar={atualizar} />
      <hr />
      <Criar onUploadConcluido={handleUploadConcluido} />
    </div>
  );
}
