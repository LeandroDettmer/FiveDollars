---
name: git-sync-collections
overview: Adicionar ao FiveDollars um fluxo simples de "login"/vinculação com Git local e um mecanismo de versionamento/sync de collections via pasta .fivedollars dentro do repositório atual.
todos: []
isProject: false
---

## Objetivo geral

- **Meta**: Permitir que cada usuário vincule o FiveDollars a um repositório Git local, salve suas collections em `.fivedollars/collections.json` e sincronize essas collections com o repositório (para compartilhar com o time via Git).
- **Escopo inicial**: Usar **Git local já configurado** (SSH/HTTPS, usuário, etc.) e modelar o fluxo pensando em um possível OAuth futuro (GitHub/GitLab), mas sem implementá-lo ainda.

## Design de alto nível

- **Persistência local atual**
  - O estado principal (incluindo `collections`) já é persistido em `PersistedData` via `saveAppData`/`loadAppData` (`persistence.ts`) e `useAppStore`.
  - Vamos **reaproveitar** essa estrutura para serializar apenas `collections` para arquivo.
- **Camada Git / filesystem (Tauri)**
  - Criar comandos Tauri (no backend Rust) para:
    - **Detectar repositório Git atual** (ex: a partir de `cwd` da app ou via path selecionado) e verificar se é um repo válido.
    - **Ler/escrever** o arquivo `.fivedollars/collections.json` dentro desse repo.
    - **Rodar comandos Git básicos** no repo selecionado:
      - `git status --porcelain` para ver se há mudanças pendentes.
      - `git add .fivedollars/collections.json`.
      - `git commit -m "chore(fivedollars): update collections"` (se houver mudanças).
    - Retornar ao frontend um **estado de vinculação Git** (repo path, branch atual, status de sync básico).
- **Modelo de versionamento de collections**
  - **Formato do arquivo**: `.fivedollars/collections.json` contendo um objeto com:
    - `version`: número de versão do esquema do arquivo (ex: `1`).
    - `collections`: array de `Collection` como já definido em `types/index.ts`.
    - Opcional: `meta` (ex: `lastUpdatedBy`, `lastUpdatedAt`, `appVersion`).
  - **Versionamento em equipe**: deixamos o Git tratar histórico/merge. O FiveDollars garante apenas que o arquivo JSON seja:
    - Determinístico (ordenar collections por `name`/`id` para evitar diffs ruins).
    - Válido com relação ao tipo `Collection`.
- **Fluxos principais de UX**
  - **Login / Vincular repo Git** (no `AboutModal`):
    - Nova aba ou seção "Git" dentro de `AboutModal` com:
      - Estado "Não vinculado" / "Vinculado".
      - Botão **"Vincular repositório"** que:
        - Em Tauri: abre um diálogo de seleção de pasta ou usa o `cwd` padrão.
        - Backend valida que há um `.git` e retorna informações do repo.
      - Exibe: caminho do repo, branch atual e info básica.
    - Conceitualmente, esse é o "login com Git" nesta primeira versão (vincula o app a um repo local).
  - **Git Sync** (também na aba Git ou em outro lugar do UI, como na `SidebarPanel`):
    - Botão **"Carregar collections do repo"**:
      - Lê `.fivedollars/collections.json` do repo vinculado.
      - Mostra um preview/resumo (ex: número de collections, nomes).
      - Opções de merge: por simplicidade inicial, opção principal "Substituir minhas collections atuais pelas do repo". Deixar merge mais avançado para depois.
    - Botão **"Salvar collections no repo"**:
      - Pega `collections` do `useAppStore`.
      - Serializa para `.fivedollars/collections.json` (via comando Tauri de escrita).
      - Opcional: botão toggle "Criar commit automaticamente".
        - Se ligado: roda `git add`/`git commit` com mensagem padrão.
  - **Feedback de status**:
    - Mostrar último sync (`lastSyncedAt`, branch) e se o arquivo local está modificado em relação ao repo (`git status`).

## Passos detalhados de implementação

- **1. Tipos e estado para Git sync no frontend**
  - Em `types` (ex: `types/index.ts` ou novo arquivo dedicado), criar tipos:
    - `GitRepoInfo` (path, branch, isClean, hasFivedollarsFolder, hasCollectionsFile).
    - `GitSyncStatus` (lastSyncedAt, lastAction, errorMessage opcional).
  - Em `useAppStore`:
    - Adicionar campos opcionais ao estado:
      - `gitRepo: GitRepoInfo | null`.
      - `gitSyncStatus: GitSyncStatus | null`.
    - Ações:
      - `setGitRepo(info: GitRepoInfo | null)`.
      - `setGitSyncStatus(status: GitSyncStatus | null)`.
    - Decidir se esse estado precisa ser persistido em `PersistedData` (provavelmente sim para lembrar o repo vinculado) e atualizar `PersistedData` e `persistence.ts`.
- **2. Backend Tauri: comandos para Git & arquivo .fivedollars**
  - Em `src-tauri` (provavelmente novo módulo `git_sync.rs` ou similar):
    - Comando `detect_git_repo`:
      - Entrada: opcional `path`.
      - Saída: `GitRepoInfo` (serializado para o TS correspondente).
    - Comando `read_git_collections`:
      - Entrada: `repoPath`.
      - Comportamento: ler `.fivedollars/collections.json`, parsear e devolver `collections` como JSON bruto.
    - Comando `write_git_collections`:
      - Entrada: `repoPath`, `collectionsJson` (string) ou estrutura serializável.
      - Comportamento: criar pasta `.fivedollars` se não existir; escrever arquivo; garantir ordenação determinística das collections se fizer sentido.
    - Comando `git_commit_collections` (opcional, controlado por toggle na UI):
      - Entrada: `repoPath`, talvez `message` custom.
      - Comportamento: rodar `git add .fivedollars/collections.json` e `git commit` se houver diff.
  - Registrar esses comandos em `tauri.conf.json`/`main.rs` como os demais comandos do app.
- **3. Serialização e validação de collections no frontend**
  - Criar util em `src/lib` (ex: `gitCollections.ts`):
    - `serializeCollectionsForGit(collections: Collection[]): string` → JSON string com `{ version: 1, collections, meta }`.
    - `parseCollectionsFromGit(raw: string): { collections: Collection[] }` com validação básica (campos obrigatórios, tipos principais).
  - Reutilizar tipos já existentes (`Collection`, `CollectionNode`, `RequestConfig`).
- **4. UI: aba Git no AboutModal**
  - Em `AboutModal.tsx`:
    - Estender `TabId` com `

