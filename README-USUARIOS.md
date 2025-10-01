# 📋 Guia do Usuário - Sistema de Inventário

**Versão 2.0 | Para Membros de Comissões Inventariantes**

---

## Como é o Sistema?

<details>
<summary><strong>🖼️ Clique aqui para ver as telas do sistema</strong></summary>

**Não se preocupe! O sistema é bem simples e intuitivo. Veja como são as telas:**

| Tela Inicial | Lista de inventários | Criar novo inventário |
|:---:|:---:|:---:|
| ![Interface](https://github.com/tiagogarrais/inventario-tiago/raw/master/public/Telas/01.jpg) | ![Inventário](https://github.com/tiagogarrais/inventario-tiago/raw/master/public/Telas/02.jpg) | ![Relatórios](https://github.com/tiagogarrais/inventario-tiago/raw/master/public/Telas/03.jpg) |

*As telas são simples e fáceis de usar!*

</details>

---

## 👋 Bem-vindo ao Sistema de Inventário!

Este guia foi criado especialmente para **você que faz parte de uma comissão inventariante** e vai usar nosso sistema para realizar o inventário dos bens patrimoniais. Não se preocupe se você não é da área de informática - este guia explica tudo de forma simples e prática!

## 🎯 O que é o Sistema de Inventário?

É uma ferramenta online que ajuda você a:

- ✅ **Conferir** se os bens estão onde deveriam estar
- ✅ **Registrar** novos bens encontrados
- ✅ **Atualizar** informações dos bens (estado, localização)
- ✅ **Gerar relatórios** organizados por sala
- ✅ **Trabalhar em equipe** com outros membros da comissão

## 🚀 Como Começar

### 1️⃣ **Fazendo Login**

1. Acesse o link https://inventario-tiago.vercel.app
2. Clique em **"Entrar com Google"**
3. Use sua conta do Gmail
4. Pronto! Você está dentro do sistema

> 💡 **Dica**: Use sempre a mesma conta do Gmail para manter seu histórico

### 🧪 **Quer Testar Primeiro?**

Se você é responsável por criar o inventário, pode baixar um arquivo de exemplo:

1. **Na página inicial** (antes de fazer login), procure por "Teste o Sistema"
2. **Clique em "Baixar Exemplo JSON"** 
3. **Faça login** no sistema
4. **Use o arquivo baixado** para testar o upload
5. **Explore** todas as funcionalidades com dados fictícios!

> 📁 **O arquivo de exemplo** contém dados fictícios que simulam um inventário real

### 2️⃣ **Acessando um Inventário**

Depois de fazer login, você verá:

- **Lista de inventários** disponíveis para você
- **Clique no nome** do inventário que deseja trabalhar
- **Aguarde carregar** - pode demorar alguns segundos

## 📱 Como Fazer o Inventário

### 🔍 **Procurando um Item**

1. **Digite o número do tombo** no campo de pesquisa
   - Exemplo: `12345`
   - Use apenas números, sem espaços
2. **Pressione Enter** ou clique em "Confirmar"

3. **O sistema vai mostrar**:
   - ✅ **Verde**: Item encontrado no sistema
   - ❌ **Vermelho**: "Item não encontrado"

### ✅ **Quando o Item FOI ENCONTRADO**

O sistema mostra as informações do item. Agora você precisa:

1. **Verificar se as informações estão corretas**:
   - Descrição do item
   - Estado de conservação
   - Localização atual

2. **Escolher o status atual**:
   - `Em Uso` - Item está sendo usado normalmente
   - `Ocioso` - Item não está sendo usado
   - `Em Manutenção` - Item está quebrado/em conserto

3. **Confirmar se a sala está certa**:
   - Se o item não está na sala indicada, o sistema vai perguntar
   - Confirme se pode alterar a localização

4. **Clicar em "Confirmar Item Encontrado"**

> ✅ **Pronto!** Item inventariado com sucesso!

### ❌ **Quando o Item NÃO FOI ENCONTRADO**


- Clique em **"Cadastrar item"**
- Preencha as informações (explicado abaixo)

### 📝 **Cadastrando um Novo Item**

Quando clicar em "Cadastrar item", abrirá um formulário:

**Campos obrigatórios** (já vêm preenchidos):

- ✅ **Número do tombo** - Já preenchido automaticamente
- ✅ **Sala** - Já preenchida com a sala que você está inventariando
- ✅ **Data do inventário** - Preenchida automaticamente
- ✅ **Seu nome** - Preenchido automaticamente

**Campos que VOCÊ precisa preencher:**

- 📝 **Descrição**: Ex: "Mesa de escritório", "Computador Dell", "Cadeira giratória"
- 📝 **Estado de Conservação**: Escolha entre:
  - `Bom` - Item em perfeitas condições
  - `Regular` - Item com pequenos desgastes
  - `Ocioso` - Item parado, sem uso
  - `Recuperável` - Item com defeito, mas pode ser consertado
  - `Antieconômico` - Item muito danificado
- 📝 **Status**: Escolha entre "Em Uso", "Ocioso", etc.
- 📝 **Outros campos**: Preencha o que souber (marca, modelo, etc.)

**Dica importante:** 🔖 Itens cadastrados por você ganham uma **marcação especial azul** nos relatórios!

## 🏢 Organizando por Salas

### 📍 **Selecionando a Sala**

No topo da página, você vê um menu suspenso com as salas.

- **Selecione a sala** onde você está fazendo o inventário
- **Todos os itens** que você registrar serão associados a esta sala
- **Lembre-se de trocar** quando mudar de sala!

### 🚶‍♀️ **Mudando de Sala**

Quando terminar uma sala:

1. **Selecione a nova sala** no menu suspenso
2. **Continue** digitando os números dos tombos
3. **O sistema automaticamente** associa à nova sala

## 📊 Visualizando Relatórios

### 📈 **Acessando o Relatório**

1. Na página do inventário, procure por **"Ver Relatório"** ou similar
2. **Ou** substitua `/inventario/nome-do-inventario` por `/relatorio/nome-do-inventario` na URL

### 📋 **Entendendo o Relatório**

O relatório mostra **todas as salas** organizadamente:

**🟢 Itens Inventariados (fundo verde):**

- Item foi conferido e está OK
- Mostra quem fez o inventário e quando

**🔴 Itens Não Inventariados (fundo vermelho):**

- Item ainda não foi conferido
- Precisa ser localizado e inventariado

**🔵 Itens Cadastrados (borda azul + badge):**

- Item foi cadastrado durante o inventário
- Tem uma marcação especial "📝 CADASTRADO"

**📦 Salas Vazias:**

- Salas que não têm nenhum item
- Aparecem com mensagem "Nenhum item encontrado"

## 🤝 Trabalhando em Equipe

### 👥 **Vários Membros da Comissão**

- **Cada pessoa** usa sua própria conta do Gmail
- **Todas podem trabalhar** no mesmo inventário simultaneamente
- **O sistema registra** quem fez cada inventário
- **Não há conflitos** - cada pessoa pode trabalhar em salas diferentes

### 📱 **Usando em Dispositivos Móveis**

- **Funciona em celulares e tablets**
- **Use o navegador** (Chrome, Firefox, Safari)
- **Digite os tombos** normalmente
- **Interface se adapta** ao tamanho da tela

## 🔧 Problemas Comuns e Soluções

### ❓ **"Não consigo fazer login"**

- Verifique se está usando a conta Gmail certa
- Peça ao administrador para conceder acesso
- Tente fazer logout e login novamente

### ❓ **"Item não aparece quando digito o tombo"**

- Verifique se digitou o número correto
- Tente sem espaços ou caracteres especiais
- Se tem certeza que existe, cadastre como novo item

### ❓ **"Não consigo acessar o inventário"**

- Verifique se o administrador deu permissão para você
- Confirme se está usando a conta Gmail correta
- Entre em contato com o responsável pelo sistema

### ❓ **"O sistema está lento"**

- É normal, o sistema processa muitos dados
- Aguarde alguns segundos depois de cada ação
- Evite clicar várias vezes no mesmo botão

### ❓ **"Não sei qual estado de conservação escolher"**

- **Bom**: Item sem nenhum problema visível
- **Regular**: Item com riscos ou desgaste normal do uso
- **Ocioso**: Item guardado, não sendo usado
- **Recuperável**: Item com problema, mas vale a pena consertar
- **Antieconômico**: Item muito danificado, não vale consertar

## 📞 Precisa de Ajuda?

Se tiver qualquer dúvida ou problema:

1. **Primeiro**: Releia este guia
2. **Segundo**: Pergunte para outros membros da comissão
3. **Terceiro**: Entre em contato com o responsável pelo sistema

**Lembre-se**: Este sistema foi feito para facilitar sua vida! Com um pouco de prática, você vai ficar expert em fazer inventários! 💪

---

## 📝 Resumo Rápido - Passo a Passo

1. **Login** → Conta do Gmail
2. **Escolher inventário** → Clicar no nome
3. **Selecionar sala** → Menu suspenso no topo
4. **Digitar tombo** → Número no campo de busca
5. **Se encontrou** → Confirmar informações → "Confirmar Item Encontrado"
6. **Se não encontrou** → "Cadastrar item" → Preencher dados → "Enviar"
7. **Trocar de sala** → Selecionar nova sala no menu
8. **Ver progresso** → Acessar relatório do inventário

---

**🎯 Pronto! Agora você está preparado para fazer um inventário eficiente e organizado!**

_Sistema de Inventário v2.0.0 - Criado para facilitar o trabalho das comissões inventariantes_ 📋✨
