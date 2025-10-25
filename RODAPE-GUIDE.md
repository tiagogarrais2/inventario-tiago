# Componente Rodape

## Visão Geral

O componente `Rodape` é um rodapé compacto que exibe informações essenciais de copyright e licença MIT em no máximo 3 linhas de altura.

## Funcionalidades

- ✅ Exibe informações da licença MIT de forma concisa
- ✅ Mostra dados do autor e ano atual
- ✅ Link direto para o repositório no GitHub
- ✅ Design responsivo e compacto
- ✅ Altura máxima de 3 linhas

## Estrutura do Rodapé

O rodapé compacto contém:

### Linha Superior (Desktop) / Primeira Linha (Mobile)

- Nome do sistema e versão
- Nome do autor/desenvolvedor
- Copyright com ano dinâmico
- Licença MIT

### Linha Inferior (Desktop) / Segunda Linha (Mobile)

- Link do GitHub
- Instituição (IFCE - Campus Tianguá)

## Layout Responsivo

- **Mobile**: Informações empilhadas verticalmente
- **Desktop**: Informações distribuídas horizontalmente
- **Altura**: Limitada a no máximo 3 linhas de texto

## Implementação Técnica

```jsx
<footer className="bg-gray-800 text-white py-4 mt-auto">
  <div className="max-w-6xl mx-auto px-4">
    <div className="flex flex-col sm:flex-row justify-between items-center">
      {/* Informações principais */}
      {/* Link do GitHub e instituição */}
    </div>
  </div>
</footer>
```
