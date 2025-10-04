"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../../../components/Button";

export default async function InventarioDashboard({ params }) {
  // Aguarda os params serem resolvidos (Next.js 15+)
  const resolvedParams = await params;
  const nomeInventario = resolvedParams.nome;

  return <InventarioDashboardClient nomeInventario={nomeInventario} />;
}

function InventarioDashboardClient({ nomeInventario }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }

    buscarDadosDashboard();
  }, [session, status, router, nomeInventario]);

  const buscarDadosDashboard = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await fetch(
        `/api/inventario-dashboard/${encodeURIComponent(nomeInventario)}`
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Você não tem permissão para acessar este inventário"
          );
        }
        if (response.status === 404) {
          throw new Error("Inventário não encontrado");
        }
        throw new Error("Erro ao carregar dados do dashboard");
      }

      const data = await response.json();
      setDados(data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatarAcao = (acao) => {
    const acoes = {
      ACESSO_INVENTARIO: "Acessou inventário",
      ITEM_INVENTARIADO: "Inventariou item",
      ITEM_CADASTRADO: "Cadastrou novo item",
      CORRECAO_ITEM: "Corrigiu item",
      ACESSO_RELATORIO: "Visualizou relatório",
      ACESSO_INVENTARIO_DASHBOARD: "Acessou dashboard",
    };
    return acoes[acao] || acao;
  };

  const getStatusColor = (percentual) => {
    if (percentual >= 90) return "bg-green-500";
    if (percentual >= 70) return "bg-yellow-500";
    if (percentual >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  // Loading state
  if (status === "loading" || carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Carregando dashboard do inventário...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Erro ao carregar
          </h2>
          <p className="text-gray-600 mb-4">{erro}</p>
          <div className="flex space-x-2 justify-center">
            <Button onClick={buscarDadosDashboard}>Tentar Novamente</Button>
            <Button onClick={() => router.push("/")}>Voltar ao Início</Button>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard do Inventário
              </h1>
              <p className="text-gray-600">
                {dados?.inventario?.nomeExibicao || nomeInventario}
              </p>
              <p className="text-sm text-gray-500">
                Proprietário: {dados?.inventario?.proprietario} | Criado em:{" "}
                {formatarData(dados?.inventario?.criadoEm)}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => router.push(`/inventario/${nomeInventario}`)}
              >
                📋 Inventário
              </Button>
              <Button
                onClick={() => router.push(`/relatorio/${nomeInventario}`)}
              >
                📊 Relatório
              </Button>
              <Button onClick={() => router.push("/")}>🏠 Início</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Itens */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-3xl">📦</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Itens
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {dados?.estatisticas?.totalItens || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Progresso */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-3xl">✅</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Inventariados
                    </dt>
                    <dd className="text-3xl font-bold text-green-600">
                      {dados?.estatisticas?.itensInventariados || 0}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(dados?.estatisticas?.percentualConcluido || 0)}`}
                    style={{
                      width: `${dados?.estatisticas?.percentualConcluido || 0}%`,
                    }}
                  ></div>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {dados?.estatisticas?.percentualConcluido || 0}% concluído
                </div>
              </div>
            </div>
          </div>

          {/* Salas */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-3xl">🏠</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Salas
                    </dt>
                    <dd className="text-3xl font-bold text-blue-600">
                      {dados?.estatisticas?.totalSalas || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Correções */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-3xl">🔧</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Correções
                    </dt>
                    <dd className="text-3xl font-bold text-orange-600">
                      {dados?.estatisticas?.totalCorrecoes || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Duas Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Progresso por Sala */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Progresso por Sala
              </h3>
            </div>
            <div className="px-6 py-4">
              {dados?.salas && dados.salas.length > 0 ? (
                <div className="space-y-4">
                  {dados.salas.slice(0, 8).map((sala, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {sala.nome}
                        </p>
                        <div className="flex items-center mt-1">
                          <div className="bg-gray-200 rounded-full h-2 flex-1 mr-3">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(sala.percentual)}`}
                              style={{ width: `${sala.percentual}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 w-12 text-right">
                            {sala.percentual}%
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm text-gray-900">
                          {sala.itensInventariados}/{sala.totalItens}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhuma sala cadastrada</p>
              )}
            </div>
          </div>

          {/* Atividade Recente */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Atividade Recente
              </h3>
            </div>
            <div className="px-6 py-4">
              {dados?.atividade && dados.atividade.length > 0 ? (
                <div className="space-y-3">
                  {dados.atividade.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">
                            {item.usuario?.nome || "Sistema"}
                          </span>{" "}
                          {formatarAcao(item.acao)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatarData(item.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Estatísticas Detalhadas */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Resumo Detalhado
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {dados?.estatisticas?.itensInventariados || 0}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Itens Inventariados
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {dados?.estatisticas?.percentualConcluido || 0}% do total
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {dados?.estatisticas?.itensNaoInventariados || 0}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Itens Pendentes
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {100 - (dados?.estatisticas?.percentualConcluido || 0)}%
                  restante
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {dados?.estatisticas?.totalCorrecoes || 0}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Correções Realizadas
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Dados atualizados
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
