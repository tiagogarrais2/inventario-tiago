# 📋 Sistema de Inventário Tiago v2.0

Sistema completo para gerenciamento de inventários com banco de dados PostgreSQL, autenticação, controle de acesso e auditoria. Desenvolvido em Next.js 15 com NextAuth para autenticação segura via Google OAuth e Prisma ORM para persistência de dados.

---

## Demonstração Visual

| Relatório geral|
|:---:|
| ![Tela 13](./public/Telas/13.jpg) |

<details>
<summary>📸 <strong>Ver Screenshots do Sistema</strong></summary>

| Tela inicial | Inventários disponíveis| Criação de inventários|
|:---:|:---:|:---:|
| ![Tela 01](./public/Telas/01.jpg) | ![Tela 02](./public/Telas/02.jpg) | ![Tela 03](./public/Telas/03.jpg) |

| Realizar inventário | Nome do inventário | Cadastro da equipe |
|:---:|:---:|:---:|
| ![Tela 04](./public/Telas/04.jpg) | ![Tela 05](./public/Telas/05.jpg) | ![Tela 06](./public/Telas/06.jpg) |

<details>
<summary>🔍 <strong>Ver Mais Screenshots</strong></summary>

| Gerenciar permissões | Realizar inventário | Item inventariado |
|:---:|:---:|:---:|
| ![Tela 07](./public/Telas/07.jpg) | ![Tela 08](./public/Telas/08.jpg) | ![Tela 09](./public/Telas/09.jpg) |

| Item não encontrado| Cadastro de item | Cadastro de item 2 |
|:---:|:---:|:---:|
| ![Tela 10](./public/Telas/10.jpg) | ![Tela 11](./public/Telas/11.jpg) | ![Tela 12](./public/Telas/12.jpg) |

| Relatório geral|
|:---:|
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
- **Marcação especial**: Itens cadastrados durante inventário são identificados

### 📈 **Relatórios e Visualização Aprimorados**

- **Relatórios dinâmicos**: Dados em tempo real do PostgreSQL
- **Organização por sala**: Visualização completa incluindo salas vazias
- **Status visual**: Indicação clara de itens inventariados vs não inventariados
- **Marcação especial**: Badge para itens cadastrados durante inventário
- **Navegação integrada**: Links diretos entre relatório e inventário
- **Dados do inventariante**: Exibição correta do nome real dos usuários

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
  cadastradoDuranteInventario: Boolean
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
2. Visualização do progresso do inventário
3. Acesso protegido aos dados sensíveis

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
│   └── services.js       # Services para banco de dados
├── prisma/               # Schema e migrações
│   ├── schema.prisma     # Modelo de dados
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

### **Comandos Úteis**

```bash
# Visualizar banco de dados
npx prisma studio

# Reset do banco (cuidado em produção!)
npx prisma migrate reset

# Deploy de nova migração
npx prisma migrate deploy
```

## 🎉 Novidades da Versão 2.0.0

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
