import { Pie, Bar } from "react-chartjs-2";

export default function Resultados({
  estatisticas,
  totalSalas,
  totalServidores,
  itensPorStatus,
  itensPorServidor,
  servidoresMetricas,
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
  const cargaInicial =
    estatisticas.totalItens - itensCadastrados.total - (itensSobra?.total || 0);

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
            <strong>Carga patrimonial inicial:</strong>{" "}
            {cargaInicial.toLocaleString("pt-BR")}
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
          O inventário partiu de uma carga patrimonial inicial de{" "}
          {cargaInicial.toLocaleString("pt-BR")} bens, correspondente ao acervo
          previamente registrado. Durante a execução, também foram tratados{" "}
          {itensCadastrados.total.toLocaleString("pt-BR")} bens cadastrados em
          campo e {(itensSobra?.total || 0).toLocaleString("pt-BR")} bens sem
          etiqueta, evidenciando que o processo abrangeu saneamento e
          consolidação cadastral, e não apenas a conferência do estoque
          originalmente listado. Ao final, do total de{" "}
          {estatisticas.totalItens.toLocaleString("pt-BR")} bens consolidados,{" "}
          {estatisticas.itensInventariados.toLocaleString("pt-BR")} foram
          inventariados ({estatisticas.percentualConcluido}%), restando{" "}
          {estatisticas.itensNaoInventariados.toLocaleString("pt-BR")} pendentes
          de verificação.
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
            <div
              className="grafico-container"
              style={{ height: "300px", width: "70%" }}
            >
              <Bar data={barSalasData} options={barOptions} />
            </div>
          </>
        )}
      </div>

      {/* 3.5 Distribuição por Servidor */}
      <h3>3.5 Distribuição por Servidor / Carga Atual</h3>

      <p>
        Os bens patrimoniais encontram-se distribuídos entre múltiplos
        servidores, estrutura que reflete a natureza descentralizada das
        operações institucionais. A dispersão de ativos por diferentes unidades
        administrativas é características comum em organizações com múltiplos
        departamentos, câmpus ou setores especializados. Essa fragmentação de
        responsabilidades, embora necessária para a gestão operacional, exige
        mecanismos robustos de controle e rastreamento para assegurar a
        integridade dos registros patrimoniais e evitar lacunas de supervisão.
      </p>

      <p>
        A análise da distribuição de carga entre servidores revela padrões
        importantes sobre o funcionamento e a estrutura da instituição. Quando a
        distribuição é equilibrada, indica que as responsabilidades de custódia
        estão apropriadamente distribuídas entre os gestores. Por outro lado,
        concentrações significativas de bens em poucos servidores podem
        sinalizar estruturas de autoridade mais centralizadas ou alocar volumes
        anormais de ativos a determinadas unidades, demandando investigação
        adicional sobre a adequação dessa alocação.
      </p>

      <p>
        Durante o processo de inventário, os bens foram sistematicamente
        vinculados aos seus responsáveis legais, permitindo a análise granular
        de quem possui custódia sobre cada ativo. Essa rastreabilidade é
        fundamental não apenas para fins de controle administrativo, mas também
        para estabelecer linhas claras de responsabilidade em caso de danos,
        perdas ou irregularidades. O sistema desenvolvido para este levantamento
        captura essas informações em tempo real, facilitando o acompanhamento
        contínuo da situação patrimonial por servidor responsável.
      </p>

      <p>
        A progressão do inventário entre os diferentes servidores espelha não
        apenas diferenças em volume de bens, mas também nas dinâmicas
        operacionais de cada unidade. Alguns servidores podem apresentar taxas
        de inventariação mais altas devido à acessibilidade física dos bens,
        disponibilidade de pessoal ou prioridade operacional; enquanto outros
        podem enfrentar desafios específicos que retardam o processo.
        Compreender essas variações é essencial para ajustar cronogramas, alocar
        recursos e identificar gargalos que possam comprometer o prazo geral de
        conclusão do levantamento.
      </p>

      {servidoresMetricas && servidoresMetricas.totalServidoresComDados > 0 && (
        <div className="quadro-resumo">
          <p>
            <strong>Total de servidores com bens:</strong>{" "}
            {servidoresMetricas.totalServidoresComDados}
          </p>
          <p>
            <strong>Carga média por servidor:</strong>{" "}
            {servidoresMetricas.cargaMedia} bens
          </p>
          <p>
            <strong>Bens inventariados (distribuição geral):</strong>{" "}
            {servidoresMetricas.percentualInventariados}%
          </p>
          <p>
            <strong>Bens pendentes (distribuição geral):</strong>{" "}
            {servidoresMetricas.percentualPendentes}%
          </p>
          <p>
            <strong>Servidor(a) com a maior carga patrimonial possui:</strong>{" "}
            {servidoresMetricas.maiorCargaTotal} bens
          </p>
        </div>
      )}

      {/* 3.6 Movimentação Patrimonial */}
      <div className="page-break">
        <h3>3.6 Movimentação Patrimonial</h3>
        <p>
          Durante as atividades de verificação, identificou-se um total de{" "}
          {itensMovidos.total} bem(ns) cujas localizações físicas divergiam dos
          registros constantes na carga patrimonial inicial. Essa
          descontinuidade entre o registro lógico e a presença física
          caracteriza a movimentação patrimonial não documentada, fenômeno comum
          em instituições dinâmicas, mas que exige regularização imediata para
          evitar a perda de rastreabilidade dos ativos.
        </p>
        <p>
          Diferente dos métodos tradicionais de inventário, que apenas apontam a
          inconsistência para resolução posterior, o sistema desenvolvido para
          este ciclo permitiu uma solução de saneamento em tempo real. Ao
          identificar um bem em local distinto do cadastrado, a plataforma
          possibilitou a atualização instantânea da localidade diretamente na
          interface de campo, vinculando o objeto à sua nova unidade
          administrativa de forma precisa e auditável.
        </p>
        <p>
          Essa funcionalidade reflete uma evolução significativa na gestão de
          ativos do Campus, pois o relatório final já apresenta a base de dados
          devidamente saneada e atualizada. Esse procedimento facilita o
          trabalho administrativo pós-inventário e garante que a informação do
          bem corresponda exatamente à realidade física encontrada, elevando o
          índice de acurácia do controle patrimonial institucional.
        </p>
      </div>

      {/* 3.7 Itens Cadastrados Durante o Inventário */}
      <h3>3.7 Itens Cadastrados Durante o Inventário</h3>

      <p>
        Durante as diligências de campo, identificou-se um montante de{" "}
        {itensCadastrados.total} bem(ns) que, embora não constassem na base de
        dados inicial (carga de dados pré-existente), estavam devidamente
        identificados com etiquetas patrimoniais físicas. Diante da constatação
        da existência desses ativos no recinto do Campus, procedeu-se ao
        cadastramento imediato no sistema para garantir a fidedignidade do
        inventário e a proteção do patrimônio público.
      </p>

      <p>
        Observou-se que as etiquetas encontradas nestes itens apresentam padrões
        distintos da identidade visual padrão do órgão. Essa diversidade de
        identificação sugere origens diversas para o material, podendo tratar-se
        de bens provenientes de doações formais, transferências entre unidades,
        itens herdados de gestões anteriores ou, ainda, equipamentos
        pertencentes a outros órgãos que se encontram alocados na instituição,
        seja em caráter temporário ou permanente.
      </p>

      <p>
        A inclusão desses bens no sistema de inventário visa suprir lacunas de
        registros históricos e assegurar que todo recurso material em uso pela
        instituição seja devidamente monitorado. Este procedimento de
        "cadastramento em trânsito" é uma medida de controle interno essencial
        para a transparência administrativa, permitindo que a Comissão e os
        setores de patrimônio iniciem os trâmites necessários para a
        regularização documental e a oficialização da carga sob a
        responsabilidade do fiel depositário.
      </p>

      {/* 3.8 Sobra de Inventário — Bens Sem Etiqueta */}
      <h3>3.8 Sobra de Inventário — Bens Sem Etiqueta</h3>

      <p>
        Durante o presente levantamento, identificou-se um total de{" "}
        {itensSobra?.total || 0} bem(ns) localizados fisicamente, mas que não
        apresentavam etiqueta de registro patrimonial legível. Essa ausência de
        identificação impossibilita a conciliação imediata com a base de dados
        do sistema.
      </p>
      <p>
        As causas para tal inconsistência são variadas e inconclusivas, podendo
        abranger desde o desgaste natural e a perda das etiquetas físicas até a
        existência de itens que nunca foram devidamente inseridos no cadastro,
        bens recém-cadastrados cuja identificação oficial ainda não foi fixada,
        bens provenientes de órgãos que foram extintos ou que passaram por
        processos de doação mas que não tiveram a regularização documental
        concluída.
      </p>
      <p>
        No caso específico de bens que estavam registrados mas que perderam suas
        etiquetas, é possível que esse cadastro acabe gerando duplicidade de
        registros, uma vez que o mesmo item pode ser cadastrado novamente
        durante o processo de inventário, resultando em um novo número de
        patrimônio. Tal situação reforça a necessidade de uma análise criteriosa
        e de um processo de regularização posterior para evitar inconsistências
        futuras no controle patrimonial.
      </p>
      <p>
        Para assegurar o rastreio desses ativos e evitar a descontinuidade do
        controle, os itens foram registrados sob uma numeração provisória,
        utilizando o prefixo 99999 seguido de ordem sequencial. Este
        procedimento é temporário e visa facilitar a posterior regularização
        definitiva, permitindo que o patrimônio seja monitorado com
        transparência até a sua etiquetagem final.
      </p>

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
