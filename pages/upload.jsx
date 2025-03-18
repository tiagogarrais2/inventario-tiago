import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Escolha um arquivo primeiro!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/upload/", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setMessage(data.message || "Erro no upload");
  };

  return (
    <div>
      <h1>Upload de Arquivo</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Enviar</button>
      {message && <p>{message}</p>}
    </div>
  );
}
