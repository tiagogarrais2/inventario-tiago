export const metadata = {
  title: "Termos de Uso | Sistema Informatizado de Inventário Patrimonial",
  description:
    "Termos de Uso do Sistema Informatizado de Inventário Patrimonial (uso interno IFCE).",
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

export default function TermosDeUsoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 sm:p-10">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Termos de Uso
          </h1>
          <Paragraph>
            <strong>Plataforma</strong>: Sistema Informatizado de Inventário
            Patrimonial
          </Paragraph>
          <Paragraph>
            <strong>Responsável/Operador</strong>: Instituto Federal de Educação,
            Ciência e Tecnologia do Estado do Ceará (IFCE)
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
          <Paragraph>
            <strong>Uso</strong>: interno
          </Paragraph>
          <Paragraph>
            <strong>Foro</strong>: Limoeiro do Norte/CE
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

        <SectionTitle id="1-identificacao">1. Identificação</SectionTitle>
        <Paragraph>
          Estes Termos de Uso (“<strong>Termos</strong>”) regulam o acesso e uso
          do <strong>Sistema Informatizado de Inventário Patrimonial</strong> (“
          <strong>Plataforma</strong>”), destinado ao gerenciamento, execução e
          acompanhamento de inventários patrimoniais, com registro de
          atividades, controle de acesso e emissão de relatórios (“
          <strong>Serviços</strong>”). Ao acessar ou utilizar a Plataforma, você
          declara ter lido e concordado com estes Termos.
        </Paragraph>

        <SectionTitle id="2-elegibilidade">2. Elegibilidade e acesso</SectionTitle>
        <Paragraph>
          A Plataforma é destinada a <strong>uso interno</strong> do IFCE e deve
          ser utilizada apenas por pessoas autorizadas (servidores,
          colaboradores ou agentes formalmente designados, conforme normas
          internas aplicáveis).
        </Paragraph>
        <Paragraph>
          O acesso pode exigir autenticação por <strong>Google OAuth</strong>.
          Você é responsável por manter a segurança da sua conta e por todas as
          ações realizadas a partir dela.
        </Paragraph>

        <SectionTitle id="3-funcionalidades">3. Funcionalidades e finalidade</SectionTitle>
        <Paragraph>A Plataforma pode disponibilizar, entre outras:</Paragraph>
        <List>
          <li>importação de inventários (ex.: arquivos .json e .csv);</li>
          <li>
            consulta e execução do inventário (busca por tombo, registro e
            atualização de informações e observações);
          </li>
          <li>
            relatórios e filtros de acompanhamento (ex.: por sala, por
            responsável/carga, por valor, pendências);
          </li>
          <li>histórico de alterações/correções e trilha de auditoria;</li>
          <li>compartilhamento de inventários com usuários autorizados;</li>
          <li>exclusão de inventários pelo proprietário, quando disponível.</li>
        </List>
        <Paragraph>
          A Plataforma é ferramenta de apoio e <strong>não substitui</strong>{" "}
          normas, procedimentos e controles oficiais do IFCE.
        </Paragraph>

        <SectionTitle id="4-papeis">4. Papéis, propriedade e permissões</SectionTitle>
        <Paragraph>
          O usuário que cria/importa um inventário na Plataforma é considerado
          seu <strong>Proprietário</strong> para fins de governança de acesso
          dentro do sistema.
        </Paragraph>
        <Paragraph>
          O Proprietário poderá conceder e revogar acesso a outros usuários,
          conforme recursos disponíveis e regras internas. Tentativas de acesso
          indevido poderão ser bloqueadas e registradas.
        </Paragraph>

        <SectionTitle id="5-conteudo">5. Conteúdo e dados inseridos</SectionTitle>
        <Paragraph>
          “<strong>Conteúdo</strong>” inclui arquivos importados, cadastros,
          salas, itens, correções, observações e quaisquer dados inseridos na
          Plataforma.
        </Paragraph>
        <Paragraph>
          Você declara possuir autorização para inserir e tratar o Conteúdo na
          Plataforma e que não incluirá dados ilícitos, maliciosos ou indevidos,
          ou que violem direitos de terceiros.
        </Paragraph>
        <Paragraph>
          A Plataforma pode estruturar, normalizar, armazenar e exibir o
          Conteúdo estritamente para prestação dos Serviços.
        </Paragraph>

        <SectionTitle id="6-auditoria">6. Auditoria e registros de atividade</SectionTitle>
        <Paragraph>
          Para segurança, rastreabilidade e integridade, a Plataforma pode
          registrar logs de auditoria relacionados às operações realizadas (ex.:
          criação/visualização de inventários, buscas, inclusão/atualização de
          itens, concessão/revogação de permissões, exclusões, tentativas de
          acesso negado).
        </Paragraph>
        <Paragraph>
          Os registros podem conter data/hora, usuário, inventário relacionado e
          metadados técnicos (ex.: IP e user-agent), quando aplicável.
        </Paragraph>

        <SectionTitle id="7-privacidade">7. Privacidade e proteção de dados (LGPD)</SectionTitle>
        <Paragraph>
          O tratamento de dados pessoais observará a Lei nº 13.709/2018 (LGPD) e
          as políticas internas aplicáveis do IFCE.
        </Paragraph>
        <Paragraph>
          A Plataforma pode tratar dados como <strong>nome</strong> e{" "}
          <strong>e-mail</strong> (provenientes da autenticação), além de dados
          funcionais/operacionais inseridos no Conteúdo.
        </Paragraph>
        <Paragraph>
          A Política de Privacidade específica do Sistema Informatizado de
          Inventário Patrimonial está disponível na própria Plataforma
          (
          <a className="text-blue-700 underline hover:text-blue-800" href="/politica-de-privacidade">
            Política de Privacidade
          </a>
          ) e complementa estes Termos.
        </Paragraph>

        <SectionTitle id="8-seguranca">8. Segurança</SectionTitle>
        <Paragraph>
          A Plataforma adota medidas de segurança compatíveis com sua natureza
          (ex.: autenticação, controle de acesso, validações e auditoria).
        </Paragraph>
        <Paragraph>Você se compromete a:</Paragraph>
        <List>
          <li>não compartilhar sessões/credenciais;</li>
          <li>utilizar a Plataforma apenas em ambiente autorizado;</li>
          <li>
            reportar suspeitas de incidente de segurança ao contato indicado
            nestes Termos.
          </li>
        </List>

        <SectionTitle id="9-condutas">9. Condutas proibidas</SectionTitle>
        <Paragraph>É proibido, entre outros:</Paragraph>
        <List>
          <li>acessar inventários sem autorização;</li>
          <li>burlar autenticação, permissões ou restrições;</li>
          <li>inserir Conteúdo malicioso, enganoso, ilegal ou indevido;</li>
          <li>realizar exploração de vulnerabilidades sem autorização formal;</li>
          <li>interferir na disponibilidade do sistema (ex.: automações abusivas).</li>
        </List>
        <Paragraph>
          O descumprimento pode resultar em suspensão de acesso e demais medidas
          administrativas e legais cabíveis.
        </Paragraph>

        <SectionTitle id="10-exclusao">10. Exclusão de inventários</SectionTitle>
        <Paragraph>
          Quando disponível, a exclusão de inventários poderá exigir confirmação
          reforçada e ser restrita ao Proprietário e/ou conforme regras internas
          aplicáveis.
        </Paragraph>
        <Paragraph>
          A exclusão poderá remover dados relacionados (ex.: itens, correções,
          permissões, salas, registros associados), podendo ser{" "}
          <strong>irreversível</strong>.
        </Paragraph>

        <SectionTitle id="11-disponibilidade">11. Disponibilidade, manutenção e suporte</SectionTitle>
        <Paragraph>
          A Plataforma pode ficar indisponível temporariamente por manutenção,
          atualização, falhas de terceiros ou contingências técnicas.
        </Paragraph>
        <Paragraph>
          O suporte ocorrerá via e-mail{" "}
          <a
            className="text-blue-700 underline hover:text-blue-800"
            href="mailto:tiago.arrais@ifce.edu.br"
          >
            tiago.arrais@ifce.edu.br
          </a>{" "}
          em melhor esforço, salvo disposição interna diversa.
        </Paragraph>

        <SectionTitle id="12-propriedade-intelectual">12. Propriedade intelectual</SectionTitle>
        <Paragraph>
          O software, layout e componentes da Plataforma são de titularidade do
          IFCE ou licenciados ao IFCE.
        </Paragraph>
        <Paragraph>
          O usuário mantém responsabilidade e dever de licitude sobre o Conteúdo
          inserido, concedendo ao IFCE permissão para uso interno do Conteúdo
          estritamente para prestação dos Serviços.
        </Paragraph>
        <Paragraph>
          O software do Sistema Informatizado de Inventário Patrimonial é de
          titularidade do IFCE e encontra-se registrado como Programa de
          Computador junto ao Instituto Nacional da Propriedade Industrial
          (INPI). O certificado é válido por 50 anos a partir de 1º de janeiro
          subsequente à data de 01/02/2026, em conformidade com o §2º do art.
          2º da Lei nº 9.609/1998.
        </Paragraph>

        <SectionTitle id="13-limitacao">13. Limitação de responsabilidade</SectionTitle>
        <Paragraph>
          Na extensão permitida por lei, o IFCE não se responsabiliza por
          erros/omissões no Conteúdo fornecido pelos usuários, decisões
          administrativas baseadas em dados incorretos ou incompletos,
          indisponibilidades causadas por terceiros (ex.: provedor de
          autenticação, rede, infraestrutura), ou danos indiretos decorrentes do
          uso inadequado da Plataforma.
        </Paragraph>

        <SectionTitle id="14-suspensao">14. Suspensão e encerramento de acesso</SectionTitle>
        <Paragraph>
          O acesso poderá ser suspenso ou encerrado em caso de violação destes
          Termos, exigência legal, determinação administrativa, risco à
          segurança ou necessidade de preservação da integridade dos Serviços.
        </Paragraph>

        <SectionTitle id="15-alteracoes">15. Alterações destes Termos</SectionTitle>
        <Paragraph>
          O IFCE pode atualizar estes Termos para refletir mudanças legais,
          técnicas ou operacionais. A versão vigente deve ser disponibilizada
          em canal interno apropriado. O uso continuado após atualização indica
          concordância.
        </Paragraph>

        <SectionTitle id="16-foro">16. Lei aplicável e foro</SectionTitle>
        <Paragraph>
          Aplica-se a legislação brasileira. Fica eleito o foro da comarca de{" "}
          <strong>Limoeiro do Norte/CE</strong>, salvo regra legal imperativa em
          sentido diverso.
        </Paragraph>

        <SectionTitle id="17-contato">17. Contato</SectionTitle>
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

