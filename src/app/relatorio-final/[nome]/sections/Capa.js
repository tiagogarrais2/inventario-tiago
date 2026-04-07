import { formatarData } from "../utils";

export default function Capa({ inventario, membrosComissao, datas }) {
  const dataGeracaoRelatorio = formatarData(new Date());

  return (
    <>
      {/* ============= CAPA ============= */}
      <div className="capa">
        <p style={{ fontSize: "14pt", marginBottom: "3rem" }}>
          SISTEMA DE INVENTÁRIO PATRIMONIAL
        </p>
        <h1>RELATÓRIO FINAL DE INVENTÁRIO</h1>
        <p style={{ fontSize: "16pt", fontWeight: "bold" }}>
          {inventario.nomeExibicao || inventario.nome}
        </p>
        <div style={{ marginTop: "4rem" }}>
          {membrosComissao.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <p
                style={{
                  fontSize: "12pt",
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                }}
              >
                Comissão de Inventário
              </p>
              {membrosComissao.map((m, i) => (
                <p key={i} style={{ fontSize: "12pt", marginBottom: "0.2rem" }}>
                  {m.nome} — {m.papel}
                </p>
              ))}
            </div>
          )}
          <p style={{ marginTop: "2rem" }}>{dataGeracaoRelatorio}</p>
        </div>
      </div>

      {/* ============= FOLHA DE ROSTO ============= */}
      <div className="page-break">
        <h2>Identificação do Inventário</h2>
        <table>
          <tbody>
            <tr>
              <th>Identificador</th>
              <td>{inventario.nome}</td>
            </tr>
            <tr>
              <th>Data da Carga</th>
              <td>{formatarData(datas.criacao)}</td>
            </tr>
            <tr>
              <th>Primeiro Item Inventariado</th>
              <td>{formatarData(datas.primeiroItemInventariado)}</td>
            </tr>
            <tr>
              <th>Último Item Inventariado</th>
              <td>{formatarData(datas.ultimoItemInventariado)}</td>
            </tr>
            <tr>
              <th>Duração do Inventário</th>
              <td>
                {datas.duracaoDias > 0 ? `${datas.duracaoDias} dia(s)` : "—"}
              </td>
            </tr>
          </tbody>
        </table>

        <h3>Comissão de Inventário</h3>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th style={{ width: "12ch", whiteSpace: "nowrap" }}>Papel</th>
            </tr>
          </thead>
          <tbody>
            {membrosComissao.map((m, i) => (
              <tr key={i}>
                <td>{m.nome}</td>
                <td>{m.email}</td>
                <td style={{ width: "12ch", whiteSpace: "nowrap" }}>
                  {m.papel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
