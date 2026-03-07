# AGENTS — Contexto do projeto FiveDollars

Este arquivo orienta a IA (Cursor) a entender o repositório e ajudar no código do FiveDollars.

## O que é o projeto

**FiveDollars** é um **cliente de API** para Desktop e Web — alternativa ao Postman/Insomnia. Permite enviar requisições HTTP, organizar collections, gerenciar environments e rodar sequências de requisições (Runner). As requisições são feitas pelo plugin HTTP do Tauri no processo nativo, evitando CORS do navegador.

## Stack e ferramentas

- **Frontend:** React 18, Vite, TypeScript (sem Tailwind)
- **Estado:** Zustand (`src/store/`)
- **Backend/Desktop:** Tauri 2 (Rust), com plugins: HTTP, dialog, process, updater
- **Editor de código:** CodeMirror (@uiw/react-codemirror) para body/scripts

## Estrutura principal

- **`src/`** — frontend React
  - **`components/`** — RequestPanel, ResponsePanel, Sidebar, CollectionTree, EnvironmentEditor, RunnerPanel, BodyEditor, etc.
  - **`store/`** — stores Zustand (collections, environments, requests, runner, UI)
  - **`lib/`** — `http.ts` (fetch via Tauri), `resolveEnv.ts` (substituição `{{var}}`), `importCollection.ts`, scripts pre/post, parsers Postman/Insomnia
  - **`types/`** — tipos TypeScript (collections, requests, environments)
- **`src-tauri/`** — app Tauri em Rust (plugin HTTP, comandos, build)
- **`App.css`** — tema escuro estilo VS Code, layout em colunas

## Comandos úteis

- Desenvolvimento: `npm install` e `npm run tauri dev`
- Build: `npm run tauri build`
- Bump de versão (release): `npm run patch` — mantém `package.json` e `src-tauri/tauri.conf.json` sincronizados

## Convenções

- Estilo: tema dark no `App.css`.
- Requisições HTTP: sempre via Tauri (plugin HTTP), não `fetch` do browser.
- Variáveis de ambiente: sintaxe `{{nome}}` em URL/headers/body; resolvidas em `lib/resolveEnv.ts`.

Use este contexto para sugerir código, refatorações e respostas alinhadas ao projeto FiveDollars.

**Last Updated:** 2026-03-07 (UTC)
