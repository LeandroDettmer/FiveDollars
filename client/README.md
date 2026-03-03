# Five Dollar Post

Cliente HTTP desktop (alternativa ao Postman/Insomnia) com React e Tauri, usando **CSS normal** (sem Tailwind).

## Pré-requisitos

- **Node.js** 18+
- **Rust** (para o Tauri): [rustup.rs](https://rustup.rs)
- **npm** ou outro gerenciador de pacotes

## Como rodar

```bash
cd client
npm install
npm run tauri dev
```

O primeiro build do Rust pode demorar alguns minutos.

## Gerar executável (app instalável como o Postman)

O Tauri gera um **app desktop nativo** por plataforma: um executável que você pode instalar e abrir como o Postman.

### 1. Ícone (opcional na primeira vez)

Para o instalador ter ícone próprio, use uma imagem **1024×1024 px** (PNG) e gere os ícones:

```bash
cd client
npm run tauri icon caminho/para/sua-imagem-1024.png
```

Isso preenche a pasta `src-tauri/icons/`. Se pular este passo, o build pode usar ícone padrão ou falhar (dependendo da versão); vale criar um ícone depois.

### 2. Build do app

```bash
cd client
npm install
npm run tauri build
```

O primeiro build pode levar vários minutos (compilação do Rust).

### 3. Onde está o executável

Após o build, os instaladores/executáveis ficam em:

| Plataforma | Pasta (dentro de `client/src-tauri/`) | Arquivos |
|------------|--------------------------------------|----------|
| **Windows** | `target/release/bundle/msi/` e `target/release/bundle/nsis/` | `.msi` (instalador), `.exe` (portable) |
| **macOS**   | `target/release/bundle/dmg/` e `target/release/bundle/macos/` | `.dmg` (instalador), `.app` (app bundle) |
| **Linux**   | `target/release/bundle/deb/` ou `target/release/bundle/appimage/` | `.deb`, `.AppImage` |

- **Windows**: rode o `.exe` ou instale pelo `.msi`.
- **macOS**: abra o `.dmg` e arraste o app para Aplicativos, ou use o `.app` direto.
- **Linux**: instale o `.deb` ou execute o `.AppImage`.

Assim você tem um app instalável, igual ao Postman.

## Estrutura (sem Tailwind)

- **`src/`** – React
  - **`components/`** – RequestPanel, ResponsePanel, Sidebar
  - **`store/`** – Zustand (estado global)
  - **`lib/`** – `http.ts` (fetch via `@tauri-apps/plugin-http`), `resolveEnv.ts` (substituição de `{{var}}`)
  - **`types/`** – tipos com UUIDs para collections/requests
- **`src-tauri/`** – backend Rust (Tauri 2 + plugin HTTP)
- **`App.css`** – tema dark (estilo VS Code), layout em 3 colunas, tudo em CSS puro

## Importar collections

- **Postman v2.1**: exporte a collection como JSON (Collection v2.1) e use **Importar** na sidebar.
- **Insomnia 5.0**: o arquivo YAML gerado pelo script `scripts/export-insomnia-clinicorp.js` (formato `collection.insomnia.rest/5.0`) é suportado. Também aceita JSON no mesmo formato.

Após importar, as pastas e requisições aparecem na sidebar; clique numa requisição para carregá-la no painel e enviar.

## Variáveis de ambiente

Use `{{nome}}` na URL ou no body. Crie ambientes na sidebar e selecione um; as variáveis do ambiente ativo são aplicadas antes do request.

Exemplo: URL `{{baseUrl}}/api/users` com ambiente `{ "baseUrl": "https://api.exemplo.com" }` vira `https://api.exemplo.com/api/users`.

## Requisições

As requisições são feitas pelo **plugin HTTP do Tauri** no processo nativo (evita CORS do navegador). Métodos: GET, POST, PUT, PATCH, DELETE; suporte a headers, query params e body (JSON/Raw).
