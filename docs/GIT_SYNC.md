# Git Sync — Sincronização de collections com repositório Git

O FiveDollars permite vincular um repositório Git local e sincronizar as **collections** com um arquivo dentro do repo. Isso é útil para versionar requisições, compartilhar com a equipe ou manter backup em um repositório remoto.

**Disponibilidade:** apenas na versão **desktop** (Tauri). A aba "Git" no modal Sobre só aparece quando `isTauri()` é verdadeiro.

---

## Visão geral

- O app usa uma pasta **`.fivedollars`** na raiz do repositório Git.
- O arquivo de dados é **`.fivedollars/collections.json`** (formato JSON com `version`, `collections` e metadados).
- Cada **workspace** pode ter seu próprio repositório Git associado (`gitRepo`, `gitSyncStatus`, `knownRepoPaths`).
- O usuário alterna entre dois **perfis** de collections no mesmo workspace:
  - **Local:** collections apenas no app (não alteradas pelo sync).
  - **Git:** collections carregadas do repositório; ao salvar, esse conjunto é escrito em `.fivedollars/collections.json`.

---

## Estrutura no repositório

```
<repo-raiz>/
  .fivedollars/
    collections.json    # Arquivo gerado pelo app (collections + meta)
```

### Formato de `collections.json`

Definido em `src/lib/gitCollections.ts`:

```json
{
  "version": 1,
  "collections": [ /* array de Collection (id, name, items, etc.) */ ],
  "meta": {
    "appVersion": "0.1.x",
    "lastUpdatedAt": 1234567890123
  }
}
```

- **Serialização:** `serializeCollectionsForGit(collections, appVersion)` — ordena collections por nome e gera o JSON.
- **Leitura:** `parseCollectionsFromGit(raw)` — valida estrutura e `version`, retorna `{ collections }`. Erros lançados para JSON inválido ou estrutura inesperada.

---

## Backend (Tauri) — `src-tauri/src/git_sync.rs`

Comandos expostos ao frontend:

| Comando | Descrição |
|--------|------------|
| `detect_git_repo(path?)` | Encontra a raiz do repo a partir de `path` (ou cwd). Retorna `GitRepoInfo`: path, branch, is_clean, has_fivedollars_folder, has_collections_file. |
| `list_git_branches(repo_path)` | Lista branch atual e todos os branches. |
| `git_checkout_branch(repo_path, branch)` | Faz checkout do branch informado. |
| `read_git_collections(repo_path)` | Lê o conteúdo de `.fivedollars/collections.json`. |
| `write_git_collections(repo_path, payload)` | Cria `.fivedollars` se não existir e escreve `payload` em `collections.json`. |
| `git_commit_collections(repo_path, message?)` | `git add .fivedollars/collections.json` e `git commit` com a mensagem (ou padrão). |

- A raiz do repo é obtida com `git rev-parse --show-toplevel`.
- O PATH usado nos comandos Git inclui `/usr/local/bin`, `/opt/homebrew/bin` e, se existir, `~/.nvm/versions/node/current/bin` (para hooks como Husky).

---

## Estado no store (`useAppStore`)

Por workspace (e estado “flat” do ativo):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `gitRepo` | `GitRepoInfo \| null` | Repositório selecionado: path, branch, isClean, hasFivedollarsFolder, hasCollectionsFile. |
| `gitSyncStatus` | `GitSyncStatus \| null` | lastSyncedAt, lastAction (ex.: "loaded_from_repo", "saved_and_committed"), errorMessage. |
| `knownRepoPaths` | `string[]` | Lista de caminhos de repos já usados (para o dropdown). |
| `collectionsMode` | `"offline" \| "synced"` | Perfil ativo: "offline" = local, "synced" = Git. |
| `collections` | `Collection[]` | Conjunto ativo (local ou synced, conforme modo). |
| `offlineCollections` | `Collection[]` | Conjunto local (quando em modo Git, fica preservado). |
| `syncedCollections` | `Collection[]` | Conjunto carregado do repo (quando em modo Local, fica preservado). |

Ações relevantes:

- `setGitRepo`, `setGitSyncStatus`, `setKnownRepoPaths`, `addKnownRepo`, `removeKnownRepo`
- `setCollectionsMode("offline" | "synced")` — troca o perfil e o conjunto visível (`collections`).
- `setSyncedCollections(collections)` — atualiza o conjunto synced (e, se já estiver em modo synced, atualiza também `collections`).

---

## UI — Aba Git (`GitTab.tsx`)

Local: **Sobre → aba "Atualizações"** (ou aba "Git", conforme layout). Só é exibida no desktop.

### Fluxos

1. **Adicionar repositório**  
   Botão "Adicionar repositório" → diálogo para escolher pasta → `detect_git_repo(selectedPath)` → preenche `gitRepo` e adiciona path a `knownRepoPaths`.

2. **Trocar repositório / branch**  
   Dropdown de repos (knownRepoPaths + atual) e dropdown de branches → `handleSelectRepo` / `handleSelectBranch` → `detect_git_repo` e, no caso de branch, `git_checkout_branch`.

3. **Perfil ativo: Local vs Git**  
   Dois botões: "Local" e "Git". "Git" fica desabilitado se `syncedCollections.length === 0`. Ao alternar, `setCollectionsMode("offline" | "synced")` atualiza qual conjunto está em `collections`.

4. **Carregar do repositório**  
   Botão "Carregar collections" → confirmação → `read_git_collections` → `parseCollectionsFromGit` → `setSyncedCollections(repoCollections)` e `setGitSyncStatus({ lastSyncedAt, lastAction: "loaded_from_repo" })`.

5. **Salvar no repositório**  
   - **Salvar:** confirmação → `serializeCollectionsForGit(collections, version)` → `write_git_collections` → status "saved_to_repo".
   - **Salvar e fazer commit:** confirmação + campo de mensagem → `write_git_collections` + `git_commit_collections(repoPath, message)` → status "saved_and_committed".

6. **Atualizar status do repo**  
   Botão "Recarregar status" → `detect_git_repo(gitRepo.path)` e `list_git_branches` para atualizar branch, is_clean e flags da pasta/arquivo.

Mensagens de erro do Git ou do app são exibidas em `gitError` e, quando aplicável, em `gitSyncStatus.errorMessage`.

---

## Persistência e backup

- `gitRepo`, `gitSyncStatus` e `knownRepoPaths` fazem parte do **WorkspaceData** e são persistidos (e incluídos no backup FiveDollars).
- No **import de backup**, é possível escolher importar apenas **Git (repo, sync)** a partir do workspace selecionado do backup, sem alterar collections ou environments. Ver [IMPORT_EXPORT.md](./IMPORT_EXPORT.md).

---

## Resumo das alterações / implementação

- Pasta `.fivedollars` na raiz do repo; arquivo `collections.json` com formato versionado.
- Comandos Tauri para detectar repo, listar/checkout branches, ler/escrever collections e fazer commit.
- Store: `gitRepo`, `gitSyncStatus`, `knownRepoPaths`, `collectionsMode`, `offlineCollections`, `syncedCollections`.
- UI: aba Git no Sobre com seleção de repo/branch, perfis Local/Git, carregar / salvar / salvar e commit, e recarregar status.
- Serialização/parse em `src/lib/gitCollections.ts` com validação de estrutura e versão.
