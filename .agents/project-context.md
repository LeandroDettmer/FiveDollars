# Contexto do projeto FiveDollars

Resumo para a IA: o que é o app, stack, estrutura e convenções. Detalhes em [AGENTS.md](../AGENTS.md) na raiz.

## O que é

- **FiveDollars**: cliente de API (Desktop + Web), tipo Postman/Insomnia.
- Requisições HTTP via **Tauri** (plugin HTTP), não `fetch` do browser (evita CORS).
- Collections, environments, Runner (sequência de requisições), Git sync de collections.

## Stack

- **Frontend:** React 18, Vite, TypeScript. **Sem Tailwind** — estilos em `App.css`.
- **Estado:** Zustand em `src/store/useAppStore.ts`.
- **Desktop:** Tauri 2 (Rust), plugins: HTTP, dialog, process, updater.
- **Editor:** CodeMirror (`@uiw/react-codemirror`) para body/scripts.

## Estrutura principal

```
src/
  components/     RequestPanel, ResponsePanel, SidebarPanel, CollectionTree,
                  EnvironmentEditor, RunnerPanel, BodyEditor, WorkspaceSelector, GitTab, etc.
  store/          useAppStore.ts (estado global)
  lib/            http.ts, resolveEnv.ts, importCollection.ts, persistence.ts,
                  i18n.ts, useClickOutside.ts, gitWorkspace.ts, ...
  types/          index.ts, persisted.ts, workspace.ts
  locales/        en.ts, pt-BR.ts (i18n)
  App.css         Tema dark estilo VS Code
src-tauri/        App Tauri (Rust)
```

## Convenções

- **Estilo:** tema dark no `App.css`; variáveis CSS `--bg-primary`, `--accent`, `--border`, etc.
- **Variáveis de ambiente:** sintaxe `{{nome}}` em URL/headers/body; resolvidas em `lib/resolveEnv.ts`.
- **IDs:** `generateId()` em `lib/id.ts` (UUID v4).
- **i18n:** chaves em `locales/en.ts` (e pt-BR); tipo `TranslationKeys`; hook `useT()` para `t("chave")`.

## Comandos

- `npm run tauri dev` — desenvolvimento
- `npm run tauri build` — build
- `npm run patch` — bump de versão (sincroniza package.json e tauri.conf.json)
