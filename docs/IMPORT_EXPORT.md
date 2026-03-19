# Import e Export — Formatos, backup e importação seletiva

Este documento descreve como o FiveDollars importa e exporta dados: formatos suportados, backup com workspaces, opções de exportação (incluir ou não environments) e importação seletiva a partir de um backup.

---

## Export (Exportar dados)

Local: **Sobre → Exportar dados** (aba "Exportar" no AboutModal). Componente: `src/components/Export.tsx`.

### 1. Backup FiveDollars

- **Descrição:** Exporta o estado completo do app para um arquivo JSON (collections, environments, workspaces, histórico, Git, etc.), para backup ou para importar depois.
- **Ação:** Chama `getPersistedSnapshot(options)` da store e grava em arquivo (Tauri: diálogo de salvar + `write_backup_file`) ou download no browser.
- **Nome padrão do arquivo:** `FiveDollars-backup-YYYY-MM-DD.json`.
- **Versão no payload:** `_exportVersion: 3` (indica backup com suporte a workspaces).

#### Opção: incluir ou não environments

- **Checkbox "Incluir environments":** Marcado por padrão.
- **Motivo:** Environments podem conter dados sensíveis (tokens, senhas). O usuário pode **desmarcar** para exportar o backup **sem** environments (e sem `currentEnvId`).
- **Implementação:**  
  `getPersistedSnapshot({ includeEnvironments: includeEnvironmentsInBackup })`.  
  Se `includeEnvironments === false`, a store retorna o snapshot com `environments: []` e `currentEnvId: null` em todos os workspaces.

### 2. Exportar Postman v2.1

- Exporta **apenas a primeira collection** em formato Postman Collection v2.1 (JSON).
- Útil para usar no Postman ou em outras ferramentas que importem esse formato.
- Nome padrão: `FiveDollars-collection-postman-v2.1.json`.

---

## Store: `getPersistedSnapshot` e `applyBackupImport`

### getPersistedSnapshot(options?)

- **Onde:** `src/store/useAppStore.ts`.
- **Retorno:** Objeto `PersistedData`: `workspaces`, `activeWorkspaceId`, `locale`.
- **Opções:** `options?.includeEnvironments` — se `false`, todos os workspaces no snapshot saem com `environments: []` e `currentEnvId: null`. Default é incluir environments.

### applyBackupImport(options, data, sourceWorkspaceId?)

- **Onde:** `src/store/useAppStore.ts`.
- **Uso:** Aplicar um backup (ou parte dele) no estado atual, de forma seletiva.
- **Parâmetros:**
  - `options.selectedWorkspace` — importar **apenas o workspace selecionado** do backup (como novo workspace e ativá-lo).
  - `options.collections` — aplicar as collections do workspace-fonte no workspace ativo.
  - `options.environments` — aplicar os environments (e currentEnvId) do workspace-fonte no workspace ativo.
  - `options.git` — aplicar gitRepo, gitSyncStatus e knownRepoPaths do workspace-fonte no workspace ativo.
  - `data` — objeto `PersistedData` do backup.
  - `sourceWorkspaceId` — ID do workspace do backup a usar como fonte para collections, environments e Git (e, se `selectedWorkspace`, qual workspace clonar).

**Comportamento resumido:**

- Se o backup tem `workspaces` e `sourceWorkspaceId` é informado, o “workspace-fonte” é o workspace desse ID (fallback: primeiro workspace).
- **selectedWorkspace:** em vez de substituir todos os workspaces, cria **um** novo workspace com os dados do workspace-fonte (novo `id` com `generateId()`), adiciona à lista, ativa e aplica ao estado flat (tabs/currentRequest limpos, etc.).
- **collections / environments / git:** atualizam apenas o workspace ativo com os dados do workspace-fonte; collections respeitam `collectionsMode` (offline/synced).
- No final, chama `persist(get())` se alguma opção foi aplicada.

---

## Import (Importar)

Local: **Sidebar** — botão de importar (input file + lógica em `SidebarPanel.tsx`).  
Detecção de formato: `src/lib/importCollection.ts` → `importCollectionFromText(text, filename)`.

### Formatos suportados

| Formato | Como é detectado | Resultado |
|--------|-------------------|-----------|
| **Backup FiveDollars** | JSON com `_exportVersion: 3` ou `workspaces` (array não vazio), ou legado com collections/environments/history | `ImportResult.type === "backup"` → abre modal de importação seletiva. |
| **Postman v2.1** | JSON com `item` (array) e estrutura Postman | Uma collection → adicionada ao app (merge/substituição conforme fluxo atual da sidebar). |
| **Insomnia** | JSON ou YAML com `collection` e tipo Insomnia | Uma collection → adicionada ao app. |

- **Backup:** não aplica direto; define `pendingBackupImport = data` e abre o **ConfirmModal** de importação seletiva.
- **Postman/Insomnia:** importação direta como collection (comportamento existente da sidebar).

### Modal de importação de backup

Quando o usuário seleciona um arquivo que é reconhecido como backup FiveDollars:

1. **Título/mensagem:** "Importar backup" / "Manter dados atuais e escolher o que importar do backup".
2. **Dropdown "Do workspace:"** Lista os workspaces do backup (`data.workspaces`). O usuário escolhe **de qual workspace** vêm collections, environments e Git. Valor em estado: `selectedBackupWorkspaceId`.
3. **Checkboxes (todos opcionais):**
   - **Importar workspace selecionado** — adiciona o workspace escolhido no dropdown como **novo** workspace e o ativa (não substitui todos os workspaces).
   - **Collections** — aplica as collections do workspace selecionado no workspace ativo atual.
   - **Environments** — aplica os environments (e currentEnvId) do workspace selecionado no workspace ativo.
   - **Git (repo, sync)** — aplica gitRepo, gitSyncStatus e knownRepoPaths do workspace selecionado no workspace ativo.
4. **Confirmar:** chama `applyBackupImport(backupImportOptions, pendingBackupImport, selectedBackupWorkspaceId)` e fecha o modal.

Assim, o usuário pode importar só collections, só environments, só Git, só um workspace inteiro, ou combinações, sem sobrescrever tudo.

---

## Estrutura do backup (PersistedData)

O backup exportado (e aceito na importação) segue o tipo `PersistedData` e, na versão 3, prioriza workspaces:

- **workspaces** — array de `WorkspaceData` (cada um com id, name, collections, environments, currentEnvId, collectionsMode, offlineCollections, syncedCollections, gitRepo, gitSyncStatus, knownRepoPaths, history, pinnedTabs).
- **activeWorkspaceId** — ID do workspace ativo.
- **locale** — idioma (opcional).
- **Legado:** se não houver workspaces, ainda são aceitos `collections`, `environments`, `currentEnvId`, `history`, etc., para migração.

O detector de backup em `importCollection.ts` considera:

- `_exportVersion === 3` ou array `workspaces` não vazio → backup com workspaces.
- `_exportVersion === 1` ou presença de collections/environments/history → backup legado.

---

## Resumo das alterações / implementação

### Export

- **Backup:** snapshot com todos os workspaces; opção **incluir environments** (checkbox; default sim) para evitar exportar dados sensíveis.
- **getPersistedSnapshot(options?):** parâmetro `includeEnvironments`; quando `false`, retorna workspaces com environments vazios e currentEnvId null.
- **Postman:** exportação da primeira collection em Postman v2.1 (inalterado em relação ao comportamento anterior).

### Import

- **Backup FiveDollars:** ao detectar backup (workspaces ou legado), abre modal seletivo em vez de aplicar tudo.
- **Dropdown "Do workspace:"** escolha do workspace do backup como fonte para collections, environments e Git.
- **Opção "Importar workspace selecionado":** adiciona um único workspace novo (cópia do selecionado com novo id) e ativa; não substitui a lista inteira de workspaces.
- **Opções independentes:** Collections, Environments, Git — cada uma aplica só o respectivo bloco do workspace-fonte no workspace ativo.
- **applyBackupImport:** terceiro parâmetro `sourceWorkspaceId`; lógica para selectedWorkspace (um novo workspace), collections, environments e git aplicados ao workspace ativo; persist após alterações.

### i18n

- Chaves para export: `export.includeEnvironments`, `export.includeEnvironmentsDesc`.
- Chaves para import: `import.backupOptionSelectedWorkspace`, `import.backupOptionCollections`, `import.backupOptionEnvironments`, `import.backupOptionGit`, `import.backupFromWorkspace`, `import.backupTitle`, `import.backupMessage`, `import.backupImport`.

Documentação do Git Sync: [GIT_SYNC.md](./GIT_SYNC.md).
