"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function Cadastrar() {
  const searchParams = useSearchParams();
  
  // Estados para gerenciar os dados do formulário
  const [formData, setFormData] = useState({
    numero: "",
    descricao: "",
    responsavel: "",
    // Adicione outros campos aqui conforme a sua necessidade
  });

  // Preenche o formulário com o número passado na URL ao carregar a página
  useEffect(() => {
    const numero = searchParams.get("numero");
    if (numero) {
      setFormData((prevData) => ({
        ...prevData,
        numero,
      }));
    }
  }, [searchParams]);

  // Função para lidar com a mudança nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Dados a serem cadastrados:", formData);
    
    // Aqui você faria a chamada para a sua API
    // Exemplo: const res = await fetch("/api/cadastrar", {
    //   method: "POST",
    //   body: JSON.stringify(formData),
    // });
    
    // Lógica para lidar com a resposta da API (sucesso/erro)
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Cadastrar Item de Inventário</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="numero">Número do Tombo:</label>
          <input
            type="text"
            id="numero"
            name="numero"
            value={formData.numero}
            onChange={handleChange}
            readOnly // Torna o campo somente leitura para evitar que seja alterado
            style={{ marginLeft: "10px", padding: "5px" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="descricao">Descrição:</label>
          <input
            type="text"
            id="descricao"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            style={{ marginLeft: "10px", padding: "5px" }}
          />
        </div>
        <div style={{ marginBottom: "15px" }}>
          <label htmlFor="responsavel">Pessoa Responsável:</label>
          <input
            type="text"
            id="responsavel"
            name="responsavel"
            value={formData.responsavel}
            onChange={handleChange}
            style={{ marginLeft: "10px", padding: "5px" }}
          />
        </div>
        
        {/* Adicione outros campos de input aqui para o seu formulário */}
        
        <button type="submit" style={{ padding: "10px 20px" }}>
          Salvar Cadastro
        </button>
      </form>
    </div>
  );
}