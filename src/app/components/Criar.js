import { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Button from "./Button";

export default function Criar({ onUploadConcluido }) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const fileInputRef = useRef();
  const eventSourceRef = useRef();
  const sessionIdRef = useRef();

  // Captura automaticamente o nome do usuário logado
  const responsavel =
    session?.user?.name || session?.user?.email || "Usuário não identificado";

  // Função para conectar ao SSE
  const connectToProgress = (sessionId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(
      `/api/upload/progress?sessionId=${sessionId}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setProgress(data);

        if (data.type === "completed" || data.type === "error") {
          // Upload concluído ou erro, fechar conexão
          setTimeout(() => {
            eventSource.close();
            eventSourceRef.current = null;
          }, 2000);
        }
      } catch (error) {
        console.error("Erro ao processar mensagem SSE:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("Erro na conexão SSE:", error);
      setProgress((prev) =>
        prev ? { ...prev, error: "Conexão perdida" } : null
      );
    };
  };

  // Função para desconectar do SSE
  const disconnectFromProgress = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setProgress(null);
  };

  // Cleanup na desmontagem do componente
  useEffect(() => {
    return () => {
      disconnectFromProgress();
    };
  }, []);

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

    // Gerar sessionId único para este upload
    const sessionId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionIdRef.current = sessionId;

    setIsUploading(true);
    setMessage("");
    setProgress(null);

    // Conectar ao SSE antes de iniciar o upload
    connectToProgress(sessionId);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("responsavel", responsavel);
    formData.append("sessionId", sessionId);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        const nomeInventario =
          result.inventario?.nome || file.name.replace(/\.(json|csv)$/i, "");

        setMessage("Arquivo enviado com sucesso!");

        // Limpa o campo de arquivo
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        // Chama a função de atualização passando o nome do novo inventário
        if (onUploadConcluido) onUploadConcluido(nomeInventario);
      } else {
        const errorData = await res.json();
        setMessage(errorData.error || "Falha ao enviar arquivo.");
      }
    } catch (error) {
      setMessage("Erro de rede. Tente novamente.");
      console.error("Erro no upload:", error);
    } finally {
      setIsUploading(false);
      // Manter a conexão SSE por mais alguns segundos para mostrar o resultado final
      setTimeout(() => {
        disconnectFromProgress();
      }, 3000);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Criar um novo inventário
        </h2>
        <form encType="multipart/form-data">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servidor(a) responsável pelo envio:
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={responsavel}
                disabled
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

          <Button type="submit" onClick={handleUpload} disabled={isUploading}>
            {isUploading ? "Enviando..." : "Enviar Arquivo"}
          </Button>
        </form>

        {/* Barra de Progresso */}
        {progress && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">
                Progresso do Upload
              </h3>
              {progress.type === "completed" && (
                <span className="text-green-600 text-sm font-medium">
                  ✓ Concluído
                </span>
              )}
              {progress.type === "error" && (
                <span className="text-red-600 text-sm font-medium">✗ Erro</span>
              )}
            </div>

            {progress.total > 0 && progress.type !== "error" && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress.type === "completed"
                      ? "bg-green-500"
                      : "bg-blue-500"
                  }`}
                  style={{
                    width: `${Math.min((progress.progress / progress.total) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            )}

            <p className="text-sm text-gray-600 mb-2">{progress.message}</p>

            {progress.stats && (
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div>Registros: {progress.stats.registros || 0}</div>
                <div>Salas: {progress.stats.salas || 0}</div>
                <div>Servidores: {progress.stats.servidores || 0}</div>
                <div>Erros: {progress.stats.erros || 0}</div>
              </div>
            )}

            {progress.error && (
              <p className="text-sm text-red-600 mt-2">
                Erro: {progress.error}
              </p>
            )}
          </div>
        )}

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
