# Padrões de código no FiveDollars

Padrões recorrentes para manter consistência.

## Persistência

- **Onde:** `src/lib/persistence.ts` (load/save), `src/store/useAppStore.ts` (função `persist()` e `setStateFromPersisted()`).
- **Fluxo:** alterações no store chamam `persist(get())` no final. `persist()` monta o payload (para workspaces: snapshot do ativo no array) e chama `saveAppData(data)`.
- **Carregamento:** `App.tsx` chama `loadAppData().then(setStateFromPersisted)` na montagem.
- **Compatibilidade:** novos campos no `PersistedData` devem ser opcionais ou ter fallback no parse e na migração em `setStateFromPersisted`.

## i18n

- **Chaves:** definidas em `src/locales/en.ts`; tipo `TranslationKeys = keyof typeof en`.
- **pt-BR:** `src/locales/pt-BR.ts` deve ter as mesmas chaves que `en`.
- **Uso:** `const { t } = useT();` e `t("sidebar.newCollection")` ou `t("message", { name: "x" })` para interpolação `{name}`.
- Ao adicionar feature: adicionar chaves em `en.ts` e `pt-BR.ts` juntas.

## Componentes de UI

- **Modais de confirmação:** usar `ConfirmModal` (title, message, confirmLabel, cancelLabel, danger?, onConfirm, onClose).
- **Fechar ao clicar fora:** `useClickOutside(ref, onClose, enabled)` em `lib/useClickOutside.ts`.
- **Dropdowns:** estilo alinhado ao tema (bg, border, hover) em `App.css`; exemplo de padrão em `.collection-dropdown` e `.workspace-dropdown`.

## Store (Zustand)

- Estado “derivado” do workspace ativo: collections, environments, currentEnv, git*, etc. são mantidos em estado plano e sincronizados com o workspace ativo no `persist()` e ao trocar de workspace.
- Ao adicionar novo dado por workspace: incluir em `WorkspaceData`, em `applyWorkspaceToFlatState`, no snapshot em `persist()` e na migração em `setStateFromPersisted`.
