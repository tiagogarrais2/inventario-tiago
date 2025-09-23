"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
  "Ativo",
  "Baixado",
  "Em Uso",
  "Ocioso",
  "Em Manutenção",
  "Recuperável",
  "Em Desfazimento",
  "Extraviado/Desaparecido",
];

export default function Cadastrar() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [cabecalho, setCabecalho] = useState(null);
  const [salasOptions, setSalasOptions] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFormFields() {
      const nome = searchParams.get("nome");
      const numero = searchParams.get("numero");

      if (!nome) {
        setError("Parâmetro 'nome' ausente na URL.");
        setIsLoading(false);
        return;
      }

      try {
        const [cabecalhoRes, salasRes] = await Promise.all([
          fetch(`/${nome}/cabecalhos.json`),
          fetch(`/${nome}/salas.json`),
        ]);

        if (!cabecalhoRes.ok) {
          throw new Error("Arquivo de cabeçalho não encontrado.");
        }
        if (!salasRes.ok) {
          throw new Error("Arquivo de salas não encontrado ou inválido.");
        }

        let cabecalhoData = await cabecalhoRes.json();
        const salasData = await salasRes.json();

        cabecalhoData = [
          "DATA DO INVENTARIO",
          "SERVIDOR(A) INVENTARIANTE",
          ...cabecalhoData,
        ];

        salasData.sort();

        const initialData = {};
        cabecalhoData.forEach((field) => {
          initialData[field] = "";
        });

        const today = new Date().toISOString().split("T")[0];
        initialData["DATA DO INVENTARIO"] = today;

        if (numero) {
          initialData["NUMERO"] = numero;
        }

        setCabecalho(cabecalhoData);
        setSalasOptions(salasData);
        setFormData(initialData);
      } catch (e) {
        console.error("Erro ao carregar dados do formulário:", e);
        setError("Erro ao carregar o formulário. Por favor, tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFormFields();
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nome = searchParams.get("nome");

    try {
      const res = await fetch('/api/add-inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, ...formData }),
      });

      if (res.ok) {
        alert("Item cadastrado com sucesso!");
        router.push(`/inventario/${nome}`); // Redireciona de volta
      } else {
        alert("Erro ao cadastrar.");
      }
    } catch (error) {
      alert("Erro ao cadastrar.");
    }
  };

  if (isLoading) {
    return <div style={{ padding: "20px" }}>Carregando formulário...</div>;
  }

  if (error) {
    return <div style={{ padding: "20px", color: "red" }}>{error}</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Cadastrar Item de Inventário</h1>
      <form onSubmit={handleSubmit}>
        {cabecalho?.map((fieldName) => {
          if (fieldName === "#") {
            return null;
          }

          const isNumero = fieldName === "NUMERO";
          const isEstadoConservacao = fieldName === "ESTADO DE CONSERVAÇÃO";
          const isSalaField = fieldName === "SALA";
          const isDataInventario = fieldName === "DATA DO INVENTARIO";
          const isServidorInventariante =
            fieldName === "SERVIDOR(A) INVENTARIANTE";
          const isStatusField = fieldName === "STATUS";

          return (
            <div key={fieldName} style={{ marginBottom: "15px" }}>
              <label htmlFor={fieldName}>{fieldName}:</label>
              {isEstadoConservacao ? (
                <select
                  id={fieldName}
                  name={fieldName}
                  value={formData[fieldName] || ""}
                  onChange={handleChange}
                  required
                  style={{ marginLeft: "10px", padding: "5px" }}
                >
                  <option value="">Selecione uma opção</option>
                  {ESTADOS_CONSERVACAO.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              ) : isSalaField ? (
                <select
                  id={fieldName}
                  name={fieldName}
                  value={formData[fieldName] || ""}
                  onChange={handleChange}
                  required
                  style={{ marginLeft: "10px", padding: "5px" }}
                >
                  <option value="">Selecione uma sala</option>
                  {salasOptions.map((sala) => (
                    <option key={sala} value={sala}>
                      {sala}
                    </option>
                  ))}
                </select>
              ) : isDataInventario ? (
                <input
                  type="date"
                  id={fieldName}
                  name={fieldName}
                  value={formData[fieldName] || ""}
                  onChange={handleChange}
                  readOnly
                  required
                  style={{ marginLeft: "10px", padding: "5px" }}
                />
              ) : isServidorInventariante ? (
                <input
                  type="text"
                  id={fieldName}
                  name={fieldName}
                  value={formData[fieldName] || ""}
                  onChange={handleChange}
                  required
                  style={{ marginLeft: "10px", padding: "5px" }}
                />
              ) : isStatusField ? (
                <select
                  id={fieldName}
                  name={fieldName}
                  value={formData[fieldName] || ""}
                  onChange={handleChange}
                  required
                  style={{ marginLeft: "10px", padding: "5px" }}
                >
                  <option value="">Selecione um status</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  id={fieldName}
                  name={fieldName}
                  value={formData[fieldName] || ""}
                  onChange={handleChange}
                  readOnly={isNumero}
                  style={{ marginLeft: "10px", padding: "5px" }}
                />
              )}
            </div>
          );
        })}
        <button type="submit" style={{ padding: "10px 20px" }}>
          Salvar Cadastro
        </button>
      </form>
    </div>
  );
}
