# TimerText Component Guide

## Visão Geral

O componente `TimerText` é um componente React reutilizável que exibe uma contagem regressiva textual, ideal para situações onde você quer dar feedback ao usuário sobre processos de carregamento ou espera.

## Funcionalidades

- ✅ Contagem regressiva automática a cada 1 segundo
- ✅ Validação de tipos dos props recebidos
- ✅ Fallback seguro para valores inválidos
- ✅ Interface limpa e reutilizável
- ✅ Limpeza automática de timers
- ✅ Suporte a JSX em `finalText` para conteúdo complexo

## Props

| Prop          | Tipo                  | Padrão                            | Descrição                                                           |
| ------------- | --------------------- | --------------------------------- | ------------------------------------------------------------------- |
| `initialTime` | `number`              | `3`                               | Tempo inicial da contagem em segundos. Deve ser um número positivo. |
| `finalText`   | `string \| ReactNode` | `"Nenhum inventário disponível."` | Conteúdo exibido após a contagem terminar. Pode ser texto ou JSX.   |

## Validações Internas

O componente possui validações robustas:

- **`initialTime`**: Se não for um número positivo, usa o valor padrão de 3 segundos
- **`finalText`**: Se não for uma string ou elemento React válido, usa o texto padrão

## Exemplos de Uso

### Uso Básico (valores padrão)

```jsx
import TimerText from "./components/TimerText";

// Exibe contagem de 3 segundos, depois "Nenhum inventário disponível."
{
  inventarios.length === 0 && <TimerText />;
}
```

### Uso Personalizado

````jsx
// Contagem de 5 segundos, texto personalizado
{
  inventarios.length === 0 && (
    <TimerText
      initialTime={5}
      finalText="Lista vazia - tente novamente mais tarde"
    />
  );
### Com JSX (conteúdo complexo)

```jsx
// Acesso negado com link para suporte
{
  showAccessDeniedTimer && (
    <TimerText
      initialTime={5}
      finalText={
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h2>🚫 Acesso Negado</h2>
          <p>Você não tem permissão para acessar este inventário.</p>
          <p>
            <a href="/dashboard" style={{ color: "#0070f3" }}>
              Voltar ao Dashboard
            </a>
          </p>
        </div>
      }
    />
  );
}
````

```jsx
// Carregamento de dados
{
  loading && <TimerText initialTime={2} finalText="Falha ao carregar dados" />;
}

// Verificação de conexão
{
  !connected && (
    <TimerText initialTime={10} finalText="Sem conexão com o servidor" />
  );
}
```

## Estados Visuais

### Durante a contagem

```jsx
<li style={{ color: "#666", fontStyle: "italic" }}>
  Carregando inventários... ({timeLeft}s)
</li>
```

### Após a contagem

```jsx
<li>{finalText}</li>
```

## Casos de Uso Recomendados

1. **Listas vazias após carregamento**
2. **Timeouts de carregamento**
3. **Verificações de conectividade**
4. **Feedback de operações assíncronas**
5. **Estados de transição**
6. **Mensagens de acesso negado com ações** (usando JSX)

## Implementação Técnica

```jsx
"use client";

import { useState, useEffect } from "react";
import React from "react";

export default function TimerText({
  initialTime = 3,
  finalText = "Nenhum inventário disponível.",
}) {
  // Validações dos props
  const validatedInitialTime =
    typeof initialTime === "number" && initialTime > 0 ? initialTime : 3;
  const validatedFinalText =
    typeof finalText === "string" || React.isValidElement(finalText)
      ? finalText
      : "Nenhum inventário disponível.";

  const [timeLeft, setTimeLeft] = useState(validatedInitialTime);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (timeLeft > 0) {
    return (
      <li style={{ color: "#666", fontStyle: "italic" }}>
        Carregando inventários... ({timeLeft}s)
      </li>
    );
  }

  return <li>{validatedFinalText}</li>;
}
```

## Boas Práticas

1. **Use tempos razoáveis**: Evite tempos muito longos (>10s) para não frustrar o usuário
2. **Mensagens claras**: O texto final deve ser informativo sobre o que aconteceu
3. **Contextualização**: Adapte o texto às diferentes situações de uso
4. **Feedback visual**: Combine com outros indicadores visuais se necessário
5. **JSX válido**: Quando usar JSX em `finalText`, certifique-se de que é um elemento React válido

## Troubleshooting

### Timer não inicia

- Verifique se `initialTime` é um número positivo
- Confirme se o componente está sendo renderizado corretamente

### Texto não aparece

- Verifique se `finalText` é uma string válida ou um elemento React válido
- Confirme se o timer chegou a 0

### JSX não renderiza

- Certifique-se de que o JSX passado é um elemento React válido
- Verifique se `React` está importado quando usar JSX

### Performance

- O componente limpa automaticamente os timers quando desmonta
- Use apenas quando necessário para evitar timers desnecessários

## Arquivos Relacionados

- `src/app/components/TimerText.js` - Implementação do componente
- `src/app/components/Listar.js` - Exemplo de uso no componente Listar
- `src/app/inventario/[nome]/page.js` - Exemplo de uso com JSX para acesso negado
