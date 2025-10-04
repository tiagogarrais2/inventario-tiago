# Sistema de Notificações - Guia de Uso

## Visão Geral

O sistema de notificações foi implementado para substituir os `alert()` e `confirm()` do navegador por notificações visuais que aparecem diretamente na tela, garantindo que todas as mensagens sejam exibidas independentemente das configurações do navegador.

## Características

### ✅ **Notificações Toast**
- Aparecem no canto superior direito da tela
- 4 tipos: `success`, `error`, `warning`, `info`
- Fechamento automático após 5 segundos (configurável)
- Fechamento manual clicando no "×"
- Múltiplas notificações simultâneas

### ✅ **Diálogos de Confirmação**
- Modal centralizado com fundo escurecido
- Botões "Cancelar" e "Confirmar"
- Substitui `window.confirm()`

### ✅ **Prompts Personalizados**
- Modal com campo de entrada de texto
- Substitui `window.prompt()`
- Validação de entrada
- Suporte a teclas Enter e Escape

## Como Usar

### 1. Importar o Hook

```javascript
import { useNotifications } from "../components/Notifications";

// No componente
const { showSuccess, showError, showWarning, showInfo, showConfirmation, showPrompt } = useNotifications();
```

### 2. Notificações Simples

```javascript
// Sucesso (verde)
showSuccess("Operação realizada com sucesso!");

// Erro (vermelho)
showError("Erro ao processar solicitação");

// Aviso (amarelo)
showWarning("Atenção: verifique os dados");

// Informação (azul)
showInfo("Processamento iniciado");

// Com duração personalizada (em ms)
showSuccess("Mensagem", 3000); // 3 segundos
showError("Erro crítico", 0); // Não remove automaticamente
```

### 3. Confirmações

```javascript
// Substituir window.confirm()
showConfirmation(
  "Tem certeza que deseja excluir este item?",
  () => {
    // Confirmado
    console.log("Usuário confirmou");
  },
  () => {
    // Cancelado
    console.log("Usuário cancelou");
  }
);

// Mensagens multilinha
showConfirmation(
  `⚠️ ATENÇÃO: Esta ação é irreversível!\n\n` +
  `Você está prestes a excluir:\n` +
  `• Todos os dados\n` +
  `• Todas as configurações\n\n` +
  `Deseja continuar?`,
  onConfirm,
  onCancel
);
```

### 4. Prompts de Entrada

```javascript
// Substituir window.prompt()
showPrompt(
  "Digite o nome do novo inventário:",
  "Nome padrão", // placeholder
  (valor) => {
    // Usuário digitou e confirmou
    console.log("Valor digitado:", valor);
  },
  () => {
    // Usuário cancelou
    console.log("Prompt cancelado");
  }
);

// Validação personalizada
showPrompt(
  "Para confirmar, digite EXCLUIR:",
  "Digite EXCLUIR",
  (texto) => {
    if (texto !== "EXCLUIR") {
      showError("Texto incorreto!");
      return;
    }
    // Prosseguir com a ação
    executarExclusao();
  }
);
```

## Migrações Realizadas

### Antes (usando alerts do navegador):
```javascript
// ❌ Antigo - pode ser bloqueado pelo navegador
alert("Erro ao salvar");
if (confirm("Deseja continuar?")) {
  // ação
}
const nome = prompt("Digite seu nome:");
```

### Depois (usando sistema personalizado):
```javascript
// ✅ Novo - sempre funciona
showError("Erro ao salvar");
showConfirmation("Deseja continuar?", () => {
  // ação confirmada
});
showPrompt("Digite seu nome:", "", (nome) => {
  // usar o nome digitado
});
```

## Arquivos Migrados

1. **`/src/app/inventario/[nome]/page.js`**
   - ✅ Alerts de erro → `showError()`
   - ✅ Confirmação de exclusão → `showConfirmation()` + `showPrompt()`
   - ✅ Mensagem de sucesso → `showSuccess()`

2. **`/src/app/components/Cadastrar.js`**
   - ✅ Alerts de erro → `showError()`

3. **`/src/app/components/GerenciadorPermissoes.js`**
   - ✅ Confirmação de remoção → `showConfirmation()`

## Vantagens do Novo Sistema

### 🚀 **Confiabilidade**
- Nunca é bloqueado pelo navegador
- Funciona mesmo com pop-ups desabilitados
- Consistente em todos os navegadores

### 🎨 **Visual Melhorado**
- Design moderno e responsivo
- Cores padronizadas por tipo de mensagem
- Animações suaves
- Melhor UX

### 🔧 **Flexibilidade**
- Duração configurável
- Múltiplas notificações simultâneas
- Estilos personalizáveis
- Fácil extensão

### 📱 **Responsivo**
- Funciona em desktop e mobile
- Posicionamento inteligente
- Touch-friendly

## Configuração Global

O sistema está automaticamente disponível em toda a aplicação através do `NotificationProvider` no arquivo `layout.js`. Não é necessária configuração adicional.

## Estilos CSS

As notificações usam classes Tailwind CSS para estilização:
- `success`: Fundo verde (`bg-green-500`)
- `error`: Fundo vermelho (`bg-red-500`) 
- `warning`: Fundo amarelo (`bg-yellow-500`)
- `info`: Fundo azul (`bg-blue-500`)

## Conclusão

O sistema de notificações personalizado oferece uma experiência muito mais confiável e visualmente agradável comparado aos alerts/confirms nativos do navegador, garantindo que todas as mensagens importantes sejam sempre exibidas para o usuário.