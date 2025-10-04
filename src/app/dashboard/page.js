"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "../components/Button";

export default function Dashboard() {
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
  }, [session, status, router]);

  const buscarDadosDashboard = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const response = await fetch("/api/dashboard");

      if (!response.ok) {
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
      UPLOAD_INVENTARIO: "Fez upload de inventário",
      ITEM_INVENTARIADO: "Inventariou item",
      ITEM_CADASTRADO: "Cadastrou novo item",
      CORRECAO_ITEM: "Corrigiu item",
      ACESSO_RELATORIO: "Visualizou relatório",
      EXCLUSAO_INVENTARIO: "Excluiu inventário",
      ACESSO_DADOS: "Acessou listagem",
      ACESSO_DASHBOARD: "Acessou dashboard",
    };
    return acoes[acao] || acao;
  };

  // Loading state
  if (status === "loading" || carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
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
          <Button onClick={buscarDadosDashboard}>Tentar Novamente</Button>
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
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Bem-vindo, {dados?.usuario?.nome}</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => router.push("/")}>
                🏠 Página Inicial
              </Button>
              <Button onClick={() => router.push("/cadastrar")}>
                ➕ Novo Inventário
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Inventários */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-3xl">📋</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Meus Inventários
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {dados?.inventarios?.total || 0}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <span className="font-medium">
                  {dados?.inventarios?.proprietario || 0}
                </span>{" "}
                próprios,{" "}
                <span className="font-medium">
                  {dados?.inventarios?.comPermissao -
                    dados?.inventarios?.proprietario || 0}
                </span>{" "}
                compartilhados
              </div>
            </div>
          </div>

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
              <div className="mt-3 text-sm text-gray-600">
                Em todos os inventários
              </div>
            </div>
          </div>

          {/* Progresso */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-3xl">📊</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Progresso Geral
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {dados?.estatisticas?.percentualConcluido || 0}%
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${dados?.estatisticas?.percentualConcluido || 0}%`,
                    }}
                  ></div>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {dados?.estatisticas?.itensInventariados || 0} de{" "}
                  {dados?.estatisticas?.totalItens || 0} itens inventariados
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
                      Correções Feitas
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {dados?.estatisticas?.totalCorrecoes || 0}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                Dados corrigidos no sistema
              </div>
            </div>
          </div>
        </div>

        {/* Duas Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações do Usuário */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Informações da Conta
              </h3>
            </div>
            <div className="px-6 py-4">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nome</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {dados?.usuario?.nome}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {dados?.usuario?.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Membro desde
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatarData(dados?.usuario?.criadoEm)}
                  </dd>
                </div>
              </dl>
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
                  {dados.atividade.slice(0, 8).map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
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
                  {dados?.estatisticas?.totalItens > 0
                    ? `${Math.round((dados?.estatisticas?.itensInventariados / dados?.estatisticas?.totalItens) * 100)}% do total`
                    : "0% do total"}
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
                  {dados?.estatisticas?.totalItens > 0
                    ? `${Math.round((dados?.estatisticas?.itensNaoInventariados / dados?.estatisticas?.totalItens) * 100)}% do total`
                    : "0% do total"}
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
