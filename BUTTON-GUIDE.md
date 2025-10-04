# Componente Button - Guia de Uso

## 📋 Visão Geral

O componente `Button` foi criado para ser usado como padrão em toda a aplicação, substituindo os elementos `<button>` nativos do HTML. Ele implementa automaticamente um sistema de bloqueio que previne cliques duplos e dá feedback visual ao usuário.

## ✨ Características Principais

### 🔒 **Bloqueio Automático**

- Após o clique, o botão fica desabilitado por **5 segundos** (configurável)
- Previne cliques duplos acidentais
- Melhora a experiência do usuário

### 🎨 **Feedback Visual**

- Botão fica **esmaecido** (50% opacidade) quando bloqueado
- Cursor muda para `not-allowed` durante o bloqueio
- Transição suave de opacidade (0.2s)

### ⚙️ **Configurável**

- Tempo de bloqueio personalizável
- Mantém todas as props nativas do botão
- Suporte completo a estilos CSS e classes

## 🚀 Como Usar

### Importação

```javascript
import Button from "../components/Button";
// ou
import Button from "./Button"; // dependendo da localização
```

### Uso Básico

```javascript
// Substituir isto:
<button onClick={() => router.push("/algum-lugar")}>
  Navegar
</button>

// Por isto:
<Button onClick={() => router.push("/algum-lugar")}>
  Navegar
</Button>
```

### Uso Avançado

```javascript
<Button
  onClick={handleSubmit}
  disabled={isLoading}
  className="minha-classe-css"
  style={{ backgroundColor: "#007bff" }}
  disableTime={3000} // 3 segundos em vez de 5
  type="submit"
>
  Salvar Dados
</Button>
```

## 📝 Props Disponíveis

| Prop          | Tipo      | Padrão  | Descrição                          |
| ------------- | --------- | ------- | ---------------------------------- |
| `children`    | ReactNode | -       | Conteúdo do botão                  |
| `onClick`     | Function  | -       | Função executada no clique         |
| `disabled`    | Boolean   | `false` | Desabilita o botão externamente    |
| `disableTime` | Number    | `5000`  | Tempo de bloqueio em milissegundos |
| `style`       | Object    | `{}`    | Estilos inline                     |
| `className`   | String    | `""`    | Classes CSS                        |
| `...props`    | Any       | -       | Outras props nativas do botão      |

## � **Uso em Formulários**

O componente Button é **totalmente compatível** com formulários HTML:

### Submit de Formulário
```javascript
<form onSubmit={handleSubmit}>
  {/* campos do formulário */}
  <Button type="submit">
    Enviar Formulário
  </Button>
</form>
```

### Características especiais para formulários:
- ✅ **Preserva o comportamento nativo** de submit quando `type="submit"`
- ✅ **Previne múltiplos submits** com bloqueio visual
- ✅ **Compatível com validação HTML5** (required, etc.)
- ✅ **Funciona com bibliotecas de formulário** (React Hook Form, Formik, etc.)

## �🔄 Migração

### ✅ **Migração Completa!**

Todos os botões da aplicação agora usam o componente `Button` padrão com bloqueio automático de 5 segundos.

### Para Novos Desenvolvimentos:

1. **Sempre use o componente Button:**

   ```javascript
   import Button from "../../components/Button"; // ajuste o caminho
   ```

2. **Substitua botões nativos:**

   ```javascript
   // Antes:
   <button onClick={handleClick} className="btn-class">
     Texto
   </button>

   // Agora:
   <Button onClick={handleClick} className="btn-class">
     Texto
   </Button>
   ```

3. **Benefícios automáticos:**
   - Bloqueio de 5 segundos após clique
   - Feedback visual (50% opacidade)
   - Prevenção de cliques duplos
   - Cursor `not-allowed` quando bloqueado

## 🔧 Personalização

### Alterando o Tempo Padrão

```javascript
<Button disableTime={3000}>
  {" "}
  {/* 3 segundos */}
  Ação Rápida
</Button>
```

### Desabilitando o Bloqueio Temporário

```javascript
<Button disableTime={0}>
  {" "}
  {/* Sem bloqueio automático */}
  Sem Bloqueio
</Button>
```

### Estilos Personalizados

```javascript
<Button
  style={{
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
  }}
>
  Botão Verde
</Button>
```

## 📖 Exemplo Completo

```javascript
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Button from "../components/Button";

export default function ExemploPage() {
  const router = useRouter();

  const handleSave = () => {
    // Lógica de salvamento
    console.log("Salvando...");
  };

  return (
    <div>
      <h1>Exemplo de Uso</h1>

      {/* Botão básico */}
      <Button onClick={() => router.push("/")}>Voltar ao Início</Button>

      {/* Botão com estilo personalizado */}
      <Button
        onClick={handleSave}
        style={{
          backgroundColor: "#007bff",
          color: "white",
          padding: "10px 20px",
        }}
        disableTime={3000}
      >
        Salvar (3s)
      </Button>

      {/* Botão de submit */}
      <Button type="submit" onClick={handleSave}>
        Enviar Formulário
      </Button>
    </div>
  );
}
```

---

**💡 Dica:** Use sempre o componente `Button` em novos desenvolvimentos para manter a consistência da aplicação!
