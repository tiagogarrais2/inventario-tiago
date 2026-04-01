import { Pie, Bar } from "react-chartjs-2";

export default function Resultados({
  estatisticas,
  totalSalas,
  totalServidores,
  itensPorStatus,
  itensMovidos,
  itensCadastrados,
  itensSobra,
  correcoesRealizadas,
  topMarcas,
  pieProgressoData,
  pieStatusData,
  barSalasData,
  salasTop,
  pieEstadoData,
  estadoEntriesOrdenados,
  barMarcasData,
  barOptions,
  pieOptions,
}) {
  const statusEntries = Object.entries(itensPorStatus);
  const estadoLabels = estadoEntriesOrdenados.map(([k]) => k);

  return (
    <>
      {/* ============= 3. RESULTADOS ============= */}
      <div className="page-break">
        <h2>3 RESULTADOS</h2>

        {/* 3.1 Visão Geral */}
        <h3>3.1 Visão Geral</h3>
        <div className="quadro-resumo">
          <p>
            <strong>Total de bens:</strong>{" "}
            {estatisticas.totalItens.toLocaleString("pt-BR")}
          </p>
          <p>
            <strong>Bens inventariados:</strong>{" "}
            {estatisticas.itensInventariados.toLocaleString("pt-BR")}
          </p>
          <p>
            <strong>Bens pendentes:</strong>{" "}
            {estatisticas.itensNaoInventariados.toLocaleString("pt-BR")}
          </p>
          <p>
            <strong>Progresso:</strong> {estatisticas.percentualConcluido}%
          </p>
          <p>
            <strong>Total de salas:</strong> {totalSalas}
          </p>
          <p>
            <strong>Total de servidores:</strong> {totalServidores}
          </p>
          <p>
            <strong>Correções realizadas:</strong> {correcoesRealizadas.total}
          </p>
          <p>
            <strong>Itens movidos de sala:</strong> {itensMovidos.total}
          </p>
          <p>
            <strong>Itens cadastrados durante o inventário:</strong>{" "}
            {itensCadastrados.total}
          </p>
          <p>
            <strong>Bens sem etiqueta (sobra de inventário):</strong>{" "}
            {itensSobra?.total || 0}
          </p>
        </div>

        {/* 3.2 Progresso */}
        <h3>3.2 Progresso do Inventário</h3>
        <p>
          Do total de {estatisticas.totalItens.toLocaleString("pt-BR")} bens,{" "}
          {estatisticas.itensInventariados.toLocaleString("pt-BR")} foram
          inventariados, o que corresponde a {estatisticas.percentualConcluido}%
          do acervo. Restam{" "}
          {estatisticas.itensNaoInventariados.toLocaleString("pt-BR")} bens
          pendentes de verificação.
        </p>
        <p
          className="no-indent"
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "11pt",
          }}
        >
          Gráfico 1 — Progresso geral do inventário
        </p>
        <div className="grafico-container pie-chart">
          <Pie data={pieProgressoData} options={pieOptions} />
        </div>

        {/* 3.3 Itens por Status */}
        <h3>3.3 Distribuição por Status</h3>
        <p>
          Os itens do inventário foram classificados conforme seu status de
          processamento. A seguir, apresenta-se a distribuição:
        </p>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {statusEntries.map(([st, qtd]) => (
              <tr key={st}>
                <td>{st}</td>
                <td>{qtd.toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p
          className="no-indent"
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "11pt",
          }}
        >
          Gráfico 2 — Distribuição dos itens por status
        </p>
        <div className="grafico-container pie-chart">
          <Pie data={pieStatusData} options={pieOptions} />
        </div>
      </div>

      {/* 3.4 Distribuição por Sala */}
      <div className="page-break">
        <h3>3.4 Distribuição por Sala</h3>
        <p>
          Os bens patrimoniais encontram-se distribuídos em {totalSalas}{" "}
          sala(s). O gráfico a seguir apresenta as 5 salas com maior quantidade
          de bens:
        </p>
        {salasTop.length > 0 && (
          <>
            <p
              className="no-indent"
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "11pt",
              }}
            >
              Gráfico 3 — Distribuição de itens por sala (top 5)
            </p>
            <div className="grafico-container" style={{ height: "380px" }}>
              <Bar data={barSalasData} options={barOptions} />
            </div>
          </>
        )}
      </div>

      {/* 3.5 Distribuição por Servidor */}
      <div className="page-break">
        <h3>3.5 Distribuição por Servidor / Carga Atual</h3>
        <p>
          Os bens estão vinculados a {totalServidores} servidor(es) (cargas
          atuais).
        </p>
      </div>

      {/* 3.6 Movimentação Patrimonial */}
      <div className="page-break">
        <h3>3.6 Movimentação Patrimonial</h3>
        <p>
          Durante o inventário, foram identificados {itensMovidos.total} bem(ns)
          cuja localização encontrada difere da localização registrada,
          caracterizando movimentação patrimonial.
        </p>
      </div>

      {/* 3.7 Itens Cadastrados Durante o Inventário */}
      <h3>3.7 Itens Cadastrados Durante o Inventário</h3>
      <p>
        Durante o processo de inventário, {itensCadastrados.total} bem(ns)
        foi(foram) cadastrado(s) diretamente no sistema, ou seja, não constavam
        na carga inicial de dados.
      </p>

      {/* 3.8 Sobra de Inventário — Bens Sem Etiqueta */}
      <h3>3.8 Sobra de Inventário — Bens Sem Etiqueta</h3>
      <p>
        Durante o inventário, {itensSobra?.total || 0} bem(ns) foi(foram)
        encontrado(s) fisicamente sem possuir registro no sistema patrimonial
        (bens sem etiqueta). Estes itens foram cadastrados com numeração
        provisória iniciada pelo prefixo 99999, seguido de numeração sequencial.
      </p>
      {itensSobra?.lista?.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Número Provisório</th>
              <th>Descrição</th>
              <th>Sala</th>
            </tr>
          </thead>
          <tbody>
            {itensSobra.lista.map((item, idx) => (
              <tr key={idx}>
                <td>{item.numero}</td>
                <td>{item.descricao || "—"}</td>
                <td>{item.sala}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 3.9 Correções Realizadas */}
      <div className="page-break">
        <h3>3.9 Correções Realizadas</h3>
        <p>
          Foram registradas {correcoesRealizadas.total} correção(ões) durante o
          inventário. As correções são alterações realizadas nos dados dos bens
          para adequação às informações verificadas in loco.
        </p>
      </div>

      {/* 3.10 Estado de Conservação */}
      <h3>3.10 Estado de Conservação</h3>
      <p>
        A verificação física dos bens permitiu avaliar o estado de conservação
        dos itens inventariados. A distribuição encontra-se a seguir:
      </p>
      {estadoLabels.length > 0 ? (
        <>
          <table>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {estadoEntriesOrdenados.map(([estado, qtd]) => (
                <tr key={estado}>
                  <td>{estado}</td>
                  <td>{qtd.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p
            className="no-indent"
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "11pt",
            }}
          >
            Gráfico 5 — Distribuição por estado de conservação
          </p>
          <div className="grafico-container pie-chart">
            <Pie data={pieEstadoData} options={pieOptions} />
          </div>
        </>
      ) : (
        <p>Nenhum dado de estado de conservação registrado.</p>
      )}

      {/* 3.11 Distribuição por Marca */}
      {topMarcas.length > 0 && (
        <>
          <h3>3.11 Distribuição por Marca</h3>
          <p>
            A seguir, apresentam-se as {topMarcas.length} principais marcas
            entre os bens inventariados:
          </p>
          <p
            className="no-indent"
            style={{
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "11pt",
            }}
          >
            Gráfico 6 — Principais marcas
          </p>
          <div className="grafico-container" style={{ height: "350px" }}>
            <Bar data={barMarcasData} options={barOptions} />
          </div>
        </>
      )}
    </>
  );
}
