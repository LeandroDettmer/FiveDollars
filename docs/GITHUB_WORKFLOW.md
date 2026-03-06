# Workflow GitHub — Release

Este documento descreve o workflow de **Release** do FiveDollars (`.github/workflows/release.yml`), responsável por construir o app para múltiplas plataformas e publicar releases no GitHub.

## Gatilhos

O workflow é executado em dois casos:

1. **Publicação de release** — Quando um release é publicado no repositório (`release: types: [published]`). O tag do release é usado para o build.
2. **Execução manual** — Via **Actions → Release → Run workflow**, com input opcional:
   - `tag_name`: tag do release (ex.: `v0.1.0`). Padrão: `v0.1.0`.

## Variáveis de ambiente

| Variável       | Valor | Uso                    |
|----------------|-------|------------------------|
| `NODE_VERSION` | `20`  | Versão do Node.js em todos os jobs |

## Jobs

### 1. `build`

- **Estratégia:** matrix com `fail-fast: false` (um OS falhar não cancela os outros).
- **Plataformas:** `macos-latest`, `ubuntu-latest`, `windows-latest` (nomes internos: `macos`, `linux`, `windows`).

#### Passos comuns (todas as plataformas)

| Passo | Descrição |
|-------|-----------|
| Checkout | Checkout do código. Usa o tag do release (se for evento `release`), o `tag_name` do workflow_dispatch ou `github.ref`. |
| Setup Node.js | Instala Node 20 com cache `npm`. |
| Install Rust | Instala toolchain Rust estável. |
| Cache Rust | Cache do Cargo em `src-tauri -> target`. |
| Install dependencies | `npm ci`. |
| Prepare signing key | **Condicional:** só roda se existir o secret `TAURI_SIGNING_PRIVATE_KEY`. Grava o conteúdo do secret em um arquivo temporário e exporta `TAURI_SIGNING_PRIVATE_KEY` como caminho desse arquivo (o Tauri espera caminho no build). |
| Build Tauri | `npm run tauri build`. Usa `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` se a chave for protegida por senha. |
| Upload artifact | Envia os artefatos da plataforma com nome `release-<macos|linux|windows>`. |

#### Passos específicos por plataforma

**Linux**

- **Install Linux dependencies** — Instala pacotes necessários para o Tauri (webkit2gtk, glib, build-essential, libxdo-dev, libssl-dev, libayatana-appindicator3-dev, librsvg2-dev, etc.).

**Upload de artefatos**

- **macOS:** `FiveDollars-macos.dmg`, `FiveDollars.app.tar.gz` (+ `.sig` se houver assinatura).
- **Linux:** `FiveDollars-linux.AppImage` (+ `.sig`), e arquivos `.deb` do bundle.
- **Windows:** `FiveDollars-windows.msi` e `FiveDollars-windows.exe` (+ `.sig` quando existirem).

---

### 2. `release`

- **Dependência:** `needs: build` (só roda após todos os builds da matrix).
- **Permissões:** `contents: write` (para criar release e fazer push do `latest.json`).

#### Passos

| Passo | Descrição |
|-------|-----------|
| Checkout | Checkout com `fetch-depth: 0` (histórico completo, se necessário). |
| Download artifacts | Baixa todos os artefatos `release-*` para a pasta `artifacts`. |
| Gather assets | Copia todos os arquivos de `artifacts` para `release-assets`. |
| Create latest.json | Gera `latest.json` para o **Tauri Updater**: versão (tag sem o `v`) e `platforms` com URL e assinatura por plataforma (`darwin-aarch64`, `linux-x86_64`, `windows-x86_64`). As URLs apontam para o release que está sendo criado (`https://github.com/<repo>/releases/download/<tag>/...`). |
| List release files | Lista os arquivos em `release-assets` e expõe em `steps.paths.outputs.files`. |
| Create Release | Usa `softprops/action-gh-release@v2`: cria o release na tag informada, anexa todos os arquivos de `release-assets` (incluindo instaladores e `latest.json`). |
| Publish latest.json to repo | Faz checkout da branch padrão, copia `release-assets/latest.json` para a raiz do repositório (`latest.json`), commita e dá push **se houver alteração**. Isso permite servir `latest.json` via URL raw do GitHub (ex.: `https://raw.githubusercontent.com/.../main/latest.json`) para o updater, evitando o redirect 302 da URL de release. |

## Secrets utilizados

| Secret | Obrigatório | Uso |
|--------|-------------|-----|
| `GITHUB_TOKEN` | Sim (automático) | Criar release e fazer push do `latest.json`. |
| `TAURI_SIGNING_PRIVATE_KEY` | Não | Conteúdo do arquivo da chave privada do Tauri Signer. Se presente, o build gera assinaturas (`.sig`) e o updater funciona. Ver [UPDATER_SETUP.md](./UPDATER_SETUP.md). |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Não | Senha da chave privada (se for rsign encrypted). Pode ser vazio ou omitido se não houver senha. |

## Resumo do fluxo

1. Disparo: publicação de release ou execução manual com tag.
2. Build em paralelo no macOS, Linux e Windows (Node + Rust + deps, depois `tauri build`).
3. Artefatos (instaladores + `.sig` quando há chave) são enviados como artifacts do job.
4. Job `release` baixa os artefatos, monta `latest.json`, cria o release no GitHub com todos os arquivos e atualiza o `latest.json` na raiz do repo para o endpoint do updater.

## Documentação relacionada

- [UPDATER_SETUP.md](./UPDATER_SETUP.md) — Configuração das chaves de assinatura para o auto-update.
