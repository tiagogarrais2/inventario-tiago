export default function SecoesFinais({
  inventario,
  estatisticas,
  itensMovidos,
  correcoesRealizadas,
  itensCadastrados,
  itensSobra,
  timeline,
  comunicacoes,
}) {
  const temComunicacoes = comunicacoes.total > 0;
  const secaoConsideracoes = temComunicacoes ? "6" : "5";

  return (
    <>
      {/* ============= 4. CRONOLOGIA ============= */}
      <div className="page-break">
        <h2>4 CRONOLOGIA DO INVENTÁRIO</h2>
        {timeline.length > 0 ? (
          <p>
            O sistema registrou {timeline.length} evento(s) ao longo do
            inventário, compreendendo ações de carga de dados, inventariação de
            bens, correções e demais operações realizadas pela comissão.
          </p>
        ) : (
          <p>Nenhum registro de atividade encontrado.</p>
        )}
      </div>

      {/* ============= 5. COMUNICAÇÕES ============= */}
      {temComunicacoes && (
        <div className="page-break">
          <h2>5 COMUNICAÇÕES REALIZADAS</h2>
          <p>
            Durante o inventário, foram realizadas {comunicacoes.total}{" "}
            comunicação(ões) por e-mail para servidores e membros relacionados
            ao processo.
          </p>
        </div>
      )}

      {/* ============= CONSIDERAÇÕES FINAIS ============= */}
      <div className="page-break">
        <h2>{secaoConsideracoes} CONSIDERAÇÕES FINAIS</h2>
        <p>
          O inventário patrimonial &ldquo;
          {inventario.nome}&rdquo;{" "}
          {estatisticas.percentualConcluido >= 100
            ? "foi concluído com êxito"
            : `encontra-se com ${estatisticas.percentualConcluido}% de progresso`}
          . Do total de {estatisticas.totalItens.toLocaleString("pt-BR")} bens
          registrados, {estatisticas.itensInventariados.toLocaleString("pt-BR")}{" "}
          foram devidamente verificados e registrados no sistema.
        </p>
        <p>
          Durante o processo, foram identificados {itensMovidos.total} bem(ns)
          com divergência de localização, {correcoesRealizadas.total}{" "}
          correção(ões) foi(foram) realizada(s) para adequação dos registros e{" "}
          {itensCadastrados.total} bem(ns) foi(foram) cadastrado(s) diretamente
          no sistema durante a execução do inventário.
        </p>
        {(itensSobra?.total || 0) > 0 && (
          <p>
            Foram ainda identificados {itensSobra.total} bem(ns) sem etiqueta
            patrimonial (sobra de inventário), os quais foram cadastrados com
            numeração provisória para posterior regularização junto ao setor
            competente.
          </p>
        )}
        <p>
          O presente relatório foi gerado automaticamente pelo Sistema de
          Inventário Patrimonial em{" "}
          {new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      </div>
    </>
  );
}
