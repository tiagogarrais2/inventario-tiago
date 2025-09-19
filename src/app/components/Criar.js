import { useRef, useState } from "react";

export default function Criar({ onUploadConcluido }) {
  const [message, setMessage] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const fileInputRef = useRef();

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (!file || !responsavel) {
      setMessage(
        "Preencha o nome do responsável e selecione um arquivo .json."
      );
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
      if (onUploadConcluido) onUploadConcluido(); // Chama a função de atualização
    } else {
      setMessage("Falha ao enviar arquivo.");
    }
  };

  return (
    <div>
      <div>
        <h2>Criar um inventário</h2>
        <form onSubmit={handleUpload} encType="multipart/form-data">
          <label>
            Nome do(a) Servidor(a) responsável pelo envio do arquivo:
            <input
              type="text"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              required
            />
          </label>
          <br />
          <label>
            Selecione um arquivo .json ou .csv:
            <input
              type="file"
              accept=".json,.csv"
              ref={fileInputRef}
              required
            />{" "}
          </label>

          <button type="submit">Enviar</button>
        </form>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}
