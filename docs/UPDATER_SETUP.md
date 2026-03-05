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

O GitHub pode alterar quebras de linha em secrets. Por isso o workflow espera a chave em **base64** (uma única linha), e o CI decodifica antes do build.

**Importante:** o arquivo da chave privada (`FiveDollars.key`) deve ser usado **inteiro**. Ele tem várias linhas, por exemplo:
- `untrusted comment: minisign secret key`
- uma linha em branco ou com senha
- duas linhas com dados em base64

Se você colar no secret só as linhas de base64 (sem a primeira linha de comentário), o CI falha com **"Missing comment in secret key"**. Use sempre o arquivo completo.

1. No seu computador, gere o valor para o secret (arquivo **inteiro** em base64, uma única linha):
   ```bash
   base64 < ~/.tauri/FiveDollars.key | tr -d '\n'
   ```
   Copie a saída inteira (uma linha longa). No Linux você pode usar `base64 -w 0 ~/.tauri/FiveDollars.key` em vez disso.

2. No repositório no GitHub: **Settings → Secrets and variables → Actions**
3. Crie ou edite o secret **TAURI_SIGNING_PRIVATE_KEY**
4. Valor: cole **só** a linha em base64 (sem comentários, sem espaços ou quebras no início/fim). O CI decodifica esse valor e grava no arquivo que o Tauri usa; por isso o secret deve ser **só** o base64, nada mais.

**Chave com senha (rsign encrypted):** se ao gerar você definiu senha, crie também o secret **TAURI_SIGNING_PRIVATE_KEY_PASSWORD** com essa senha. Se deixou senha em branco, pode criar o secret com valor vazio ou deixar sem criar (o workflow trata como vazio).

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

## Erro: "Missing comment in secret key"

Significa que o valor do secret **TAURI_SIGNING_PRIVATE_KEY** não é o base64 do arquivo da chave **inteiro**. O minisign exige a primeira linha do arquivo (`untrusted comment: minisign secret key`).

**Como corrigir:** no seu computador, rode de novo:
```bash
base64 < ~/.tauri/FiveDollars.key | tr -d '\n'
```
Copie **toda** a saída (incluindo o início, que decodifica para "untrusted comment...") e atualize o secret no GitHub com esse valor. Não use só as últimas linhas do arquivo.
