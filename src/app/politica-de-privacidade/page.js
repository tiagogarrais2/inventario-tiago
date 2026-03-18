export const metadata = {
  title: "Política de Privacidade | Sistema Informatizado de Inventário Patrimonial",
  description:
    "Política de Privacidade do Sistema Informatizado de Inventário Patrimonial (uso interno IFCE).",
};

function SectionTitle({ id, children }) {
  return (
    <h2 id={id} className="text-xl font-semibold text-gray-900 mt-8 mb-3">
      {children}
    </h2>
  );
}

function Paragraph({ children }) {
  return <p className="text-gray-700 leading-relaxed mb-3">{children}</p>;
}

function List({ children }) {
  return (
    <ul className="list-inside list-disc break-words text-gray-700 space-y-2 mb-4">
      {children}
    </ul>
  );
}

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 sm:p-10">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Política de Privacidade
          </h1>
          <Paragraph>
            Esta Política de Privacidade descreve como o{" "}
            <strong>Sistema Informatizado de Inventário Patrimonial</strong> (“
            <strong>Plataforma</strong>”) trata dados pessoais para viabilizar o
            uso interno no <strong>Instituto Federal de Educação, Ciência e
            Tecnologia do Estado do Ceará (IFCE)</strong>.
          </Paragraph>
          <Paragraph>
            <strong>Contato</strong>:{" "}
            <a
              className="text-blue-700 underline hover:text-blue-800"
              href="mailto:tiago.arrais@ifce.edu.br"
            >
              tiago.arrais@ifce.edu.br
            </a>
          </Paragraph>
          <div className="mt-4 text-sm text-gray-600">
            <div>
              <strong>Versão</strong>: 3.2.0
            </div>
            <div>
              <strong>Data de vigência</strong>:{" "}
              <span className="italic">01/03/2026</span>
            </div>
          </div>
        </header>

        <SectionTitle id="1-base-legal">1. Base legal e escopo</SectionTitle>
        <Paragraph>
          Esta Política é elaborada em conformidade com a{" "}
          <strong>Lei nº 13.709/2018 (LGPD)</strong> e demais normas aplicáveis.
          O uso da Plataforma é <strong>interno</strong> e destinado a usuários
          autorizados pelo IFCE.
        </Paragraph>
        <Paragraph>
          Na qualidade de <strong>administração pública</strong>, o IFCE realiza
          o tratamento de dados pessoais quando necessário para a execução de
          políticas públicas previstas em leis e regulamentos, ou respaldadas
          em contratos, convênios e instrumentos congêneres, conforme a{" "}
          <strong>base legal do art. 7º</strong> da LGPD.
        </Paragraph>
        <Paragraph>
          Quando, por necessidade operacional, houver a inclusão/tratamento de
          <strong> dados sensíveis</strong> no Conteúdo, o IFCE observará as
          hipóteses legais previstas na LGPD para tratamento de dados
          sensíveis, especialmente o <strong>art. 11º</strong>, adotando
          medidas de segurança e minimização de dados compatíveis com a
          finalidade do sistema.
        </Paragraph>

        <SectionTitle id="2-dados-tratados">2. Quais dados pessoais tratamos</SectionTitle>
        <Paragraph>
          A Plataforma pode tratar dados pessoais estritamente necessários para
          autenticação, controle de acesso, auditoria e execução do inventário,
          incluindo:
        </Paragraph>
        <List>
          <li>
            <strong>Dados de identificação e autenticação</strong>: nome e e-mail
            associados à conta do usuário (ex.: via Google OAuth).
          </li>
          <li>
            <strong>Dados operacionais</strong>: registros de ações na Plataforma
            (auditoria), permissões concedidas e vínculos com inventários.
          </li>
          <li>
            <strong>Dados inseridos pelo usuário</strong>: observações e outros
            campos preenchidos durante a execução do inventário, conforme a
            finalidade do sistema.
          </li>
          <li>
            <strong>Dados técnicos</strong>: informações como data/hora de acesso
            e, quando aplicável, IP e user-agent para segurança e rastreabilidade.
          </li>
        </List>

        <SectionTitle id="3-finalidades">3. Finalidades do tratamento</SectionTitle>
        <Paragraph>Tratamos dados pessoais para:</Paragraph>
        <List>
          <li>permitir autenticação e gerenciamento de sessões;</li>
          <li>viabilizar controle de acesso por inventário e compartilhamento seguro;</li>
          <li>executar operações do inventário (busca, registro e atualização de itens);</li>
          <li>gerar relatórios e indicadores de andamento;</li>
          <li>manter trilha de auditoria para integridade e responsabilização;</li>
          <li>prevenir fraudes e proteger a Plataforma contra uso indevido.</li>
        </List>

        <SectionTitle id="4-compartilhamento">4. Compartilhamento de dados</SectionTitle>
        <Paragraph>
          A Plataforma é de uso interno do IFCE. O compartilhamento de dados pode
          ocorrer:
        </Paragraph>
        <List>
          <li>
            <strong>internamente</strong>, entre usuários autorizados, conforme
            permissões concedidas em cada inventário;
          </li>
          <li>
            com <strong>prestadores de infraestrutura</strong> (ex.: hospedagem,
            banco de dados, autenticação), quando aplicável, apenas para operar
            a Plataforma e com medidas de segurança razoáveis.
          </li>
        </List>
        <Paragraph>
          Não vendemos dados pessoais. O acesso a inventários é controlado por
          permissões e pode ser auditado.
        </Paragraph>

        <SectionTitle id="5-retencao">5. Retenção e eliminação</SectionTitle>
        <Paragraph>
          Os dados são mantidos pelo tempo necessário para cumprir as finalidades
          descritas nesta Política, atender obrigações legais/regulatórias e
          preservar a integridade de auditoria. Quando disponível, a exclusão de
          inventários poderá remover dados relacionados conforme regras internas
          e características técnicas do sistema.
        </Paragraph>

        <SectionTitle id="6-seguranca">6. Segurança da informação</SectionTitle>
        <Paragraph>
          Adotamos medidas técnicas e administrativas compatíveis com a natureza
          da Plataforma, incluindo autenticação, controle de permissões, validações
          server-side e registros de auditoria. Ainda assim, nenhum sistema é
          totalmente imune a falhas.
        </Paragraph>

        <SectionTitle id="7-direitos">7. Direitos do titular</SectionTitle>
        <Paragraph>
          Nos termos da LGPD, titulares podem solicitar informações e exercer
          direitos aplicáveis (ex.: confirmação de tratamento, acesso, correção),
          respeitadas as limitações legais e as necessidades de segurança/auditoria.
        </Paragraph>
        <Paragraph>
          Solicitações podem ser encaminhadas ao contato:
          {" "}
          <a
            className="text-blue-700 underline hover:text-blue-800"
            href="mailto:tiago.arrais@ifce.edu.br"
          >
            tiago.arrais@ifce.edu.br
          </a>
          .
        </Paragraph>

        <SectionTitle id="8-atualizacoes">8. Atualizações desta Política</SectionTitle>
        <Paragraph>
          Esta Política pode ser atualizada para refletir mudanças legais,
          técnicas ou operacionais. A versão vigente deve ser disponibilizada em
          canal interno apropriado.
        </Paragraph>

        <SectionTitle id="9-contato">9. Contato</SectionTitle>
        <Paragraph>
          Dúvidas, solicitações e suporte:{" "}
          <a
            className="text-blue-700 underline hover:text-blue-800"
            href="mailto:tiago.arrais@ifce.edu.br"
          >
            tiago.arrais@ifce.edu.br
          </a>
        </Paragraph>
      </div>
    </div>
  );
}

