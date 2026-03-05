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
      "https://raw.githubusercontent.com/LeandroDettmer/FiveDollars/main/latest.json"
    ]
  }
}
```

## 3. Configurar a chave privada no GitHub (CI)

O workflow grava o valor do secret num arquivo e passa o **caminho** desse arquivo para o Tauri. O Tauri espera o **conteúdo** do arquivo `.key` (geralmente uma linha em base64, no formato gerado por `tauri signer generate`). Não use base64 do arquivo — use o conteúdo direto.

1. No seu computador, copie o conteúdo do arquivo da chave (uma linha):
   ```bash
   cat ~/.tauri/FiveDollars.key
   ```
   Copie **toda** a linha (começa com algo como `dW50cnVzdGVk...`). Não adicione quebras de linha.

2. No repositório no GitHub: **Settings → Secrets and variables → Actions** → **Repository secrets**
3. Crie ou edite o secret **TAURI_SIGNING_PRIVATE_KEY**
4. Valor: cole **só** essa linha (conteúdo do .key), sem espaços ou quebras no início/fim. O CI remove espaços/quebras acidentais antes de gravar no arquivo.

**Chave com senha (rsign encrypted):** se ao gerar você definiu senha, crie também o secret **TAURI_SIGNING_PRIVATE_KEY_PASSWORD** com essa senha. Se deixou senha em branco, pode criar o secret com valor vazio ou deixar sem criar (o workflow trata como vazio).

Assim, ao publicar um release (ou rodar o workflow manualmente com uma tag), o CI vai:

- Gerar os instaladores e os arquivos `.sig`
- Incluir o `latest.json` no release
- Fazer push do `latest.json` na raiz do repo (para ser servido em `raw.githubusercontent.com`) — o app usa essa URL para evitar o redirect 302 da URL `releases/latest/download/latest.json`, que o plugin updater pode não tratar corretamente
- O app instalado vai conseguir verificar e baixar a nova versão ao clicar em **Verificar atualizações** (Sobre / Dados na sidebar).

## Resumo

| Onde            | O quê |
|-----------------|--------|
| `tauri.conf.json` | Conteúdo do arquivo **.pub** (chave pública) |
| GitHub Secret   | Conteúdo do arquivo da chave **privada** |

Sem a chave privada no CI, o build ainda roda, mas os `.sig` não são gerados e o `latest.json` pode ficar incompleto; o updater no app só funciona com assinaturas válidas.

## Erro: "Invalid symbol 32" ou "Missing comment in secret key"

- **Invalid symbol 32 (offset 9):** o Tauri espera o arquivo da chave com **uma linha em base64** (o formato gerado por `tauri signer generate`). Se o secret for o base64 *desse* conteúdo, o CI decodifica e grava texto; o Tauri tenta decodificar de novo e falha. Use no secret o **conteúdo do .key** direto: `cat ~/.tauri/FiveDollars.key` e cole no **TAURI_SIGNING_PRIVATE_KEY** (uma linha, sem base64 extra).
- **Missing comment:** o valor do secret não está no formato esperado. Use exatamente o conteúdo do arquivo `.key` (uma linha), como acima.
