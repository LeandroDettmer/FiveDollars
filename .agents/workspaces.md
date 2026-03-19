# Workspaces — o que foi implementado

Cada **workspace** é um “perfil” completo: suas próprias collections, environments, modo Git (offline/synced) e histórico. O usuário pode criar vários workspaces e trocar entre eles; quem não usa continua com um único workspace “Principal”.

## Modelo de dados

- **WorkspaceData** (`src/types/workspace.ts`): `id`, `name`, `collections`, `environments`, `currentEnvId`, `collectionsMode`, `offlineCollections`, `syncedCollections`, `gitRepo`, `gitSyncStatus`, `knownRepoPaths`, `history`, `pinnedTabs`.
- **PersistedData** (`src/types/persisted.ts`): `workspaces: WorkspaceData[]`, `activeWorkspaceId: string | null`, `locale`. Campos legados (collections, environments, etc.) opcionais só para **migração** quando não existir `workspaces`.

## Store (`src/store/useAppStore.ts`)

- **Estado:** `workspaces`, `activeWorkspaceId` + estado “plano” (collections, environments, currentEnv, git*, history, tabs, …). O estado plano é a **cópia do workspace ativo**.
- **persist():** monta o snapshot do workspace ativo a partir do estado plano, atualiza esse workspace no array e salva `{ workspaces, activeWorkspaceId, locale }`.
- **setStateFromPersisted(data):**
  - Se `data.workspaces?.length` → usa esses workspaces e aplica o ativo ao estado plano (e restaura pinned tabs).
  - Senão → **migração:** cria um workspace “Principal” com dados legados (`data.collections`, `data.environments`, etc.) e aplica ao estado plano.
- **Ações de workspace:** `getActiveWorkspace()`, `addWorkspace(name?)`, `removeWorkspace(id)`, `switchWorkspace(id)`, `updateWorkspace(id, { name })`. Ao trocar workspace: **antes** de aplicar o outro, o workspace atual (repo Git, modo synced, collections, etc.) é salvo no array via `buildActiveWorkspaceSnapshot`; depois aplica o novo ao estado plano e limpa tabs/temps. Assim, ao voltar para um workspace, o repo e as collections do Git continuam lá.

## Persistência (`src/lib/persistence.ts`)

- **parsePersistedData:** lê `workspaces` (array) e `activeWorkspaceId`; se não houver workspaces, mantém campos legados no objeto retornado para a migração no store.
- **saveAppData:** recebe o payload que o store já monta (workspaces + activeWorkspaceId + locale).

## UI

- **WorkspaceSelector** (`src/components/WorkspaceSelector.tsx`): botão com nome do workspace ativo no canto **superior direito** da sidebar. Dropdown: lista (clique = trocar), renomear (⋯ → Renomear), remover (⋯ → Remover workspace; só se houver mais de um), “+ Novo workspace”. Confirmação antes de remover.
- **SidebarPanel** (`src/components/panel/SidebarPanel.tsx`): primeira linha é `sidebar-actions-row` — à esquerda “New collection” e “Import”, à direita `<WorkspaceSelector />`.
- **Estilos:** em `App.css`: `.sidebar-actions-row`, `.workspace-selector-*`, `.workspace-dropdown-*`.
- **i18n:** chaves `sidebar.workspace`, `sidebar.newWorkspace`, `sidebar.removeWorkspace`, `sidebar.removeWorkspaceTitle`, `sidebar.removeWorkspaceMessage`, `sidebar.workspaceActive` (en + pt-BR).

## Git por workspace

Git (GitTab) usa o store; como o store reflete o workspace ativo, cada workspace tem seu próprio `gitRepo`, `gitSyncStatus`, `collectionsMode` (offline/synced) e conjuntos de collections. Nenhuma alteração específica no GitTab além do que o store já expõe.
