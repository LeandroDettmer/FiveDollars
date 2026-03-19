# .agents — Memória do projeto para IA

Esta pasta guarda contexto e decisões do projeto **FiveDollars** para que a IA (Cursor) se lembre do que já foi feito e como as coisas funcionam.

## Conteúdo

| Arquivo | O que guarda |
|---------|----------------|
| [project-context.md](project-context.md) | Stack, estrutura de pastas, convenções (resumo do AGENTS.md + extras). |
| [workspaces.md](workspaces.md) | Feature de workspaces: modelo de dados, store, persistência, UI e migração legada. |
| [patterns.md](patterns.md) | Padrões usados no código: persist, i18n, componentes comuns. |

## Uso

- **Antes de mexer no projeto:** ler `project-context.md` e, se for tocar em workspaces, `workspaces.md`.
- **Para manter:** ao implementar features grandes ou mudar arquitetura, atualizar ou criar arquivos aqui.

Não edite o plano em `.cursor/plans/`; use esta pasta como referência de “como está hoje”.
