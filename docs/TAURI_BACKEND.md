# Backend Tauri — `src-tauri/`

O backend do FiveDollars é uma aplicação **Tauri 2** em Rust. Ele fornece persistência de dados no disco, diálogos (salvar arquivo), requisições HTTP sem CORS (via plugin), updater e reinício do processo. O frontend é construído com Vite e servido a partir de `../dist` em produção.

## Estrutura de pastas

```
src-tauri/
├── Cargo.toml           # Dependências Rust e features
├── Cargo.lock           # Lockfile
├── build.rs             # Script de build do Tauri
├── tauri.conf.json      # Configuração do app (janelas, bundle, plugins)
├── capabilities/
│   └── default.json     # Permissões (HTTP, dialog, updater, process)
├── src/
│   ├── main.rs          # Entry point: chama five_dollars::run()
│   └── lib.rs           # run(), comandos e plugins
├── icons/               # Ícones para bundle (32x32, 128x128, icns, ico, etc.)
└── gen/schemas/         # Schemas gerados (ACL, capabilities, por plataforma)
```

## Entry point

- **`main.rs`** — Em release no Windows desativa o console (`#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]`) e chama `five_dollars::run()`.
- **`lib.rs`** — Contém a função `run()` que constrói e executa o app Tauri, registra plugins e comandos.

## Comandos Tauri (IPC)

Todos são invocados pelo frontend com `invoke("nome_do_comando", { ... })`.

| Comando | Parâmetros | Retorno | Descrição |
|---------|------------|---------|-----------|
| **load_app_data** | — | `Result<String, String>` | Lê o arquivo de dados do app (`data.json` no diretório `app_data_dir`). Retorna `"{}"` se o arquivo não existir. |
| **save_app_data** | `payload: String` (JSON) | `Result<(), String>` | Cria o diretório de dados se necessário e grava `payload` em `data.json`. |
| **write_backup_file** | `path: String`, `payload: String` | `Result<(), String>` | Grava `payload` no arquivo em `path` (caminho escolhido pelo usuário no diálogo "Salvar como"). Cria diretórios pais se necessário. |

### Caminho dos dados

- **data_path(app)** — Retorna `app.path().app_data_dir().join("data.json")`. O `app_data_dir` é o diretório de dados do aplicativo no SO (ex.: macOS: `~/Library/Application Support/com.fivedollars.app`).

## Plugins

| Plugin | Uso no FiveDollars |
|--------|---------------------|
| **tauri_plugin_dialog** | Diálogos nativos: "Salvar como" para export/backup. |
| **tauri_plugin_http** | Requisições HTTP feitas pelo processo nativo; o frontend usa esse fetch para evitar CORS no desktop. |
| **tauri_plugin_updater** | Verificação e instalação de atualizações; endpoints e pubkey em `tauri.conf.json`. |
| **tauri_plugin_process** | Permite reiniciar o app (ex.: após instalar atualização). |

## Configuração (`tauri.conf.json`)

- **productName:** `"FiveDollars"`
- **version:** espelhada do `package.json` (ex.: `0.1.6`)
- **identifier:** `com.fivedollars.app`
- **build:**
  - **beforeDevCommand:** `npm run dev`
  - **devUrl:** `http://localhost:5173`
  - **beforeBuildCommand:** `npm run build`
  - **frontendDist:** `../dist`
- **plugins.updater:** `pubkey` (chave pública do Tauri Signer) e `endpoints` (ex.: URL raw do `latest.json` no GitHub).
- **app:** uma janela "FiveDollars", 1200×800, mín 800×600; `withGlobalTauri: true`.
- **bundle:** `createUpdaterArtifacts: true`, targets `all`, ícones em `icons/`, descrição longa/curta, categoria `DeveloperTool`; macOS minimum 10.15.

## Permissões (`capabilities/default.json`)

- **identifier:** `default`
- **windows:** `["main"]`
- **permissions:**
  - `core:default`
  - `dialog:allow-save` — salvar arquivo
  - `updater:default` — updater
  - `process:allow-restart` — reiniciar app
  - **http:default** com allow para `http://*:*`, `https://*:*`, `http://localhost:*`, `http://127.0.0.1:*`

## Build (`build.rs`)

Apenas chama `tauri_build::build()`, que processa a configuração Tauri e gera recursos necessários.

## Dependências Rust (`Cargo.toml`)

- **tauri** 2 (feature `custom-protocol` na feature default)
- **tauri-plugin-dialog** 2
- **tauri-plugin-http** 2
- **tauri-plugin-updater** 2
- **tauri-plugin-process** 2
- **tauri-build** 2 (build-dependency)
- **serde_json** 1 (pode ser usada em extensões futuras)

## Mobile

- O código usa `#[cfg_attr(mobile, tauri::mobile_entry_point)]` em `run()`, permitindo suporte a mobile (Android/iOS) no futuro; atualmente o foco é desktop.

## Resumo do fluxo de dados

1. **Inicialização:** frontend chama `load_app_data` → backend lê `data.json` do `app_data_dir` → retorna JSON string → frontend restaura estado (collections, environments, history).
2. **Salvar:** frontend chama `save_app_data` com JSON → backend grava em `data.json`.
3. **Backup/Export:** usuário escolhe caminho no diálogo (plugin dialog) → frontend chama `write_backup_file(path, payload)` → backend grava o arquivo.
4. **HTTP:** frontend usa `@tauri-apps/plugin-http` no ambiente Tauri; as requisições são feitas pelo processo nativo (sem CORS).

## Documentação relacionada

- [FRONTEND.md](./FRONTEND.md) — Uso de `invoke` e persistência no frontend.
- [GITHUB_WORKFLOW.md](./GITHUB_WORKFLOW.md) — Build e release (incl. assinatura).
- [UPDATER_SETUP.md](./UPDATER_SETUP.md) — Chaves do Tauri Signer e secrets do GitHub.
