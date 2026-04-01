import { formatarData } from "../utils";

export default function Introducao({
  inventario,
  estatisticas,
  datas,
  membrosComissao,
  totalSalas,
  totalServidores,
}) {
  return (
    <div className="page-break">
      <h2>1 INTRODUÇÃO</h2>
      <p>
        O presente relatório tem como objetivo apresentar os resultados do
        inventário patrimonial realizado por meio do Sistema Informatizado de
        Inventário Patrimonial, software de propriedade do Instituto Federal de
        Educação, Ciência e Tecnologia do Ceará, registrado no Instituto
        Nacional de Propriedade Industrial (INPI). O inventário denominado
        &ldquo;
        {inventario.nome}&rdquo; foi iniciado em {formatarData(datas.criacao)},
        sob a responsabilidade do(a) Presidente{" "}
        {membrosComissao.find((m) => m.papel === "Presidente")?.nome ||
          inventario.proprietario}
        , contando com a participação de {membrosComissao.length} membro(s) na
        comissão de inventário.
      </p>
      <p>
        O acervo patrimonial objeto deste inventário é composto por{" "}
        {estatisticas.totalItens.toLocaleString("pt-BR")} bens distribuídos em{" "}
        {totalSalas} sala(s) e sob a responsabilidade de {totalServidores}{" "}
        servidor(es). O período de realização do inventário compreendeu de{" "}
        {formatarData(datas.primeiroItemInventariado)} a{" "}
        {formatarData(datas.ultimoItemInventariado)}, totalizando{" "}
        {datas.duracaoDias > 0
          ? `${datas.duracaoDias} dia(s)`
          : "período não definido"}{" "}
        de execução.
      </p>
    </div>
  );
}
