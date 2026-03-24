# Prompt de Segurança — Studio Ana App

> Cole este prompt diretamente no Gemini (ou qualquer outro LLM).

---

## Contexto

Tenho um app React + Vite chamado **studio-ana-app**. É um sistema interno de gestão para um estúdio de mega hair com duas telas: Agenda e Estoque. O backend é uma API REST (Node.js).

Preciso que você corrija **falhas de segurança** identificadas em uma auditoria. Vou te passar os arquivos com problemas e a descrição exata do que precisa ser corrigido.

---

## Falhas a corrigir

### 🔴 Crítico 1 — Token JWT no localStorage (App.jsx)

**Problema:** O token de autenticação está sendo salvo em `localStorage`, que é vulnerável a ataques XSS.

**Trecho atual:**
```js
localStorage.setItem('tokenAnaStudio', dados.token);
// ...
const [isLogado, setIsLogado] = useState(!!localStorage.getItem('tokenAnaStudio'));
// ...
localStorage.removeItem('tokenAnaStudio');
```

**O que quero:** Migrar para cookies `HttpOnly` com `SameSite=Strict`. O cookie deve ser setado pelo backend no login e lido automaticamente pelo browser. O frontend não deve mais usar `localStorage` para o token.

> Obs: se a mudança exigir alteração no backend Node.js, descreva o que precisa mudar lá também.

---

### 🔴 Crítico 2 — Token nunca enviado nas requisições (Agenda.jsx e Estoque.jsx)

**Problema:** Após o login, o token é salvo mas **nenhuma chamada `fetch`** o envia no header. Os endpoints ficam desprotegidos.

**Exemplo do problema (Agenda.jsx):**
```js
const resposta = await fetch(`${import.meta.env.VITE_API_URL}/agendamentos`);
```

**O que quero:** Todas as chamadas `fetch` nos arquivos `Agenda.jsx` e `Estoque.jsx` devem incluir o header de autorização:
```js
headers: {
  'Authorization': `Bearer ${TOKEN_AQUI}`
}
```

Crie uma função utilitária `authFetch(url, options)` em um arquivo separado (ex: `src/utils/authFetch.js`) que já adiciona o header automaticamente, e substitua todos os `fetch()` existentes por ela.

---

### 🟠 Médio 1 — Sem validação de entrada (Agenda.jsx e Estoque.jsx)

**Problema:** Campos como `nome`, `telefone`, `notas` e `descricao` não têm validação de tamanho ou formato.

**O que quero:**
- Campo `telefone`: validar formato `(XX) XXXXX-XXXX` com regex
- Campo `nome` e `descricao`: limitar a 100 caracteres
- Campo `notas`: limitar a 500 caracteres
- Mostrar mensagem de erro inline abaixo do campo quando inválido (sem usar `alert()`)

---

### 🟠 Médio 2 — Sem rate limiting no login (App.jsx e Login.jsx)

**Problema:** O formulário de login não limita tentativas falhas.

**O que quero:**
- Após 3 tentativas falhas, desabilitar o botão de login por 30 segundos
- Mostrar contador regressivo: "Tente novamente em 28s..."
- Resetar o contador após login bem-sucedido

---

### 🟠 Médio 3 — Sem Content Security Policy (index.html)

**Problema:** O `index.html` não define CSP, permitindo execução de scripts externos injetados.

**O que quero:** Adicionar a meta tag CSP adequada para uma SPA React com Vite:
```html
<meta http-equiv="Content-Security-Policy" content="...">
```
Sugira o valor mais restritivo possível que ainda permita o app funcionar normalmente.

---

## Arquivos para referência

Vou colar abaixo o conteúdo atual de cada arquivo relevante. Aplique as correções mantendo o estilo visual e a lógica de negócio existentes.

### App.jsx
```jsx
// [COLE O CONTEÚDO DO App.jsx AQUI]
```

### Agenda.jsx
```jsx
// [COLE O CONTEÚDO DO Agenda.jsx AQUI]
```

### Estoque.jsx
```jsx
// [COLE O CONTEÚDO DO Estoque.jsx AQUI]
```

### index.html
```html
// [COLE O CONTEÚDO DO index.html AQUI]
```

---

## O que espero como resposta

1. O código corrigido de cada arquivo (completo, não só os trechos)
2. O novo arquivo `src/utils/authFetch.js`
3. Uma lista do que foi alterado em cada arquivo
4. Se necessário, as mudanças correspondentes no backend Node.js para suportar cookies HttpOnly

**Não altere nada além do que foi pedido. Mantenha o design, as classes Tailwind e a lógica de negócio intactos.**
