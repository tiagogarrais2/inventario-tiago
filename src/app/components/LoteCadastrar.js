"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "./Button";
import { useNotifications } from "./Notifications";

// Lista fixa de estados de conservação
const ESTADOS_CONSERVACAO = [
  "Bom",
  "Regular",
  "Ocioso",
  "Recuperável",
  "Antieconômico",
];

// Lista fixa de status
const STATUS_OPTIONS = [
  "Em Uso",
  "Ativo",
  "Baixado",
  "Ocioso",
  "Em Manutenção",
  "Recuperável",
  "Em Desfazimento",
  "Extraviado/Desaparecido",
];

export default function LoteCadastrar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showSuccess, showError } = useNotifications();

  const [salasOptions, setSalasOptions] = useState([]);
  const [servidoresOptions, setServidoresOptions] = useState([]);
  const [numeros, setNumeros] = useState([""]); // Lista de números, começando com um vazio
  const [formData, setFormData] = useState({
    "DATA DO INVENTARIO": "",
    "SERVIDOR(A) INVENTARIANTE": "",
    STATUS: "",
    DESCRICAO: "",
    "CARGA ATUAL": "",
    SALA: "",
    "ESTADO DE CONSERVAÇÃO": "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState([]); // Para rastrear o status de cada envio
  const [finalMessages, setFinalMessages] = useState([]); // Mensagens finais persistentes

  useEffect(() => {
    async function fetchData() {
      const nome = searchParams.get("nome");

      if (!nome) {
        setError("Parâmetro 'nome' ausente na URL.");
        setIsLoading(false);
        return;
      }

      try {
        const [salasRes, servidoresRes] = await Promise.all([
          fetch(`/api/salas?inventario=${encodeURIComponent(nome)}`),
          fetch(`/api/servidores?inventario=${encodeURIComponent(nome)}`),
        ]);

        if (!salasRes.ok || !servidoresRes.ok) {
          throw new Error("Erro ao carregar salas ou servidores.");
        }

        const salasData = await salasRes.json();
        const servidoresData = await servidoresRes.json();

        salasData.sort();
        servidoresData.sort();

        setSalasOptions(salasData);
        setServidoresOptions(servidoresData);

        // Preencher campos padrão
        const today = new Date().toISOString().split("T")[0];
        setFormData((prev) => ({
          ...prev,
          "DATA DO INVENTARIO": today,
          "SERVIDOR(A) INVENTARIANTE": session?.user?.name || "",
        }));
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
        setError("Erro ao carregar o formulário.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [searchParams, session]);

  const handleNumeroChange = (index, value) => {
    const newNumeros = [...numeros];
    newNumeros[index] = value;
    setNumeros(newNumeros);
  };

  const addNumero = () => {
    setNumeros([...numeros, ""]);
  };

  const removeNumero = (index) => {
    if (numeros.length > 1) {
      const newNumeros = numeros.filter((_, i) => i !== index);
      setNumeros(newNumeros);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nome = searchParams.get("nome");

    // Filtrar números válidos (não vazios)
    const validNumeros = numeros.filter((num) => num.trim() !== "");
    if (validNumeros.length === 0) {
      showError("Adicione pelo menos um número válido.");
      return;
    }

    // Validar campos obrigatórios
    const requiredFields = [
      "DATA DO INVENTARIO",
      "SERVIDOR(A) INVENTARIANTE",
      "STATUS",
      "DESCRICAO",
      "CARGA ATUAL",
      "SALA",
      "ESTADO DE CONSERVAÇÃO",
    ];
    const missing = requiredFields.filter((field) => !formData[field]?.trim());
    if (missing.length > 0) {
      showError(`Campos obrigatórios faltando: ${missing.join(", ")}`);
      return;
    }

    setIsSubmitting(true);
    setProgress([]);

    for (let i = 0; i < validNumeros.length; i++) {
      const numero = validNumeros[i];
      const itemData = {
        NUMERO: numero,
        ...formData,
      };

      try {
        const response = await fetch("/api/add-inventario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, ...itemData }),
        });

        const result = await response.json();
        if (response.ok) {
          setProgress((prev) => [
            ...prev,
            `✅ Item ${numero} cadastrado com sucesso.`,
          ]);
          setFinalMessages((prev) => [
            ...prev,
            `✅ Item ${numero} cadastrado com sucesso.`,
          ]);
        } else {
          setProgress((prev) => [
            ...prev,
            `❌ Erro no item ${numero}: ${result.error}`,
          ]);
          setFinalMessages((prev) => [
            ...prev,
            `❌ Erro no item ${numero}: ${result.error}`,
          ]);
        }
      } catch (err) {
        setProgress((prev) => [...prev, `❌ Erro de rede no item ${numero}.`]);
        setFinalMessages((prev) => [
          ...prev,
          `❌ Erro de rede no item ${numero}.`,
        ]);
      }

      // Aguardar 4 segundos antes do próximo, exceto no último
      if (i < validNumeros.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
    }

    setIsSubmitting(false);

    // Resetar campos após envio
    setNumeros([""]);
    setFormData({
      "DATA DO INVENTARIO": new Date().toISOString().split("T")[0],
      "SERVIDOR(A) INVENTARIANTE": session?.user?.name || "",
      STATUS: "",
      DESCRICAO: "",
      "CARGA ATUAL": "",
      SALA: "",
      "ESTADO DE CONSERVAÇÃO": "",
    });
    setProgress([]);
  };

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <h2>Cadastro em Lote</h2>
      <div style={{ marginBottom: "20px", fontSize: "14px", color: "#555" }}>
        <p>
          <strong>Atenção:</strong>
        </p>
        <ul>
          <li>
            Esta funcionalidade deve ser utilizada para cadastrar itens iguais
            que não foram encontrados durante o inventário. Exemplo: carteiras
            escolares idênticas, na mesma sala e que estão nas mesmas condições
            de conservação.
          </li>
          <li>Utilize o botão "+" para adicionar mais tombos de uma vez.</li>
          <li>
            Após o envio, cada item será cadastrado individualmente com um
            intervalo de 4 segundos entre eles para evitar sobrecarga no
            sistema.
          </li>
          <li>
            O sistema emitirá mensagens de sucesso ou erro para cada item
            cadastrado no final da página.
          </li>
        </ul>
      </div>
      <form onSubmit={handleSubmit}>
        {/* Campos de números */}
        <div>
          <label>Números (Tombos):</label>
          {numeros.map((num, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "5px",
              }}
            >
              <input
                type="text"
                value={num}
                onChange={(e) => handleNumeroChange(index, e.target.value)}
                placeholder="Digite o número"
                required
              />
              {numeros.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeNumero(index)}
                  style={{ marginLeft: "5px" }}
                >
                  -
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addNumero}>
            +
          </button>
        </div>

        {/* Campos comuns */}
        <div>
          <label>Data do Inventário:</label>
          <input
            type="date"
            name="DATA DO INVENTARIO"
            value={formData["DATA DO INVENTARIO"]}
            onChange={handleChange}
            required
            readOnly
          />
        </div>
        <div>
          <label>Servidor(a) Inventariante:</label>
          <select
            name="SERVIDOR(A) INVENTARIANTE"
            value={formData["SERVIDOR(A) INVENTARIANTE"]}
            onChange={handleChange}
            required
          >
            <option value="">Selecione</option>
            {servidoresOptions.map((serv) => (
              <option key={serv} value={serv}>
                {serv}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Status:</label>
          <select
            name="STATUS"
            value={formData.STATUS}
            onChange={handleChange}
            required
          >
            <option value="">Selecione</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Descrição:</label>
          <input
            type="text"
            name="DESCRICAO"
            value={formData.DESCRICAO}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Carga Atual:</label>
          <select
            name="CARGA ATUAL"
            value={formData["CARGA ATUAL"]}
            onChange={handleChange}
            required
          >
            <option value="">Selecione</option>
            {servidoresOptions.map((serv) => (
              <option key={serv} value={serv}>
                {serv}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Sala:</label>
          <select
            name="SALA"
            value={formData.SALA}
            onChange={handleChange}
            required
          >
            <option value="">Selecione</option>
            {salasOptions.map((sala) => (
              <option key={sala} value={sala}>
                {sala}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Estado de Conservação:</label>
          <select
            name="ESTADO DE CONSERVAÇÃO"
            value={formData["ESTADO DE CONSERVAÇÃO"]}
            onChange={handleChange}
            required
          >
            <option value="">Selecione</option>
            {ESTADOS_CONSERVACAO.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar Lote"}
        </Button>
      </form>

      {/* Mensagens Finais */}
      {finalMessages.length > 0 && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          <h3>Mensagens:</h3>
          <ul>
            {finalMessages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
