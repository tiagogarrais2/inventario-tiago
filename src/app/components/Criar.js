import { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Button from "./Button";

// Colunas reconhecidas pelo sistema com seus níveis de importância
const MANDATORY_COLUMNS = ["NUMERO", "SALA", "CARGA ATUAL"];
const RECOMMENDED_COLUMNS = [
  "DESCRICAO",
  "STATUS",
  "ESTADO DE CONSERVAÇÃO",
  "VALOR DEPRECIADO",
  "VALOR AQUISIÇÃO",
];
const OPTIONAL_COLUMNS = [
  "ED",
  "CONTA CONTABIL",
  "RÓTULOS",
  "SETOR DO RESPONSÁVEL",
  "CAMPUS DA CARGA",
  "CARGA CONTÁBIL",
  "NUMERO NOTA FISCAL",
  "NÚMERO DE SÉRIE",
  "DATA DA ENTRADA",
  "DATA DA CARGA",
  "FORNECEDOR",
];

const SIG_SIPAC_COLUMN_MAP = {
  tombamento: "NUMERO",
  localidade: "SALA",
  responsavel: "CARGA ATUAL",
  denominacao: "DESCRICAO",
  status: "STATUS",
  estado: "ESTADO DE CONSERVAÇÃO",
  "valor atual": "VALOR DEPRECIADO",
  "valor de entrada": "VALOR AQUISIÇÃO",
  "unidade responsavel": "SETOR DO RESPONSÁVEL",
  "data de tombamento": "DATA DA CARGA",
};

function normalizeColumnName(header) {
  return header
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/["']/g, "")
    .replace(/\s+/g, " ");
}

function detectSigSipacColumnMapping(columns) {
  const normalizedToOriginal = columns.reduce((acc, column) => {
    acc[normalizeColumnName(column)] = column;
    return acc;
  }, {});

  const mapping = {};
  for (const [sigName, targetColumn] of Object.entries(SIG_SIPAC_COLUMN_MAP)) {
    const originalColumn = normalizedToOriginal[sigName];
    if (!originalColumn) {
      return null;
    }
    mapping[originalColumn] = targetColumn;
  }

  return mapping;
}

function parseCSVHeaders(text) {
  const firstLine = text.split(/\r?\n/)[0];
  const headers = [];
  let current = "";
  let inQuotes = false;
  for (const ch of firstLine) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      headers.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) headers.push(current.trim());
  return headers.filter(Boolean);
}

function extractFileColumns(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const fileName = file.name.toLowerCase();
        let columns = [];
        if (fileName.endsWith(".json")) {
          const parsed = JSON.parse(content);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          if (arr.length > 0) columns = Object.keys(arr[0]);
        } else if (fileName.endsWith(".csv")) {
          columns = parseCSVHeaders(content);
        }
        resolve(columns);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsText(file, "utf-8");
  });
}

const BADGE_STYLES = {
  mandatory: "bg-red-100 text-red-700 border border-red-300",
  recommended: "bg-orange-100 text-orange-700 border border-orange-300",
  optional: "bg-gray-100 text-gray-600 border border-gray-300",
};
const BADGE_LABELS = {
  mandatory: "Obrigatória",
  recommended: "Recomendada",
  optional: "Opcional",
};

export default function Criar({ onUploadConcluido }) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(null);

  // Mapeamento de colunas
  const [step, setStep] = useState("idle"); // idle | analyzing | mapping | ready
  const [fileColumns, setFileColumns] = useState([]);
  // { "SALA": { type: "mandatory"|"recommended"|"optional", selectedFileCol: "" | "__none__" } }
  const [pendingMappings, setPendingMappings] = useState({});
  // { "Ambiente": "SALA" } — fileCol → sysCol, enviado ao servidor
  const [confirmedMapping, setConfirmedMapping] = useState({});

  const fileInputRef = useRef();
  const eventSourceRef = useRef();
  const sessionIdRef = useRef();

  // Captura automaticamente o nome do usuário logado
  const responsavel =
    session?.user?.name || session?.user?.email || "Usuário não identificado";

  // Lê os cabeçalhos do arquivo ao selecioná-lo e detecta se mapeamento é necessário
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setStep("idle");
      setFileColumns([]);
      setPendingMappings({});
      setConfirmedMapping({});
      setMessage("");
      return;
    }

    setStep("analyzing");
    setMessage("");

    try {
      const columns = await extractFileColumns(file);
      setFileColumns(columns);

      const sigSipacMapping = detectSigSipacColumnMapping(columns);
      if (sigSipacMapping) {
        setPendingMappings({});
        setConfirmedMapping(sigSipacMapping);
        setMessage(
          "Arquivo reconhecido como SIG-SIPAC e mapeado automaticamente.",
        );
        setStep("ready");
        return;
      }

      const missing = {};
      for (const col of MANDATORY_COLUMNS) {
        if (!columns.includes(col)) {
          missing[col] = { type: "mandatory", selectedFileCol: "" };
        }
      }
      for (const col of RECOMMENDED_COLUMNS) {
        if (!columns.includes(col)) {
          missing[col] = { type: "recommended", selectedFileCol: "" };
        }
      }
      for (const col of OPTIONAL_COLUMNS) {
        if (!columns.includes(col)) {
          missing[col] = { type: "optional", selectedFileCol: "__none__" };
        }
      }

      setPendingMappings(missing);
      setConfirmedMapping({});

      if (Object.keys(missing).length > 0) {
        setStep("mapping");
      } else {
        setStep("ready");
      }
    } catch {
      setMessage(
        "Não foi possível ler os cabeçalhos do arquivo. Verifique o formato.",
      );
      setStep("idle");
    }
  };

  // Verifica se todas as obrigatórias e recomendadas estão mapeadas
  const canConfirmMapping = Object.entries(pendingMappings).every(
    ([, { type, selectedFileCol }]) => {
      if (type === "mandatory" || type === "recommended") {
        return (
          selectedFileCol &&
          selectedFileCol !== "" &&
          selectedFileCol !== "__none__"
        );
      }
      return true;
    },
  );

  const unmappedRequired = Object.entries(pendingMappings)
    .filter(
      ([, { type, selectedFileCol }]) =>
        (type === "mandatory" || type === "recommended") &&
        (!selectedFileCol ||
          selectedFileCol === "" ||
          selectedFileCol === "__none__"),
    )
    .map(([sysCol]) => sysCol);

  const handleConfirmMapping = () => {
    const mapping = {};
    for (const [sysCol, { selectedFileCol }] of Object.entries(
      pendingMappings,
    )) {
      if (selectedFileCol && selectedFileCol !== "__none__") {
        mapping[selectedFileCol] = sysCol; // fileCol → sysCol
      }
    }
    setConfirmedMapping(mapping);
    setStep("ready");
  };

  // Colunas do arquivo já em uso em outro mapeamento (não reutilizar)
  const usedFileColumns = (excludeSysCol) =>
    Object.entries(pendingMappings)
      .filter(
        ([sc, { selectedFileCol }]) =>
          sc !== excludeSysCol &&
          selectedFileCol &&
          selectedFileCol !== "__none__",
      )
      .map(([, { selectedFileCol }]) => selectedFileCol);

  // Colunas do arquivo que já existem com nome exato no sistema (para resumo verde)
  const foundColumns = [
    ...MANDATORY_COLUMNS,
    ...RECOMMENDED_COLUMNS,
    ...OPTIONAL_COLUMNS,
  ].filter((col) => fileColumns.includes(col));

  // Função para conectar ao SSE
  const connectToProgress = (sessionId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(
      `/api/upload/progress?sessionId=${sessionId}`,
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
        prev ? { ...prev, error: "Conexão perdida" } : null,
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

    // Inclui mapeamento de colunas se houver
    if (Object.keys(confirmedMapping).length > 0) {
      formData.append("columnMapping", JSON.stringify(confirmedMapping));
    }

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

        // Limpa o campo de arquivo e estado de mapeamento
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setStep("idle");
        setFileColumns([]);
        setPendingMappings({});
        setConfirmedMapping({});

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
          Você quer criar o seu próprio inventário?
        </h2>
        <form encType="multipart/form-data">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsável pelo envio:
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
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Indicador de análise */}
          {step === "analyzing" && (
            <p className="text-sm text-gray-500 mb-3">
              Analisando colunas do arquivo...
            </p>
          )}

          {/* UI de mapeamento de colunas */}
          {step === "mapping" && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
              <h3 className="text-sm font-semibold text-amber-800 mb-3">
                🔀 Mapeamento de Colunas Necessário
              </h3>

              {/* Resumo das colunas encontradas corretamente */}
              {foundColumns.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-green-700 mb-1">
                    ✓ Colunas encontradas com nome correto (
                    {foundColumns.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {foundColumns.map((col) => (
                      <span
                        key={col}
                        className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 border border-green-300"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Colunas que precisam de mapeamento */}
              <div className="space-y-3">
                {Object.entries(pendingMappings).map(
                  ([sysCol, { type, selectedFileCol }]) => {
                    const unavailable = usedFileColumns(sysCol);
                    return (
                      <div
                        key={sysCol}
                        className="bg-white border border-gray-200 rounded p-3"
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${BADGE_STYLES[type]}`}
                          >
                            {BADGE_LABELS[type]}
                          </span>
                          <p className="text-sm text-gray-700">
                            Esperávamos a coluna{" "}
                            <strong>&quot;{sysCol}&quot;</strong>, mas ela não
                            foi encontrada no arquivo. Qual coluna corresponde?
                          </p>
                        </div>
                        <select
                          value={selectedFileCol}
                          onChange={(e) =>
                            setPendingMappings((prev) => ({
                              ...prev,
                              [sysCol]: {
                                ...prev[sysCol],
                                selectedFileCol: e.target.value,
                              },
                            }))
                          }
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          {/* Opção vazia apenas para mandatory/recommended (forçar escolha) */}
                          {(type === "mandatory" || type === "recommended") && (
                            <option value="">-- Selecione uma coluna --</option>
                          )}
                          {/* Opção "nenhum" apenas para optional */}
                          {type === "optional" && (
                            <option value="__none__">
                              Nenhum dado correspondente
                            </option>
                          )}
                          {fileColumns
                            .filter((fc) => !unavailable.includes(fc))
                            .map((fc) => (
                              <option key={fc} value={fc}>
                                {fc}
                              </option>
                            ))}
                        </select>
                      </div>
                    );
                  },
                )}
              </div>

              {/* Aviso de campos faltantes */}
              {unmappedRequired.length > 0 && (
                <p className="mt-3 text-xs text-red-600">
                  ⚠ Mapeie as colunas obrigatórias/recomendadas para continuar:{" "}
                  <strong>{unmappedRequired.join(", ")}</strong>
                </p>
              )}

              <button
                type="button"
                onClick={handleConfirmMapping}
                disabled={!canConfirmMapping}
                className={`mt-4 px-4 py-2 rounded text-sm font-semibold transition-colors ${
                  canConfirmMapping
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Confirmar Mapeamento
              </button>
            </div>
          )}

          {/* Resumo do mapeamento confirmado */}
          {step === "ready" && Object.keys(confirmedMapping).length > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded-lg">
              <p className="text-xs font-semibold text-green-700 mb-2">
                ✓ Mapeamento confirmado:
              </p>
              <ul className="text-xs text-green-700 space-y-0.5">
                {Object.entries(confirmedMapping).map(([fileCol, sysCol]) => (
                  <li key={fileCol}>
                    <span className="font-medium">&quot;{fileCol}&quot;</span> →
                    &quot;{sysCol}&quot;
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            type="submit"
            onClick={handleUpload}
            disabled={isUploading || step === "mapping" || step === "analyzing"}
          >
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
