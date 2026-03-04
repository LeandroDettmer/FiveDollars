# FiveDollars

Cliente HTTP desktop (alternativa ao Postman/Insomnia) com **React** e **Tauri**, usando CSS puro (sem Tailwind). Requisições são enviadas pelo plugin HTTP do Tauri no processo nativo, evitando CORS do navegador.

---

## Pré-requisitos

- **Node.js** 18+
- **Rust** (para o Tauri): [rustup.rs](https://rustup.rs)
- **npm** ou outro gerenciador de pacotes

---

## Como rodar

```bash
npm install
npm run tauri dev
```

O primeiro build do Rust pode demorar alguns minutos.

---

## Gerar executável (app instalável)

### 1. Ícone (opcional)

Use uma imagem **1024×1024 px** (PNG) e gere os ícones:

```bash
npm run tauri icon caminho/para/sua-imagem-1024.png
```

### 2. Build

```bash
npm install
npm run tauri build
```

### 3. Onde está o executável

| Plataforma | Pasta (em `src-tauri/`) | Arquivos |
|------------|-------------------------|----------|
| **Windows** | `target/release/bundle/msi/` e `target/release/bundle/nsis/` | `.msi`, `.exe` |
| **macOS**   | `target/release/bundle/dmg/` e `target/release/bundle/macos/` | `.dmg`, `.app` |
| **Linux**   | `target/release/bundle/deb/` ou `target/release/bundle/appimage/` | `.deb`, `.AppImage` |

---

## Features

### Importação de collections

- **Postman v2.1**: exporte a collection como JSON (Collection v2.1) e use **Importar** na sidebar.
- **Insomnia**: importe collections Insomnia (JSON ou YAML).

Após importar, pastas e requisições aparecem na sidebar; clique numa requisição para carregar e enviar.

---

### Runner

Execute várias requisições de uma pasta em sequência:

- **Seleção**: escolha quais requisições rodar (marcar/desmarcar).
- **Iterações**: rode N vezes ou use um **arquivo de dados** (JSON com array de objetos); cada objeto vira um conjunto de variáveis por iteração.
- **Delay**: intervalo em ms entre requisições.
- **Corpo da resposta**: opção para incluir ou não o body nas entradas do histórico do run.

Abra o Runner pela pasta na sidebar (ex.: “Run folder”) e configure no painel antes de executar.

---

### Ambientes (Environments) e cores

- Crie **ambientes** na sidebar e defina variáveis (ex.: `baseUrl`, `token`).
- Use `{{nome}}` na URL, headers ou body; o ambiente ativo é aplicado antes do request.
- **Cores por ambiente**: cada ambiente pode ter uma cor (paleta fixa ou cor personalizada) para identificação rápida na lista. Clique no ambiente para ativar; duplo clique para editar nome, variáveis e cor.

Exemplo: URL `{{baseUrl}}/api/users` com ambiente `{ "baseUrl": "https://api.exemplo.com" }` vira `https://api.exemplo.com/api/users`.

---

### Scripts: Pre-request e Post-response

Por requisição (aba **Scripts** no painel da requisição):

- **Pre-request**: executado **antes** do envio.
  - API: `fv.environment.get(key)` / `fv.environment.set(key, value)`.
  - Se a requisição pertencer a uma collection: `fv.collectionVariables.get(key)` / `fv.collectionVariables.set(key, value)`.
  - Valores definidos com `set` são aplicados ao ambiente ativo (ou à collection) e usados na mesma requisição.
- **Post-response**: executado **depois** de receber a resposta.
  - API: `fv.response` (`.json()`, `.status`, `.statusText`, `.headers`, `.body`), `fv.environment.set(...)` e, se houver collection, `fv.collectionVariables.set(...)`.

Útil para tokens dinâmicos, timestamps, extrair dados da resposta e gravar em variáveis para as próximas requisições. Logs dos scripts aparecem na interface quando disponível.

---

## Requisições

Métodos: GET, POST, PUT, PATCH, DELETE. Suporte a headers, query params, path params e body (JSON, form, raw). Auth: Basic, Bearer, API Key (valores podem usar `{{var}}`).

---

## Estrutura do projeto

- **`src/`** – frontend React
  - **`components/`** – RequestPanel, ResponsePanel, Sidebar, CollectionTree, EnvironmentEditor, RunnerPanel, RunnerConfigPanel, RunnerContent, BodyEditor, etc.
  - **`store/`** – Zustand (estado global)
  - **`lib/`** – `http.ts` (fetch via Tauri), `resolveEnv.ts` (substituição de `{{var}}`), `importCollection.ts`, `runPostResponseScript.ts` (pre/post scripts), `urlUtils.ts`, parsers Postman/Insomnia
  - **`types/`** – tipos (collections, requests, environments)
- **`src-tauri/`** – backend Rust (Tauri 2 + plugin HTTP)
- **`App.css`** – tema dark (estilo VS Code), layout em colunas, CSS puro
