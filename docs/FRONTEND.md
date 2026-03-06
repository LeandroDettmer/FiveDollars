# Frontend — `src/`

O frontend do FiveDollars é uma aplicação **React** (Vite + TypeScript) que funciona tanto no **desktop** (Tauri) quanto no **navegador** (modo web). A UI é um cliente de API com collections, ambientes, requisições HTTP e um runner para executar pastas de requisições.

## Stack

- **React 18** + **TypeScript**
- **Vite** — build e dev server
- **Zustand** — estado global (`store/useAppStore.ts`)
- **CodeMirror** (via `@uiw/react-codemirror`) — editores de corpo (JSON, etc.)
- **Tauri** — quando rodando como app desktop: `@tauri-apps/api`, `plugin-http`, `plugin-dialog`, `plugin-updater`, `plugin-process`

## Estrutura de pastas

```
src/
├── main.tsx              # Entry point: ReactDOM.createRoot + App
├── App.tsx                # Layout principal: header, sidebar, tab bar, conteúdo por aba
├── App.css                # Estilos globais e layout
├── vite-env.d.ts          # Tipos do Vite
├── components/            # Componentes React
├── lib/                   # Utilitários e lógica de negócio
├── store/                 # Estado global (Zustand)
└── types/                 # Tipos TypeScript e interfaces
```

## Entry e layout principal

- **`main.tsx`** — Monta o `App` em `#root` com `React.StrictMode`.
- **`App.tsx`** — Carrega dados persistidos na inicialização (`loadAppData` → `setStateFromPersisted`). Renderiza:
  - Header fixo ("FiveDollars — API Client | Desktop | Web")
  - **ResizableSidebar** com **Sidebar** (collections, ambientes, histórico, sobre)
  - **TabBar** (abas de requisição e de runner)
  - Conteúdo da aba ativa:
    - Abas **runner**: **RunnerPanel** (uma por aba runner, montadas mas ocultas quando inativas para não reiniciar a execução)
    - Aba **request** ativa: **ResizableMainArea** (painel de requisição + resposta)

## Componentes (`components/`)

| Componente | Função |
|------------|--------|
| **Sidebar** | Navegação: lista de collections (árvore), ambientes, histórico, botões de import/export e "Sobre". |
| **ResizableSidebar** | Envolve a sidebar e permite redimensionar a largura. |
| **TabBar** | Abas abertas (requisições e runners); permite fechar e alternar. |
| **ResizableMainArea** | Área principal redimensionável: painel da requisição à esquerda e resposta à direita. |
| **RequestPanel** | Formulário da requisição: método, URL, headers, query, body, auth, scripts (pre-request / post-response). |
| **ResponsePanel** | Exibe status, headers, corpo e tempo da resposta. |
| **ResponseBodyView** | Visualização do corpo (JSON, texto, etc.). |
| **BodyEditor** | Editor de corpo (none / JSON / form / raw) com CodeMirror quando aplicável. |
| **EnvironmentEditor** | Edição de variáveis do ambiente. |
| **VariablePreview** | Pré-visualização de variáveis (ex.: `{{var}}` resolvidas). |
| **CollectionTree** | Árvore de pastas e requisições de uma collection. |
| **RunnerPanel** | Configuração e execução do runner (pasta de requisições, iterações, delay, arquivo de dados). |
| **RunnerModal** | Modal do runner (se usado em fluxo modal). |
| **RunnerContent** | Conteúdo da execução do runner (lista de requisições e resultados). |
| **RunnerConfigPanel** | Formulário de configuração do run (checkboxes, iterações, delay, etc.). |
| **AboutModal** | Modal "Sobre": versão, link do repo, verificar atualizações (Tauri). |
| **ConfirmModal** | Modal de confirmação genérico. |

## Estado global (`store/useAppStore.ts`)

- **Zustand** com um único store. Estado principal:
  - **Collections** e **environments**, **currentEnv**
  - **currentRequest**, **lastResponse**, **scriptLogs**
  - **history** (histórico de requisições), **runnerHistory**
  - **tabs** e **activeTabId** — abas abertas (request ou runner)
  - **tabRequestCache** — cache por aba de requisição (última resposta, logs, `sendingRequest`)
  - Estado legado do runner em painel: **runnerPanelPendingConfig**, **runnerPanelRun** (deprecated; o estado canônico está nas abas runner)

- Ações relevantes: `openTab`, `closeTab`, `setActiveTab`, `updateRunnerTab`, `updateRequestTabLabel`, `setStateFromPersisted`, `setCurrentEnv`, CRUD de collections/requests/environments, `addToHistory`, `getResolvedVariables`, etc.  
- **Persistência:** ao alterar `collections`, `environments`, `currentEnv` ou `history`, o store chama `saveAppData` (debounced/em pontos estratégicos) para persistir no backend (Tauri) ou no `localStorage` (web).

## Tipos (`types/`)

- **`index.ts`** — Modelos principais: `Environment`, `RequestConfig`, `RequestResponse`, `HistoryEntry`, `Collection`, `CollectionNode`, `RunnerHistoryEntry`, `RunnerTabRun`, `RunnerTabResult`, `RequestTab`, `RunnerTab`, `RunnerConfigFormState`, `Tab`, `KeyValue`, `ScriptLogEntry`, etc.
- **`persisted.ts`** — `PersistedData` (collections, environments, currentEnvId, history) e `DEFAULT_PERSISTED`.

## Bibliotecas e serviços (`lib/`)

| Arquivo | Função |
|---------|--------|
| **persistence.ts** | `loadAppData` / `saveAppData`: no Tauri usa `invoke("load_app_data")` e `invoke("save_app_data", { payload })`; na web usa `localStorage` com chave `FiveDollars_app_data`. |
| **http.ts** | Montagem e envio de requisições HTTP. No Tauri usa `@tauri-apps/plugin-http`; no navegador usa `fetch` e, em dev, proxy do Vite (`/__dev-proxy`) para evitar CORS. Resolve variáveis de ambiente e path params. |
| **resolveEnv.ts** | Substituição de `{{var}}` por valores do ambiente (e variáveis de collection quando aplicável). |
| **runPostResponseScript.ts** | Execução do script pós-resposta (sandbox com `fv.response`, `fv.environment`, etc.) e registro de logs. |
| **collectionTreeUtils.ts** | Helpers para árvore de collection: `updateRequestInNodes`, `getCollectionContainingRequest`, `getRequestById`, etc. |
| **importCollection.ts** | Importação de collections (Postman, Insomnia, etc.). |
| **parsePostmanV21.ts** / **parseInsomnia.ts** | Parsers de formatos de import. |
| **exportPostmanV21.ts** | Exportação para formato Postman v2.1. |
| **jsonLint.ts** | Validação/lint de JSON (ex.: corpo da requisição). |
| **urlUtils.ts** | Utilitários de URL (query string, path params). |
| **id.ts** | Geração de IDs únicos (ex.: `generateId()`). |
| **useKeyDown.ts** | Hook para atalhos de teclado. |
| **updater.ts** | Lógica do Tauri Updater no frontend (verificar atualizações, baixar, instalar). Usado pelo AboutModal. |

## Persistência e Tauri

- **Desktop:** dados são gravados no diretório de dados do app via comandos Tauri `load_app_data` e `save_app_data` (arquivo `data.json` no `app_data_dir`). Backup manual usa `write_backup_file` (caminho escolhido pelo usuário).
- **Web:** mesmo formato de dados em `localStorage`; não há `write_backup_file`.

## Scripts e variáveis

- **Pre-request script** e **Post-response script** usam uma API `fv` (environment, response, collection variables). Os logs são exibidos no painel e armazenados por aba em `tabRequestCache.scriptLogs` e no histórico da requisição.

## Build e desenvolvimento

- **Dev:** `npm run dev` — Vite em modo desenvolvimento (frontend apenas; para desktop use `npm run tauri dev`).
- **Build:** `npm run build` — `tsc -b && vite build`; saída em `dist/` (consumida pelo Tauri em `tauri.conf.json` como `frontendDist: "../dist"`).

## Documentação relacionada

- [TAURI_BACKEND.md](./TAURI_BACKEND.md) — Backend Tauri (comandos, plugins, persistência).
- [UPDATER_SETUP.md](./UPDATER_SETUP.md) — Configuração do auto-update.
