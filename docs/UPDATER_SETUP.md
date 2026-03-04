# Configuração do auto-update (Tauri Updater)

Para o aplicativo verificar e instalar atualizações a partir dos releases do GitHub, é necessário configurar a assinatura das atualizações.

**Se o `npm run tauri build` falhar com erro no `build-script-build`** (por causa da chave do updater), gere as chaves (passo 1 abaixo) e coloque a chave **pública** no `tauri.conf.json` antes de rodar o build de novo.

## 1. Gerar chaves de assinatura

No seu computador, execute (uma vez):

```bash
npm run tauri -- signer generate -w ~/.tauri/FiveDollars.key
```

> **Nota:** O `--` é necessário para que o npm repasse o `-w` ao Tauri (senão o npm interpreta `-w` como `--workspace`).

Isso gera dois arquivos, por exemplo:
- `~/.tauri/FiveDollars.key` — **chave privada** (nunca compartilhe nem commite)
- `~/.tauri/FiveDollars.key.pub` — chave pública

## 2. Configurar a chave pública no projeto

Abra `src-tauri/tauri.conf.json` e substitua `SUBSTITUA_PELA_SUA_CHAVE_PUBLICA` pelo **conteúdo completo** do arquivo `.pub` (uma única linha):

```json
"plugins": {
  "updater": {
    "pubkey": "CONTEÚDO_COLETADO_DO_ARQUIVO_.pub_AQUI",
    "endpoints": [
      "https://github.com/LeandroDettmer/FiveDollars/releases/latest/download/latest.json"
    ]
  }
}
```

## 3. Configurar a chave privada no GitHub (CI)

Para o workflow de release gerar os artefatos assinados e o `latest.json`:

1. No repositório no GitHub: **Settings → Secrets and variables → Actions**
2. **New repository secret**
3. Nome: `TAURI_SIGNING_PRIVATE_KEY`
4. Valor: cole o **conteúdo completo** do arquivo da chave privada (`~/.tauri/FiveDollars.key`)

Assim, ao publicar um release (ou rodar o workflow manualmente com uma tag), o CI vai:

- Gerar os instaladores e os arquivos `.sig`
- Incluir o `latest.json` no release
- O app instalado vai conseguir verificar e baixar a nova versão ao clicar em **Verificar atualizações** (Sobre / Dados na sidebar).

## Resumo

| Onde            | O quê |
|-----------------|--------|
| `tauri.conf.json` | Conteúdo do arquivo **.pub** (chave pública) |
| GitHub Secret   | Conteúdo do arquivo da chave **privada** |

Sem a chave privada no CI, o build ainda roda, mas os `.sig` não são gerados e o `latest.json` pode ficar incompleto; o updater no app só funciona com assinaturas válidas.
