"use client"
import { useRef, useState, useEffect } from "react";
import Executar from "./components/Executar";

export default function Home() {
  const [message, setMessage] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [inventarios, setInventarios] = useState([]);
  const [selectedInventario, setSelectedInventario] = useState(null);
  const fileInputRef = useRef();

  // Carrega lista de inventários enviados
  useEffect(() => {
    fetch("/api/inventarios")
      .then(res => res.json())
      .then(setInventarios)
      .catch(() => setInventarios([]));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (!file || !responsavel) {
      setMessage("Preencha o nome do responsável e selecione um arquivo .json.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("responsavel", responsavel);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setMessage("Arquivo enviado com sucesso!");
    } else {
      setMessage("Falha ao enviar arquivo.");
    }
  };

  const handleInventarioClick = (nome) => {
    setSelectedInventario(nome);
  };

  return (
    <div>
      <div>
        <h2>Criar um inventário</h2>
        <form onSubmit={handleUpload} encType="multipart/form-data">
          <label>
            Nome da pessoa responsável:
            <input
              type="text"
              value={responsavel}
              onChange={e => setResponsavel(e.target.value)}
              required
            />
          </label>

          <label>
            Selecione um arquivo .json:
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              required
            />
          </label>

          <button type="submit">Enviar</button>
        </form>
        {message && <p>{message}</p>}
      </div>

      <Executar/>

      <div>
        <h2>Inventários recebidos</h2>
        <ul>
          {inventarios.length === 0 && <li>Nenhum inventário disponível.</li>}
          {inventarios.map(nome => (
            <li key={nome}>
              <li>
                {nome}
              </li>
            </li>
          ))}
        </ul>
    
      </div>
    </div>
  );
}
