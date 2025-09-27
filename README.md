# 📋 Sistema de Inventário Tiago

Sistema completo para gerenciamento de inventários com autenticação, controle de acesso e auditoria. Desenvolvido em Next.js 15 com NextAuth para autenticação segura via Google OAuth.

## ✨ Principais Funcionalidades

### 🔐 **Autenticação e Segurança**

- **Login via Google OAuth**: Autenticação segura usando NextAuth
- **Controle de sessões**: Proteção automática de todas as páginas e APIs
- **Auditoria completa**: Logs detalhados de todas as ações do sistema
- **Proteção de dados sensíveis**: Conformidade com LGPD

### 👥 **Sistema de Permissões Granular**

- **Proprietário único**: Quem envia o inventário é o proprietário
- **Compartilhamento controlado**: Proprietário pode conceder acesso via email
- **Revogação instantânea**: Remoção de acessos a qualquer momento
- **Interface visual**: Gerenciamento fácil de usuários autorizados

### 📂 **Processamento de Inventários**

- **Upload inteligente**: Suporte para arquivos .json e .csv
- **Captura automática**: Nome do responsável obtido da sessão autenticada
- **Organização automática**: Criação de estruturas de dados organizadas
- **Rastreabilidade**: Informações completas de auditoria salvas

### 📊 **Execução de Inventário**

- **Busca por tombos**: Sistema de pesquisa rápida de itens
- **Cadastro dinâmico**: Adição de novos itens não encontrados
- **Controle de status**: Atualização do estado de conservação
- **Validação de salas**: Alertas para mudanças de localização
- **Interface otimizada**: Foco automático para agilizar o processo

### 📈 **Relatórios e Visualização**

- **Relatórios por sala**: Organização visual dos dados coletados
- **Status visual**: Indicação clara de itens inventariados
- **Acesso protegido**: Relatórios disponíveis apenas para usuários autorizados

## 🏗️ Arquitetura do Sistema

### **Estrutura de Dados Gerada**

Cada inventário enviado cria automaticamente:

```
public/inventario-[timestamp]-[responsavel]/
├── inventario.json      # Dados principais do inventário
├── cabecalhos.json      # Lista de campos/colunas
├── salas.json          # Salas únicas encontradas
├── setores.json        # Setores únicos encontrados
├── permissoes.json     # Usuários com acesso (se houver)
└── auditoria.json      # Informações de criação e proprietário
```

### **Logs de Auditoria**

Sistema robusto de auditoria com logs diários:

```
logs/auditoria-YYYY-MM-DD.log
```

**Eventos rastreados:**

- `UPLOAD_INVENTARIO` - Criação de novos inventários
- `ACESSO_INVENTARIO_AUTORIZADO` - Acessos bem-sucedidos
- `ACESSO_INVENTARIO_NEGADO` - Tentativas não autorizadas
- `PERMISSAO_CONCEDIDA` - Concessão de acessos
- `PERMISSAO_REVOGADA` - Revogação de acessos
- `ACESSO_LISTAGEM_INVENTARIOS` - Visualização de listas

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
- Conta Google para OAuth (Google Cloud Console)

### **1. Clone e Instalação**

```bash
git clone https://github.com/tiagogarrais/inventario-tiago.git
cd inventario-tiago
npm install
```

### **2. Configuração do Google OAuth**

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou use existente
3. Vá em "APIs e Serviços" > "Credenciais"
4. Crie "ID do cliente OAuth 2.0"
5. Configure URIs de redirecionamento:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

### **3. Variáveis de Ambiente**

Copie `.env.example` para `.env.local` e configure:

```bash
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

### **4. Execução**

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
- **Armazenamento**: Sistema de arquivos local (JSON)
- **Auditoria**: Logs estruturados em JSON
- **Processamento**: CSV Parser para arquivos .csv

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
│   └── update-inventario/ # Atualização de itens
├── components/            # Componentes React
│   ├── Cabecalho.js      # Header com auth
│   ├── Criar.js          # Upload de arquivos
│   ├── Listar.js         # Lista de inventários
│   └── GerenciadorPermissoes.js # Gerenciar usuários
├── inventario/[nome]/     # Páginas dinâmicas de inventário
├── relatorio/[nome]/      # Páginas de relatórios
├── lib/                   # Utilitários
│   ├── auditoria.js      # Sistema de logs
│   └── permissoes.js     # Controle de acesso
└── layout.js             # Layout principal
```

## 🚀 Deploy e Produção

### **Limitações Atuais**

- **Sistema de arquivos local**: Funciona perfeitamente em ambiente local
- **Vercel (Hobby)**: Sistema de arquivos read-only impede escrita de JSONs

### **Deploy Recomendado**

```bash
# Build otimizado
npm run build

# Produção
npm run start

# Com acesso na rede
npm run start -- -H 0.0.0.0
```

## 👨‍💻 Autor

**Tiago das Graças Arrais**

- GitHub: [@tiagogarrais](https://github.com/tiagogarrais)

---

**Sistema em constante evolução - Novas funcionalidades sendo adicionadas regularmente!**
