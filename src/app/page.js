"use client";
import { useState } from "react";
import Listar from "./components/Listar";
import Criar from "./components/Criar";

export default function Home() {
  const [atualizar, setAtualizar] = useState(false);

  function handleUploadConcluido() {
    setAtualizar((a) => !a); // Alterna o valor para forçar atualização
  }

  return (
    <div>
      <Listar atualizar={atualizar} />
      <hr />
      <Criar onUploadConcluido={handleUploadConcluido} />
    </div>
  );
}
