# Git Sync — Sincronização com repositório Git (`.fivedollars`)

O FiveDollars permite vincular um repositório Git local e sincronizar **collections** e, opcionalmente, **environments** com um arquivo JSON na pasta `.fivedollars`. Útil para versionar requisições, compartilhar com a equipe ou backup remoto.

**Disponibilidade:** apenas na versão **desktop** (Tauri). A aba "Git" no modal Sobre só aparece quando `isTauri()` é verdadeiro.

---

## Visão geral

- Pasta **`.fivedollars`** na raiz do repositório Git.
- Arquivo canônico: **`.fivedollars/workspace.json`** (formato **version 2**: `collections`, `meta`, e opcionalmente `environments` + `currentEnvId`).
- **Legado:** ainda é possível **ler** `.fivedollars/collections.json` (version 1, só collections). Novos salvamentos gravam apenas `workspace.json`; o arquivo antigo não é apagado automaticamente (times podem removê-lo do repo após migração).
- Cada **workspace** tem `gitRepo`, `gitSyncStatus`, `knownRepoPaths`, `gitSyncIncludeEnvironments` (checkbox: incluir environments ao salvar).
- Dois **perfis** (Local / Git) para **collections** e **environments** em paralelo (`offline*` vs `synced*`), trocados com `setCollectionsMode`.

---

## Estrutura no repositório

```
<repo-raiz>/
  .fivedollars/
    workspace.json      # Arquivo atual (v2)
    collections.json    # Legado (v1) — só leitura se workspace.json não existir
```

### Formato `workspace.json` (v2)

Definido em [`src/lib/gitWorkspace.ts`](../src/lib/gitWorkspace.ts):

```json
{
  "version": 2,
  "collections": [ /* Collection[] */ ],
  "environments": [ /* opcional; Environment[] */ ],
  "currentEnvId": "uuid-or-null",
  "meta": {
    "appVersion": "0.1.x",
    "lastUpdatedAt": 1234567890123
  }
}
```

- **Salvar com environments** só ocorre se o usuário marcar a opção na aba Git (avisos sobre segredos/tokens).
- **v1 (`collections.json`):** apenas `version: 1`, `collections`, `meta`.

---

## Backend (Tauri) — `src-tauri/src/git_sync.rs`

| Comando | Descrição |
|--------|------------|
| `detect_git_repo(path?)` | Retorna `GitRepoInfo` incl. `has_sync_file` e `has_collections_file` (mesmo valor: existe `workspace.json` ou `collections.json` legado). |
| `list_git_branches` / `git_checkout_branch` | Como antes. |
| `read_git_collections` | Lê `workspace.json` se existir; senão `collections.json`. |
| `write_git_collections` | Escreve sempre em `workspace.json`. |
| `git_commit_collections` | `git add .fivedollars/workspace.json` e commit (mensagem padrão: `chore(fivedollars): update workspace data`). |

---

## Estado no store (`useAppStore`)

| Campo | Descrição |
|-------|-----------|
| `gitRepo` | `hasSyncFile` / `hasCollectionsFile` (compat). |
| `offlineEnvironments` / `syncedEnvironments` | Espelham o modelo das collections por perfil. |
| `gitSyncIncludeEnvironments` | Persistido no workspace; controla se o save inclui `environments` no JSON. |

Ações: `setSyncedEnvironments`, `setGitSyncIncludeEnvironments`, além de `setSyncedCollections` e `setCollectionsMode` (troca collections + environments).

---

## UI — `GitTab.tsx`

- Checkbox **incluir environments** + texto de risco (segredos no Git).
- Carregar: `parseWorkspaceFromGit` → atualiza `syncedCollections` e, se o arquivo trouxer `environments`, `setSyncedEnvironments`.
- Salvar: `serializeWorkspaceForGit` com `includeEnvironments` conforme checkbox.

---

## Persistência e backup

- `gitSyncIncludeEnvironments` e pares offline/synced de environments fazem parte do **WorkspaceData** e entram no backup/export.
- Ver [IMPORT_EXPORT.md](./IMPORT_EXPORT.md) para import seletivo.

---

## Resumo

- `.fivedollars/workspace.json` (v2) + leitura legado v1.
- Environments opcionais no repo, com perfis Local/Git separados no store.
- Serialização/parse: `src/lib/gitWorkspace.ts`.
