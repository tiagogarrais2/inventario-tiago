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
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
        <p className="text-gray-600 text-center">
          Você precisa estar autenticado para acessar o sistema de inventário.
        </p>
        <p className="text-sm text-gray-500">
          Use o botão &quot;Entrar com Google&quot; no cabeçalho para fazer
          login.
        </p>
        <div>
          <p className="text-sm text-blue-800 mb-2">
            📖 Quer saber mais sobre o sistema?
          </p>
          <a
            href="https://github.com/tiagogarrais/inventario-tiago/blob/master/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium underline"
          >
            Consulte a documentação no GitHub
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
