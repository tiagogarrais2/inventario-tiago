export default function SecoesFinais({
  inventario,
  estatisticas,
  itensMovidos,
  correcoesRealizadas,
  itensCadastrados,
  itensSobra,
  comunicacoes,
}) {
  const temComunicacoes = comunicacoes.total > 0;
  const secaoConsideracoes = temComunicacoes ? "5" : "4";
  const formatarDataHora = (data) =>
    new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const comunicacoesOrdenadas = temComunicacoes
    ? [...comunicacoes.lista].sort(
        (a, b) => new Date(a.data) - new Date(b.data)
      )
    : [];

  return (
    <>
      {/* ============= 4. COMUNICAÇÕES ============= */}
      {temComunicacoes && (
        <div className="page-break">
          <h2>4 COMUNICAÇÕES REALIZADAS</h2>
          <p>
            Durante o inventário, foram realizadas {comunicacoes.total}{" "}
            comunicação(ões) por e-mail para servidores e membros relacionados
            ao processo.
          </p>

          <table>
            <thead>
              <tr>
                <th>Data do Envio</th>
                <th>Assunto</th>
                <th>Remetente</th>
                <th>Destinatários</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {comunicacoesOrdenadas.map((com, idx) => (
                <tr key={idx}>
                  <td>{formatarDataHora(com.data)}</td>
                  <td>{com.assunto || "—"}</td>
                  <td>{com.remetente || "—"}</td>
                  <td>{com.totalEnviados ?? "—"}</td>
                  <td>{com.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {comunicacoesOrdenadas.map((com, idx) => (
            <div key={`msg-${idx}`} style={{ marginTop: "1rem" }}>
              <p className="no-indent" style={{ fontWeight: "bold" }}>
                Texto da comunicação {idx + 1}
              </p>
              <p
                className="no-indent"
                style={{ whiteSpace: "pre-line", textAlign: "left" }}
              >
                {com.mensagem || "—"}
              </p>
            </div>
          ))}
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
