import { useRef, useState } from "react";
import { useSession } from "next-auth/react";

export default function Criar({ onUploadConcluido }) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const fileInputRef = useRef();

  // Captura automaticamente o nome do usuário logado
  const responsavel =
    session?.user?.name || session?.user?.email || "Usuário não identificado";

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current.files[0];
    if (!file) {
      setMessage("Selecione um arquivo .json ou .csv.");
      return;
    }

    if (!responsavel || responsavel === "Usuário não identificado") {
      setMessage("Erro: Usuário não autenticado. Faça login para continuar.");
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Criar um novo inventário
        </h2>
        <form onSubmit={handleUpload} encType="multipart/form-data">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servidor(a) responsável pelo envio:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={responsavel}
                disabled
                className="bg-gray-100 border border-gray-300 text-gray-700 py-2 px-3 rounded cursor-not-allowed flex-1"
                title="Nome capturado automaticamente do usuário logado"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione um arquivo .json ou .csv:
            </label>
            <input
              type="file"
              accept=".json,.csv"
              ref={fileInputRef}
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Enviar Arquivo
          </button>
        </form>
        {message && (
          <div
            className={`mt-4 p-3 rounded ${
              message.includes("sucesso")
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
