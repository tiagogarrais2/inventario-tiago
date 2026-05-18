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

export default function Cadastrar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { showSuccess, showError } = useNotifications();

  const [cabecalho, setCabecalho] = useState(null);
  const [salasOptions, setSalasOptions] = useState([]);
  const [servidoresOptions, setServidoresOptions] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCorrecao, setIsCorrecao] = useState(false);
  const [numeroOriginal, setNumeroOriginal] = useState(null);

  // Campos permitidos para correção (limitação solicitada)
  const CAMPOS_CORRECAO_PERMITIDOS = [
    "NUMERO",
    "STATUS",
    "DESCRICAO",
    "CARGA ATUAL",
    "SALA",
    "ESTADO DE CONSERVAÇÃO",
  ];

  useEffect(() => {
    async function fetchFormFields() {
      const nome = searchParams.get("nome");
      const numero = searchParams.get("numero");
      const sala = searchParams.get("sala");
      const correcao = searchParams.get("isCorrecao") === "true";
      const numeroOrig = searchParams.get("numeroOriginal");

      setIsCorrecao(correcao);
      setNumeroOriginal(numeroOrig);

      if (!nome) {
        setError("Parâmetro 'nome' ausente na URL.");
        setIsLoading(false);
        return;
      }

      try {
        const [cabecalhoRes, salasRes, servidoresRes] = await Promise.all([
          fetch(`/api/cabecalhos?inventario=${encodeURIComponent(nome)}`),
          fetch(`/api/salas?inventario=${encodeURIComponent(nome)}`),
          fetch(`/api/servidores?inventario=${encodeURIComponent(nome)}`),
        ]);

        if (!cabecalhoRes.ok) {
          const errorData = await cabecalhoRes.json();
          throw new Error(
            errorData.error || "Arquivo de cabeçalho não encontrado."
          );
        }
        if (!salasRes.ok) {
          const errorData = await salasRes.json();
          throw new Error(
            errorData.error || "Arquivo de salas não encontrado ou inválido."
          );
        }

        if (!servidoresRes.ok) {
          const errorData = await servidoresRes.json();
          throw new Error(
            errorData.error || "Lista de servidores não encontrada ou inválida."
          );
        }

        let cabecalhoData = await cabecalhoRes.json();
        const salasData = await salasRes.json();
        const servidoresData = await servidoresRes.json();

        cabecalhoData = [
          "DATA DO INVENTARIO",
          "SERVIDOR(A) INVENTARIANTE",
          ...cabecalhoData,
        ];

        salasData.sort();
        servidoresData.sort();

        const initialData = {};
        cabecalhoData.forEach((field) => {
          initialData[field] = "";
        });

        const today = new Date().toISOString().split("T")[0];
        initialData["DATA DO INVENTARIO"] = today;

        if (numero) {
          initialData["NUMERO"] = numero;
        }

        // Preenche automaticamente a sala quando vem do inventário
        if (sala) {
          initialData["SALA"] = sala;
        }

        // Preenche automaticamente com o nome do usuário logado
        if (session?.user?.name) {
          initialData["SERVIDOR(A) INVENTARIANTE"] = session.user.name;
        }

        // Se é correção, preenche todos os campos com os dados originais
        if (correcao) {
          const camposMapeamento = {
            status: "STATUS",
            ed: "ED",
            contaContabil: "CONTA CONTABIL",
            descricao: "DESCRICAO",
            rotulos: "RÓTULOS",
            cargaAtual: "CARGA ATUAL",
            setorResponsavel: "SETOR DO RESPONSÁVEL",
            campusCarga: "CAMPUS DA CARGA",
            cargaContabil: "CARGA CONTÁBIL",
            valorAquisicao: "VALOR AQUISIÇÃO",
            valorDepreciado: "VALOR DEPRECIADO",
            numeroNotaFiscal: "NUMERO NOTA FISCAL",
            numeroSerie: "NUMERO SERIE",
            dataEntrada: "DATA ENTRADA",
            dataCarga: "DATA CARGA",
            fornecedor: "FORNECEDOR",
            marca: "MARCA",
            modelo: "MODELO",
            setor: "SETOR",
            estadoConservacao: "ESTADO DE CONSERVAÇÃO",
          };

          Object.entries(camposMapeamento).forEach(([param, campo]) => {
            const valor = searchParams.get(param);
            if (valor && cabecalhoData.includes(campo)) {
              initialData[campo] = valor;
            }
          });
        }

        setCabecalho(cabecalhoData);
        setSalasOptions(salasData);
        setServidoresOptions(servidoresData);
        setFormData(initialData);
      } catch (e) {
        console.error("Erro ao carregar dados do formulário:", e);
        setError("Erro ao carregar o formulário. Por favor, tente novamente.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFormFields();
  }, [searchParams, session]);

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
      // Se é correção, usa endpoint específico para correções
      const endpoint = isCorrecao
        ? "/api/correcao-inventario"
        : "/api/add-inventario";
      const payload = isCorrecao
        ? { nome, numeroOriginal, ...formData }
        : { nome, ...formData };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const mensagem = isCorrecao
          ? `Última correção realizada: ${numeroOriginal}`
          : `Último cadastro realizado: ${formData["NUMERO"]}`;

        localStorage.setItem("notificacao", mensagem);

        // Verifica se veio da página de inventário dedicada
        const from = searchParams.get("from");
        const redirectPath =
          from === "inventariar"
            ? `/inventario/${nome}/inventariar`
            : `/inventario/${nome}`;

        router.push(redirectPath); // Redireciona de volta
      } else {
        showError("Erro ao cadastrar.");
      }
    } catch (error) {
      showError("Erro ao cadastrar.");
    }
  };

  // Verificação de autenticação
  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Verificando autenticação...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Acesso Restrito</h2>
        <p>Você precisa estar autenticado para cadastrar itens.</p>
        <Button
          onClick={() => router.push("/")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Voltar ao Início
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <div style={{ padding: "20px" }}>Carregando formulário...</div>;
  }

  if (error) {
    return <div style={{ padding: "20px", color: "red" }}>{error}</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      {isCorrecao && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeeba",
            color: "#856404",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "20px",
          }}
        >
          📝 <strong>Correção de Dados</strong> - Você está corrigindo os dados
          do item <strong>{numeroOriginal}</strong>
          <br />
          <small>
            Os dados originais serão preservados. As correções serão salvas
            separadamente.
          </small>
        </div>
      )}
      <h1>
        {isCorrecao
          ? "📝 Corrigir Dados do Item"
          : "Cadastrar Item de Inventário"}
      </h1>
      <form onSubmit={handleSubmit}>
        {(isCorrecao
          ? cabecalho?.filter((fieldName) =>
              CAMPOS_CORRECAO_PERMITIDOS.includes(fieldName)
            )
          : cabecalho
        )?.map((fieldName) => {
          if (fieldName === "#") {
            return null;
          }

          const isNumero = fieldName === "NUMERO";
          const isEstadoConservacao = fieldName === "ESTADO DE CONSERVAÇÃO";
          const isSalaField = fieldName === "SALA";
          const isCargaAtualField = fieldName === "CARGA ATUAL";
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
                  aria-required="true"
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
                  aria-required="true"
                  style={{ marginLeft: "10px", padding: "5px" }}
                >
                  <option value="">Selecione uma sala</option>
                  {salasOptions.map((sala) => (
                    <option key={sala} value={sala}>
                      {sala}
                    </option>
                  ))}
                </select>
              ) : isCargaAtualField ? (
                <select
                  id={fieldName}
                  name={fieldName}
                  value={formData[fieldName] || ""}
                  onChange={handleChange}
                  required
                  style={{ marginLeft: "10px", padding: "5px" }}
                >
                  <option value="">Selecione um servidor</option>
                  {servidoresOptions.map((servidor) => (
                    <option key={servidor} value={servidor}>
                      {servidor}
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
                  readOnly
                  required
                  style={{
                    marginLeft: "10px",
                    padding: "5px",
                    backgroundColor: "#f5f5f5",
                    color: "#666",
                    cursor: "not-allowed",
                  }}
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
        {isCorrecao && (
          <div
            style={{
              marginBottom: "15px",
              marginTop: "20px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "5px",
            }}
          >
            <label
              htmlFor="observacoes"
              style={{ fontWeight: "bold", color: "#495057" }}
            >
              Observações sobre a correção:
            </label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes || ""}
              onChange={handleChange}
              placeholder="Descreva o motivo da correção ou observações relevantes..."
              rows={3}
              style={{
                width: "100%",
                marginTop: "5px",
                padding: "8px",
                border: "1px solid #ced4da",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
            <small style={{ color: "#6c757d", fontSize: "12px" }}>
              Estas observações ajudarão a identificar o motivo da correção.
            </small>
          </div>
        )}
        <Button type="submit" style={{ padding: "10px 20px" }}>
          {isCorrecao ? "Salvar Correção" : "Salvar Cadastro"}
        </Button>
      </form>
    </div>
  );
}
