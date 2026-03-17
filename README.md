# 📋 Sistema de Inventário Tiago v3.1.0

Sistema completo para gerenciamento de inventários com banco de dados PostgreSQL, autenticação, controle de acesso, auditoria, **sistema de correções avançado** e **funcionalidade de exclusão de inventários**. Desenvolvido em Next.js 15 com NextAuth para autenticação segura via Google OAuth e Prisma ORM para persistência de dados.

---

## Demonstração Visual

|          Relatório geral          |
| :-------------------------------: |
| ![Tela 13](./public/Telas/13.jpg) |

<details>
<summary>📸 <strong>Ver Screenshots do Sistema</strong></summary>

|           Tela inicial            |      Inventários disponíveis      |      Criação de inventários       |
| :-------------------------------: | :-------------------------------: | :-------------------------------: |
| ![Tela 01](./public/Telas/01.jpg) | ![Tela 02](./public/Telas/02.jpg) | ![Tela 03](./public/Telas/03.jpg) |

|        Realizar inventário        |        Nome do inventário         |        Cadastro da equipe         |
| :-------------------------------: | :-------------------------------: | :-------------------------------: |
| ![Tela 04](./public/Telas/04.jpg) | ![Tela 05](./public/Telas/05.jpg) | ![Tela 06](./public/Telas/06.jpg) |

<details>
<summary>🔍 <strong>Ver Mais Screenshots</strong></summary>

|       Gerenciar permissões        |        Realizar inventário        |         Item inventariado         |
| :-------------------------------: | :-------------------------------: | :-------------------------------: |
| ![Tela 07](./public/Telas/07.jpg) | ![Tela 08](./public/Telas/08.jpg) | ![Tela 09](./public/Telas/09.jpg) |

|        Item não encontrado        |         Cadastro de item          |        Cadastro de item 2         |
| :-------------------------------: | :-------------------------------: | :-------------------------------: |
| ![Tela 10](./public/Telas/10.jpg) | ![Tela 11](./public/Telas/11.jpg) | ![Tela 12](./public/Telas/12.jpg) |

|          Relatório geral          |
| :-------------------------------: |
| ![Tela 13](./public/Telas/13.jpg) |

</details>
</details>

---

## 🧪 Teste o Sistema

**Quer experimentar sem configurar nada?**

1. **📥 [Baixar Arquivo de Exemplo](./public/exemplo-json/inventario.json)**
2. **🌐 Acesse o sistema** e faça login com Google
3. **📤 Faça upload** do arquivo baixado
4. **🎯 Explore todas as funcionalidades!**

---

## 📖 Documentação

- **👨‍💻 Para Desenvolvedores**: Continue lendo este README
- **👥 Para Usuários Finais**: [📋 Guia do Usuário - Comissões Inventariantes](./README-USUARIOS.md)

---

## ✨ Principais Funcionalidades

### **Sistema de Banco de Dados Robusto**

- **PostgreSQL**: Banco de dados relacional para alta performance e confiabilidade
- **Prisma ORM**: Mapeamento objeto-relacional com type safety
- **Migrações automáticas**: Versionamento e evolução do schema
- **Relacionamentos**: Estrutura normalizada com integridade referencial

### 🔐 **Autenticação e Segurança**

- **Login via Google OAuth**: Autenticação segura usando NextAuth
- **Controle de sessões**: Proteção automática de todas as páginas e APIs
- **Auditoria completa**: Logs detalhados armazenados no banco de dados
- **Proteção de dados sensíveis**: Conformidade com LGPD

### 👥 **Sistema de Permissões Granular**

- **Proprietário único**: Quem envia o inventário é o proprietário
- **Compartilhamento controlado**: Proprietário pode conceder acesso via email
- **Criação automática de usuários**: Sistema cria usuários automaticamente ao conceder acesso
- **Revogação instantânea**: Remoção de acessos a qualquer momento
- **Interface visual**: Gerenciamento fácil de usuários autorizados

### 📂 **Processamento de Inventários**

- **Upload inteligente**: Suporte para arquivos .json e .csv
- **Migração automática**: Conversão de dados legados para PostgreSQL
- **Captura automática**: Nome do responsável obtido da sessão autenticada
- **Organização automática**: Estrutura relacional otimizada
- **Rastreabilidade**: Informações completas de auditoria no banco

### 📊 **Execução de Inventário Avançada**

- **Busca por tombos**: Sistema de pesquisa rápida com cache de banco
- **Cadastro dinâmico**: Adição de novos itens com marcação especial
- **Controle de status**: Atualização do estado de conservação
- **Validação de salas**: Alertas para mudanças de localização
- **Interface otimizada**: Foco automático e UX aprimorada
- **Campo de observações**: Possibilidade de adicionar notas durante o inventário
- **Marcação especial**: Itens cadastrados durante inventário são identificados

### 🔧 **Sistema de Correções v2.1.0**

- **Correção de dados**: Permite corrigir informações de itens já inventariados
- **Histórico completo**: Rastreamento cronológico de todas as mudanças realizadas
- **Comparação inteligente**: Sistema só salva campos que realmente mudaram
- **Interface dedicada**: Página estilizada para visualizar histórico de correções
- **Navegação integrada**: Links diretos entre inventário, relatórios e correções
- **Preservação de dados**: Mantém valores originais quando campos não são alterados
- **API robusta**: Endpoints especializados para correções e consultas de histórico
- **Marcação especial**: Itens cadastrados durante inventário são identificados

### 🗑️ **Sistema de Exclusão de Inventários v2.2.0 (NOVO!)**

- **Exclusão segura**: Apenas proprietários podem excluir seus inventários
- **Confirmação dupla**: Sistema de confirmação com diálogo e digitação manual
- **Exclusão em cascata**: Remove automaticamente todos os dados relacionados:
  - Itens do inventário
  - Correções realizadas
  - Permissões concedidas
  - Salas cadastradas
  - Cabeçalhos personalizados
  - Logs de auditoria
- **Auditoria completa**: Registra todas as exclusões com detalhes
- **Interface intuitiva**: Botão destacado visível apenas para proprietários
- **Feedback visual**: Indicadores de progresso durante a exclusão
- **Redirecionamento automático**: Volta à página inicial após exclusão

### 🔔 **Sistema de Notificações v2.2.0 (NOVO!)**

- **Notificações centralizadas**: Sistema unificado para todos os tipos de feedback
- **Múltiplos tipos**: Sucesso, erro, informação e alerta
- **Posicionamento fixo**: Notificações no topo da tela, sempre visíveis
- **Auto-dismiss**: Remoção automática após tempo configurável
- **Fila inteligente**: Múltiplas notificações empilhadas ordenadamente
- **Design responsivo**: Adaptação automática para mobile e desktop
- **Feedback visual**: Cores e ícones específicos para cada tipo
- **Integração universal**: Usado em todos os componentes do sistema

### 📈 **Relatórios e Visualização Aprimorados**

- **Relatórios dinâmicos**: Dados em tempo real do PostgreSQL
- **Organização por sala**: Visualização completa incluindo salas vazias
- **Organização por servidor**: Novo relatório que agrupa itens por carga atual/servidor responsável
- **Minhas Pendências**: Filtro automático que mostra apenas os itens vinculados ao usuário logado
- **Organização por valor**: Novo relatório que lista itens ordenados por valor depreciado (maior para menor)
- **Status visual**: Indicação clara de itens inventariados vs não inventariados
- **Sistema de badges**: Indicadores visuais para diferentes status dos itens:
  - 🟢 **Badge INVENTARIADO** - Para itens confirmados durante inventário
  - 🟠 **Badge CORRIGIDO** - Para itens que sofreram correções
  - 🔵 **Badge CADASTRADO** - Para itens adicionados durante o inventário
- **Bordas coloridas**: Sistema de prioridade visual por status
- **Posicionamento inteligente**: Badges sem sobreposições para impressão
- **Navegação integrada**: Links diretos entre relatório, inventário e correções
- **Dados do inventariante**: Exibição correta do nome real dos usuários
- **Histórico inline**: Informações de correções diretamente no relatório
- **Campo de observações**: Possibilidade de adicionar notas durante o inventário
- **Inventário direto**: Botão para inventariar itens não inventariados diretamente do relatório

### 📝 **Inventário Direto dos Relatórios v2.3.0 (NOVO!)**

- **Botão "Inventariar Item"**: Aparece automaticamente para itens não inventariados
- **Modal completo**: Formulário idêntico ao da página de inventário
- **Campos obrigatórios**: Carga atual e estado de conservação sempre obrigatórios
- **Campo Sala Encontrada**: Dropdown inteligente com todas as salas disponíveis
- **Campo de observações**: Permite adicionar notas específicas durante o inventário
- **Atualização instantânea**: Estado do relatório atualizado imediatamente após inventário
- **API consistente**: Usa a mesma API `/update-inventario` sem modificações
- **Validação completa**: Mesmas regras de negócio da página de inventário
- **Feedback visual**: Notificações de sucesso/erro idênticas ao sistema principal

### 🧪 **Demonstração e Testes**

- **Arquivo de exemplo**: JSON com dados fictícios realistas para teste
- **Download direto**: Disponível na página inicial para usuários não logados
- **Screenshots completos**: 13 telas do sistema para visualização
- **Teste sem instalação**: Possibilidade de testar antes de configurar
- **Dados de demonstração**: Estrutura completa para entender o funcionamento

## 🏗️ Arquitetura do Sistema

### **Modelo de Dados PostgreSQL**

Sistema com banco de dados relacional robusto:

```sql
-- Usuários do sistema
usuarios {
  id: String (CUID)
  email: String (unique)
  nome: String
  createdAt: DateTime
  updatedAt: DateTime
}

-- Inventários
inventarios {
  id: String (CUID)
  nome: String (unique)
  nomeExibicao: String
  proprietarioId: String -> usuarios.id
  createdAt: DateTime
  updatedAt: DateTime
}

-- Itens do inventário
itens_inventario {
  id: String (CUID)
  inventarioId: String -> inventarios.id
  numero: String
  [... campos específicos do item ...]

  -- Campos de inventário
  dataInventario: DateTime?
  inventarianteId: String? -> usuarios.id
  salaEncontrada: String?
  statusInventario: String?
  estadoConservacao: String?
  cargaAtual: String?
  observacoesInventario: String?  -- NOVO v2.3.0: Campo para observações durante inventário
  cadastradoDuranteInventario: Boolean
}

-- Correções de itens (NOVO v2.1.0)
correcao_itens {
  id: String (CUID)
  inventarioId: String -> inventarios.id
  numeroOriginal: String
  camposAlterados: Json
  observacoes: String?
  usuarioId: String -> usuarios.id
  timestamp: DateTime
}

-- Permissões de acesso
permissoes {
  id: String (CUID)
  inventarioId: String -> inventarios.id
  usuarioId: String -> usuarios.id
  ativa: Boolean
  createdAt: DateTime
}

-- Logs de auditoria
audit_logs {
  id: String (CUID)
  timestamp: DateTime
  acao: String
  usuarioId: String? -> usuarios.id
  inventarioId: String? -> inventarios.id
  detalhes: Json?
  ip: String?
  userAgent: String?
}
```

### **Sistema de Auditoria**

Auditoria completa no banco de dados PostgreSQL:

**Eventos rastreados:**

- `upload_inventory` - Criação de novos inventários
- `view_inventory` - Visualização de inventários
- `search_item` - Busca por itens específicos
- `add_item` - Adição de novos itens
- `update_item` - Atualização de itens existentes
- `PERMISSAO_CONCEDIDA` - Concessão de acessos
- `PERMISSAO_REVOGADA` - Revogação de acessos
- `ACESSO_NEGADO` - Tentativas não autorizadas

## 🛡️ Segurança e Controle de Acesso

### **Níveis de Proteção**

1. **Autenticação obrigatória**: Todas as páginas e APIs protegidas
2. **Verificação de permissões**: Controle granular por inventário
3. **Validação server-side**: Segurança em todas as operações
4. **Logs de auditoria**: Rastreamento completo de atividades

### **Gerenciamento de Usuários**

- **Proprietário**: Controle total sobre o inventário
- **Usuários autorizados**: Acesso para visualização e edição
- **Interface de gerenciamento**: Modal para adicionar/remover usuários
- **Validação de emails**: Sistema robusto de verificação

## 🚀 Fluxo de Trabalho

### **1. Criação de Inventário**

1. Usuário faz login via Google
2. Envia arquivo .json ou .csv
3. Sistema processa e cria estrutura de dados
4. Proprietário pode compartilhar acesso com outros usuários

### **2. Execução do Inventário**

1. Acesso à página específica do inventário
2. Busca por números de tombo
3. Confirmação ou cadastro de itens
4. Atualização de status e localização

### **3. Colaboração Segura**

1. Proprietário adiciona colaboradores por email
2. Colaboradores acessam o inventário normalmente
3. Todas as ações são auditadas individualmente
4. Proprietário pode revogar acessos quando necessário

### **4. Relatórios e Análise**

1. Geração de relatórios organizados por sala
2. Geração de relatórios organizados por servidor/carga
3. Geração de relatórios organizados por valor financeiro
4. Visualização do progresso do inventário
5. Acesso protegido aos dados sensíveis

## ⚙️ Configuração e Instalação

### **Pré-requisitos**

- Node.js 18+ instalado
- PostgreSQL 13+ instalado e rodando
- Conta Google para OAuth (Google Cloud Console)

### **1. Clone e Instalação**

```bash
git clone https://github.com/tiagogarrais/inventario-tiago.git
cd inventario-tiago
npm install
```

### **2. Configuração do Banco de Dados**

1. Instale PostgreSQL em sua máquina
2. Crie um banco de dados:
   ```sql
   CREATE DATABASE inventario_tiago;
   ```

### **3. Configuração do Google OAuth**

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou use existente
3. Vá em "APIs e Serviços" > "Credenciais"
4. Crie "ID do cliente OAuth 2.0"
5. Configure URIs de redirecionamento:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

### **4. Variáveis de Ambiente**

Copie `.env.example` para `.env.local` e configure:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/inventario_tiago"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Para gerar NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### **5. Configuração do Prisma**

```bash
# Executar migrações do banco
npx prisma migrate dev

# Gerar cliente Prisma
npx prisma generate
```

### **6. Execução**

**Desenvolvimento local:**

```bash
npm run dev
```

**Acesso na rede local:**

```bash
npm run dev -- -H 0.0.0.0
```

Acesse via `http://[IP-DA-MAQUINA]:3000`

**Produção local:**

```bash
npm run build && npm run start
```

## 🔧 Tecnologias Utilizadas

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Autenticação**: NextAuth.js com Google OAuth
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL 13+
- **ORM**: Prisma ORM com TypeScript
- **Auditoria**: Logs estruturados no PostgreSQL
- **Processamento**: CSV Parser para arquivos .csv
- **Deploy**: Vercel com PostgreSQL (Neon/Supabase)

## 📁 Estrutura do Projeto

```
src/app/
├── api/                    # APIs do backend
│   ├── auth/              # Configuração NextAuth
│   ├── upload/            # Upload de inventários
│   ├── permissoes/        # Gerenciamento de acessos
│   ├── verificar-acesso/  # Verificação de permissões
│   ├── listar/            # Listagem de inventários
│   ├── add-inventario/    # Adição de itens
│   ├── update-inventario/ # Atualização de itens
│   ├── correcao-inventario/ # API de correções v2.1.0
│   ├── correcoes/         # Histórico de correções v2.1.0
│   ├── correcoes-json/    # API JSON de correções v2.1.0
│   ├── cabecalhos/        # API de cabeçalhos
│   └── salas/             # API de salas
├── components/            # Componentes React
│   ├── Cabecalho.js      # Header com auth
│   ├── Criar.js          # Upload de arquivos
│   ├── Listar.js         # Lista de inventários
│   ├── Cadastrar.js      # Cadastro de itens
│   └── GerenciadorPermissoes.js # Gerenciar usuários
├── inventario/[nome]/     # Páginas dinâmicas de inventário
├── relatorio/[nome]/      # Páginas de relatórios
├── cadastrar/             # Página de cadastro
├── debug/                 # Página de debug
├── lib/                   # Utilitários e serviços
│   ├── db.js             # Configuração Prisma
│   └── services.js       # Services + CorrecaoService v2.1.0
├── prisma/               # Schema e migrações
│   ├── schema.prisma     # Modelo de dados + correções v2.1.0
│   └── migrations/       # Migrações do banco
├── public/               # Arquivos públicos
│   ├── Telas/           # Screenshots do sistema (01.jpg - 13.jpg)
│   └── exemplo-json/    # Arquivo de exemplo para download
│       └── inventario.json # Dados fictícios para teste
└── layout.js             # Layout principal
```

## 🚀 Deploy e Produção

### **Deploy no Vercel**

Sistema totalmente compatível com Vercel usando PostgreSQL:

1. **Configure o banco PostgreSQL** (Neon, Supabase, ou outro)
2. **Configure as variáveis de ambiente** no Vercel
3. **Deploy automático** via Git

```bash
# Build otimizado
npm run build

# Produção local
npm run start

# Com acesso na rede
npm run start -- -H 0.0.0.0
```

### **Variáveis de Ambiente para Produção**

```bash
# Database (exemplo Neon)
DATABASE_URL="postgresql://username:password@host.neon.tech/database?sslmode=require"

# NextAuth
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=your-production-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### **Deploy com Docker**

O projeto inclui um Dockerfile multi-stage otimizado para produção:

```bash
# Build da imagem
docker build -t gitlab.ifce.edu.br:5050/projetos/inventario-tiago:1.0.0 .

# Executar localmente
docker run -p 3000:3000 --env-file .env gitlab.ifce.edu.br:5050/projetos/inventario-tiago:1.0.0

# Push para o GitLab Container Registry
docker push gitlab.ifce.edu.br:5050/projetos/inventario-tiago:1.0.0
```

### **Repositórios Remotos (GitHub + GitLab)**

O projeto está configurado com dois remotes Git para manter os repositórios sincronizados:

| Remote   | URL                                                    |
| -------- | ------------------------------------------------------ |
| `origin` | `git@github.com:tiagogarrais2/inventario-tiago.git`    |
| `gitlab` | `git@gitlab.ifce.edu.br:projetos/inventario-tiago.git` |

```bash
# Push para o GitHub
git push origin main

# Push para o GitLab
git push gitlab main

# Push para ambos
git push origin main && git push gitlab main
```

### **Comandos Úteis**

```bash
# Visualizar banco de dados
npx prisma studio

# Reset do banco (cuidado em produção!)
npx prisma migrate reset

# Deploy de nova migração
npx prisma migrate deploy
```

## 🎉 Novidades da Versão 2.2.0

### **🗑️ Sistema de Exclusão de Inventários**

- **Exclusão segura**: Apenas proprietários podem excluir seus inventários
- **Confirmação dupla**: Sistema de proteção contra exclusões acidentais
- **Exclusão em cascata**: Remove automaticamente todos os dados relacionados
- **Auditoria completa**: Logs detalhados de todas as exclusões
- **Interface intuitiva**: Botão visível apenas para proprietários

### **🔔 Sistema de Notificações Centralizado**

- **Notificações unificadas**: Sistema padrão para todos os feedbacks
- **Múltiplos tipos**: Sucesso, erro, informação e alerta
- **Auto-dismiss**: Remoção automática configurável
- **Fila inteligente**: Múltiplas notificações organizadas
- **Design responsivo**: Adaptação para todos os dispositivos

### **⚙️ Melhorias de UX e Padronização**

- **Componente Button universal**: Comportamento padronizado em toda aplicação
- **Bloqueio automático**: Prevenção de cliques duplos (5 segundos)
- **Feedback visual**: Indicadores de estado durante processamento
- **Upload aprimorado**: Limpeza automática de campos após envio
- **Highlights visuais**: Destaque para novos inventários criados

## 🎉 Novidades da Versão 2.1.0

### **🔧 Sistema de Correções Completo**

- **API de Correção**: Endpoint robusto para salvar correções com comparação inteligente de campos
- **Histórico Detalhado**: Página HTML estilizada mostrando todas as correções cronologicamente
- **Integração Visual**: Sistema de badges e bordas coloridas nos relatórios para identificar status
- **Links Diretos**: Navegação entre inventário, relatórios e histórico de correções

### **🎨 Indicadores Visuais Avançados**

- 🟢 **Badge INVENTARIADO**: Para itens confirmados durante inventário
- 🟠 **Badge CORRIGIDO**: Para itens que sofreram correções
- 🔵 **Badge CADASTRADO**: Para itens adicionados durante o inventário
- **Bordas Coloridas**: Sistema de prioridade visual por status
- **Posicionamento Inteligente**: Badges sem sobreposições para impressão perfeita

### **🧠 Lógica Inteligente**

- **Comparação de Campos**: Sistema só salva mudanças reais, preserva valores originais
- **CorrecaoService**: Serviço especializado para gerenciar correções
- **APIs Especializadas**: Endpoints JSON e HTML para máxima flexibilidade
- **Navegação Integrada**: Links contextuais em todo o sistema

## 🎉 Versão 2.1.2 (Correções de Deploy e Migração)

### **🛠️ Solução Definitiva para Deploy na Vercel**

- **Prisma db push**: Substituição de migrações problemáticas por sincronização direta
- **Script de Verificação**: `ensure-database.mjs` para criação automática de tabelas
- **Postinstall Robusto**: Triple safety com generate + db push + verificação
- **Zero Dependências**: Sistema funciona independente de histórico de migrações
- **À Prova de Falhas**: Cria tabelas manualmente se necessário
- **Deploy Limpo**: Resolve definitivamente erros P3015 e P2021

### **🔧 Melhorias Técnicas**

- **Source Maps**: Desabilitados em produção para performance
- **Logs Otimizados**: Removido debug verboso após resolução
- **API de Fallback**: Endpoint manual para criação de tabelas
- **Verificação Automática**: Testa estrutura do banco a cada deploy

## 🎉 Versão 2.1.1 (Correções de Deploy - Anteriormente)

### **🚀 Correções de Build e Deploy**

- **ESLint**: Corrigidas aspas não escapadas que impediam o build na Vercel
- **React/JSX**: Substituição de `"` por `&quot;` em strings JSX
- **Deploy**: Compilação agora funciona perfeitamente em produção
- **Estabilidade**: Build local e remoto 100% funcional

## 🎉 Versão 2.0.0 (Anteriormente)

### **🗄️ Migração para PostgreSQL**

- Substituição completa do sistema de arquivos JSON por banco PostgreSQL
- Performance drasticamente melhorada
- Integridade referencial e consistência de dados
- Compatibilidade total com Vercel e outras plataformas

### **🏷️ Marcação de Itens Cadastrados**

- Itens cadastrados durante inventário recebem marcação especial
- Badge visual nos relatórios para identificação
- Campo `cadastradoDuranteInventario` no banco para relatórios futuros

### **🔗 Navegação Aprimorada**

- Nome do inventário no relatório é clicável (link para inventário)
- Navegação fluida entre páginas
- UX melhorada com pré-preenchimento automático

### **👤 Correções de UX**

- Exibição correta do nome real dos inventariantes
- Correção de datas nas permissões
- Botão de revogar acesso funcionando corretamente
- Criação automática de usuários ao conceder permissões

### **📊 Relatórios Melhorados**

- Salas vazias aparecem nos relatórios
- Identificação visual de itens cadastrados vs encontrados
- Dados em tempo real do banco de dados

## 👨‍💻 Autor

**Tiago das Graças Arrais**

- GitHub: [@tiagogarrais](https://github.com/tiagogarrais)

---

## 📈 Changelog

### **v2.2.0** - 04/10/2025

- ✅ **Sistema de exclusão de inventários**: Funcionalidade completa para proprietários
- ✅ **Sistema de notificações**: Componente centralizado para todos os feedbacks
- ✅ **Componente Button universal**: Padronização com bloqueio automático
- ✅ **Melhorias de UX**: Upload aprimorado e highlights visuais
- ✅ **Segurança aprimorada**: Confirmação dupla e auditoria de exclusões

### **v2.1.2** - 02/10/2025

- ✅ **Correções de deploy**: Problemas com Prisma e banco PostgreSQL
- ✅ **Migração automática**: Scripts de migração para produção
- ✅ **Estabilidade**: Correções de bugs em produção

### **v2.1.1** - 01/10/2025

- ✅ **Correções de deploy**: Ajustes para Vercel
- ✅ **Otimizações**: Performance e estabilidade

### **v2.1.0** - 30/09/2025

- ✅ **Sistema de correções**: Funcionalidade completa de correção de dados
- ✅ **Histórico de alterações**: Rastreamento cronológico completo
- ✅ **Interface aprimorada**: Badges visuais e navegação integrada
- ✅ **API robusta**: Endpoints especializados para correções

### **v3.1.0** - 17/03/2026

- 📋 **NEW**: Botão "Minhas Pendências" na página do inventário (`/inventario/[nome]`)
- 🔍 **NEW**: Filtro automático por carga atual do usuário logado no relatório por servidor (`?meus=true`)
- 🔗 **NEW**: API `/api/servidores/meu` retorna servidores vinculados ao email do usuário logado
- 🎯 **NEW**: Banner informativo exibindo cargas atuais filtradas do usuário
- ⚠️ **NEW**: Aviso quando nenhum servidor está vinculado ao email do usuário
- 🔒 **SECURITY**: API não expõe emails de outros servidores

### **v2.4.1** - 20/01/2026

- 💰 **NEW**: Relatório de itens ordenados por valor financeiro (`/relatorios/nome/itens-por-valor`)
- 📊 **NEW**: Lista corrida de todos os itens organizados do maior para menor valor depreciado
- 💱 **NEW**: Formatação automática de valores em moeda brasileira (R$)
- 📈 **NEW**: Informações agregadas no relatório: total de itens e valor total depreciado
- 🔄 **NEW**: Conversão inteligente de strings de valor para ordenação numérica
- 🎯 **NEW**: Botão "💰 Itens ordenados por valor" na página de relatórios
- ✅ **ENHANCED**: Modal de inventário no relatório por valor com dropdown de salas
- 📋 **ENHANCED**: Mantém todas as funcionalidades dos outros relatórios (badges, correções, inventário direto)

### **v2.4.0** - 24/12/2025

- 🚀 **NEW**: Preparação para novas funcionalidades da versão 2.4.0
- 📦 **BUILD**: Atualização da versão do projeto para 2.4.0
- 📚 **DOCS**: Documentação atualizada para refletir a nova versão

### **v2.3.0** - 24/12/2025

- 📝 **NEW**: Campo `observacoesInventario` no schema Prisma para anotações durante inventário
- 📊 **NEW**: Relatório por servidor/carga atual (`/relatorio-por-servidor/nome`)
- 🎯 **NEW**: Inventário direto dos relatórios com botão "Inventariar Item"
- 📋 **NEW**: Modal completo de inventário nos relatórios (igual à página de inventário)
- 🔽 **ENHANCED**: Campo "Sala Encontrada" transformado em dropdown com salas disponíveis
- 📝 **ENHANCED**: Campo de observações adicionado aos formulários de inventário
- 📊 **ENHANCED**: Observações aparecem nos relatórios quando presentes
- 🔄 **ENHANCED**: Atualização instantânea do estado dos relatórios após inventário
- ✅ **ENHANCED**: Pré-preenchimento de observações existentes nos formulários
- 🎨 **ENHANCED**: Interface consistente entre página de inventário e modal dos relatórios

### **v2.0.0** - 28/09/2025

- 🗄️ **BREAKING**: Migração completa para PostgreSQL com Prisma ORM
- 🏷️ **NEW**: Marcação especial para itens cadastrados durante inventário
- 🔗 **NEW**: Links navegáveis entre relatório e inventário
- 👤 **FIX**: Correção na exibição de nomes de inventariantes
- 📊 **FIX**: Relatórios agora mostram salas vazias
- 🔧 **FIX**: Correções em permissões e UX geral
- 🚀 **NEW**: Deploy total no Vercel com banco PostgreSQL
- 📸 **NEW**: 13 screenshots do sistema disponíveis no repositório
- 🧪 **NEW**: Arquivo de exemplo para download e teste
- 📁 **NEW**: Pasta public/ liberada para versionamento completo
- 📖 **NEW**: Guia completo para usuários finais (comissões inventariantes)
- 🎨 **NEW**: Página inicial redesenhada com seção de teste

### **v1.0.0** - Versão inicial

- Sistema baseado em arquivos JSON
- Autenticação Google OAuth
- Controle de permissões básico

---

**🎯 Sistema de Inventário v2.0.0 - Robusto, Escalável e Pronto para Produção!**
