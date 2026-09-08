<div align="center">

<img src="fivedollars-github-social.png" alt="FiveDollars API Client" width="800" />

<br />

# HTTP · SQL · agentes de IA. Uma janela só, totalmente local.

**Uma alternativa gratuita e focada em privacidade ao Postman e ao Insomnia, com
um cliente SQL e um cockpit para seus agentes de código embutidos.** Sem conta,
sem proxy, sem nuvem. Nativo no macOS, Windows e Linux. Também no navegador e
dentro do VS Code.

<br />

[![Latest release](https://img.shields.io/github/v/release/LeandroDettmer/FiveDollars?label=desktop&color=2d2d30&labelColor=3c3c3c)](https://github.com/LeandroDettmer/FiveDollars/releases/latest)
[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/LeandroDettmer.fivedollars?label=VS%20Marketplace&color=2d2d30&labelColor=3c3c3c)](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars)
[![Open VSX](https://img.shields.io/open-vsx/v/LeandroDettmer/fivedollars?label=Open%20VSX&color=2d2d30&labelColor=3c3c3c)](https://open-vsx.org/extension/LeandroDettmer/fivedollars)
[![npm — fivedollars-mcp](https://img.shields.io/npm/v/fivedollars-mcp?label=npm%20fivedollars-mcp&color=2d2d30&labelColor=3c3c3c)](https://www.npmjs.com/package/fivedollars-mcp)
[![GitHub stars](https://img.shields.io/github/stars/LeandroDettmer/FiveDollars?style=flat&color=2d2d30&labelColor=3c3c3c)](https://github.com/LeandroDettmer/FiveDollars)

<br />

<a href="https://fivedollars.dev/install"><img src="https://img.shields.io/badge/⬇%20%20Download%20for%20desktop-macOS%20·%20Windows%20·%20Linux-1f6feb?style=for-the-badge&labelColor=0d1117" alt="Download for desktop" /></a>
&nbsp;
<a href="https://app.fivedollars.dev"><img src="https://img.shields.io/badge/▶%20%20Open%20the%20web%20app-no%20install-2d2d30?style=for-the-badge&labelColor=0d1117" alt="Open the web app" /></a>

<br /><br />

[**Docs**](https://fivedollars.dev/docs) · [**Site**](https://fivedollars.dev) · [**Extensão VS Code**](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars) · [**Releases**](https://github.com/LeandroDettmer/FiveDollars/releases) · [**Reportar um problema**](https://github.com/LeandroDettmer/FiveDollars/issues)

[English](README.md) · **Português (Brasil)**

</div>

<br />

<!-- Captura principal do app. Ideal: janela 16:10 (~1600×1000) mostrando uma
     requisição com resposta, mais a aba SQL ou FiveCoding visível na barra de abas. -->
<div align="center">
  <img src="screenshots/app.png" alt="FiveDollars: editor de requisições com resposta ao vivo" width="900" />
</div>

<br />

## Três ferramentas em uma janela

<table>
<tr>
<td width="33%" valign="top">

### 🌐 Cliente HTTP

**O cliente de API do seu dia a dia, sem conta.**

- REST, GraphQL, **WebSocket, SSE, MQTT**
- 12 esquemas de auth, herdados por pasta
- Ambientes, scripts, testes sem código
- Runner, schedules, canvas de diagrama executável
- Importa Postman, Insomnia, OpenAPI, HAR, cURL

[Detalhes ↓](#cliente-http)

</td>
<td width="33%" valign="top">

### 🗄️ Cliente SQL

**Consulte o banco por trás da requisição.**

- PostgreSQL, MySQL, SQLite, SQL Server
- Autocomplete ciente do dialeto, `EXPLAIN` como grafo
- Edite resultados como uma planilha, confirme quando estiver pronto
- Trilhos de segurança para `DELETE`/`UPDATE` sem `WHERE`
- Salvo na sua coleção, senhas no keychain

[Detalhes ↓](#cliente-sql)

</td>
<td width="33%" valign="top">

### 🤖 FiveCoding

**Um cockpit para seus agentes de código.**

- Até 9 terminais reais: Claude Code, Codex, Gemini CLI
- Cada agente no seu próprio worktree git
- Um Claude maestro despacha scouts via MCP
- Sessões retomam após reiniciar, scrollback incluído
- Medidor de tokens ao vivo e `git diff` por pane

[Detalhes ↓](#fivecoding)

</td>
</tr>
</table>

<br />

## Por que o FiveDollars

| | |
|---|---|
| 🆓 **Gratuito** | O cliente principal é gratuito no desktop e na web. Sem conta, sem trial, sem cobrança por assento. |
| 🔒 **Local-first** | Coleções, ambientes e tokens ficam no seu disco. Funciona offline. As requisições vão direto para o destino, sem proxy. |
| 🖥️ **Em todo lugar** | Desktop nativo (Tauri + Rust), app de navegador e uma extensão VS Code / Cursor compartilham um único formato de workspace. |
| 🤝 **IA nos seus termos** | Os recursos de IA chamam o CLI `claude`, `codex` ou `gemini` que já está na sua máquina. Sem API key, nada roteado por nós. |
| 📦 **Migre em minutos** | Importe Postman, Insomnia, OpenAPI, HAR, cURL e Hoppscotch. Exporte de volta para Postman v2.1. |
| 🔁 **Sincronização Git-native** | Seu workspace é um arquivo JSON no seu próprio repositório. Pull requests viram o canal de revisão para mudanças na API. |

<br />

## Comece agora

| Plataforma | Instalação |
|---|---|
| **macOS** | Baixe o `.dmg` em [fivedollars.dev/install](https://fivedollars.dev/install) |
| **Windows** | Baixe o instalador `.exe` em [fivedollars.dev/install](https://fivedollars.dev/install) |
| **Linux** | `.AppImage` ou `.deb` nos [GitHub Releases](https://github.com/LeandroDettmer/FiveDollars/releases/latest) |
| **Navegador** | [app.fivedollars.dev](https://app.fivedollars.dev), nada para instalar |
| **VS Code / Cursor** | `code --install-extension LeandroDettmer.fivedollars` |
| **MCP para assistentes de IA** | `npx -y fivedollars-mcp` (veja [Servidor MCP](#servidor-mcp)) |

> **Beta e só no desktop:** o cliente SQL, o FiveCoding, a IA no app e a captura
> de login. Ficam escondidos no aplicativo web e na extensão VS Code.

<br />

---

## Cliente HTTP

**Métodos:** GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, CONNECT, TRACE, mais
**WebSocket, SSE e MQTT** como tipos de requisição de primeira classe.

**Corpos e parâmetros:** cabeçalhos, query params, path params, JSON, form data,
URL-encoded, raw, binário, GraphQL. Anexe um arquivo direto de um corpo JSON
digitando `{chave}`; o payload em Base64 é substituído só no momento do envio.

**Auth:** Basic, Bearer, API key, JWT, Digest, OAuth 1.0, OAuth 2.0, Hawk, AWS
SigV4, NTLM, Akamai EdgeGrid e ASAP, mais `inherit`, então uma pasta ou coleção
define a auth uma vez e toda requisição abaixo herda. O OAuth 2.0 recebe um token
colado; ainda não há grant flow embutido.

**Área de trabalho:** arraste uma aba para a direita para uma split view no
estilo VS Code, abra várias janelas no mesmo workspace e chegue em tudo pela
paleta de comandos.

<details>
<summary><b>Coleções, ambientes, runner, scripts, diagramas, schedules, sync</b></summary>

<br />

### Coleções & importação

Organize requisições em pastas e coleções, arraste para reordenar ou mover entre
coleções, aninhe pastas e execute uma pasta inteira de uma vez.

Importações: **Postman Collection v2.1**, **Insomnia** (JSON e YAML),
**OpenAPI / Swagger**, **HAR**, **cURL** e **Hoppscotch**. Exporta de volta para
Postman v2.1, e gera documentação em Markdown a partir de uma coleção.

### Ambientes

Defina variáveis uma vez e reutilize em qualquer lugar:

```txt
{{baseUrl}}
{{token}}
```

Usáveis em URLs, cabeçalhos, query params, corpos e campos de auth. Cada ambiente
carrega uma cor para que local, staging e produção fiquem visualmente distintos.
Helpers de mock data têm autocomplete enquanto você digita, e variáveis privadas
por coleção mantêm segredos fora do workspace compartilhado.

### Runner

Rode uma pasta de requisições sequencialmente ou em paralelo, com delays, ao
longo de várias iterações, ou **orientado por dados a partir de um arquivo
JSON** (uma execução por linha, com retry só nas linhas que falharam). As
execuções continuam em background enquanto você troca de workspace.

### Scripts & testes

JavaScript em sandbox antes ou depois de uma requisição para renovar tokens,
armazenar variáveis, interpretar respostas ou encadear chamadas.

```js
const { token } = fv.response.json();
fv.environment.set("token", token);
```

As APIs incluem `fv.environment`, `fv.collectionVariables` e
`fv.response.json()`.

Prefere sem código? Os **testes codeless** montam asserções a partir de um
campo, um operador e um valor esperado. O **contract drift** avisa quando uma
resposta deixa de bater com o formato que a requisição costumava devolver.

### Canvas de diagrama

Monte um fluxo visualmente e execute.

| Nó | O que faz |
|---|---|
| Request | Roda uma requisição HTTP; a resposta alimenta o próximo nó |
| SQL | Roda uma query em uma conexão salva |
| Data list | Itera uma lista com for-each |
| Login capture | Abre um browser embutido, você faz login, o token é extraído |
| Agent | Despacha um agente do FiveCoding e espera o report |

Extraia variáveis com caminhos usando wildcards, ramifique com if/else e mantenha
notas inline, tudo salvo dentro da coleção. Etapas de agente rodam
**sequencialmente**, mesmo quando desenhadas em paralelo.

### Schedules

Agende uma requisição ou uma sequência inteira do Runner em horário fixo ou por
intervalo ("a cada 30 minutos", "às 09:00"). Os schedules rodam **enquanto o
app está aberto**; não há daemon e nada roda na nossa nuvem.

### Git & sincronização

- **Git sync.** Sincronize um workspace com seu próprio repositório GitHub,
  armazenado em `.fivedollars/workspace.json`. Faça pull, commit e troque de
  branch.
- **Sync criptografado via API do GitHub.** Criptografia ponta a ponta (Argon2id
  → AES-256-GCM), funciona sem git instalado, inclusive pelo Safari no celular.
- **Pair Device.** Leve um workspace para outro dispositivo escaneando um QR
  code. A chave viaja no fragmento da URL e nunca chega ao GitHub.

</details>

<br />

## Cliente SQL

> Beta · só no desktop

<!-- Descomente quando screenshots/sql.png existir:
<div align="center">
  <img src="screenshots/sql.png" alt="Cliente SQL do FiveDollars" width="900" />
</div>
-->

Um cliente de banco estilo TablePlus dentro do app: conecte em **PostgreSQL,
MySQL, SQLite ou SQL Server**, navegue por tabelas, views e índices, e escreva
SQL com autocomplete ciente do dialeto.

- **Rode e leia.** Resultados em grid, `EXPLAIN` renderizado como grafo, e um
  histórico de queries que guarda resultados em cache.
- **Edite como uma planilha.** Altere células no grid de resultado; as edições
  ficam em staging e só são aplicadas quando você confirma.
- **Trilhos de segurança.** Uma etapa de confirmação para statements perigosos:
  `DELETE` ou `UPDATE` sem `WHERE`, `DROP`, e companhia.
- **Process list.** Inspecione as queries em execução e mate a que está
  segurando o lock.
- **Salvo como um nó.** A aba inteira, conexão mais toda sub-aba de query, salva
  como um único nó na sua coleção. Senhas nunca tocam o `data.json`.
- **SQL assistido por IA.** Descreva a query; o app rascunha com seu schema e
  índices como contexto, avisa quando parece cara, e oferece `EXPLAIN` antes de
  qualquer coisa rodar.

<br />

## FiveCoding

> Beta · só no desktop

<!-- Descomente quando screenshots/fivecoding.png existir:
<div align="center">
  <img src="screenshots/fivecoding.png" alt="Cockpit de agentes FiveCoding" width="900" />
</div>
-->

**Até 9 terminais reais, lado a lado, rodando Claude Code, Codex, Gemini CLI,
ou qualquer comando.** Cada um na sua própria pasta, opcionalmente num worktree
git isolado. Um Claude "maestro" pode abrir os outros, despachar tarefas e
coletar seus reports por um MCP local.

- **Terminais de verdade.** Um PTY real com a TUI original do agente: atalhos,
  `/comandos` e cores funcionam igual ao seu terminal.
- **Worktrees isolados.** Vários agentes no mesmo repo, cada um na sua branch.
  Ninguém pisa no trabalho de ninguém.
- **Maestro & scouts.** Um Claude pilota o cockpit: abre terminais, envia
  instruções, coleta resultados. Um painel **Squad** mostra quem despachou quem.
- **Sessões que voltam.** Fechou o app? Ao reabrir, cada terminal retoma a
  conversa de onde parou, com scrollback incluído.
- **Cockpit na sua coleção.** Salve o grid inteiro como um nó da coleção e
  reabra o mesmo setup com um clique.
- **Medidor de tokens ao vivo e painel de changes.** Os tokens somam em tempo
  real, e o `git diff` de cada pane fica ao lado do terminal que o produziu.
- **Skills & plugins.** Navegue e instale plugins do Claude Code sem sair do
  app.
- **FiveRemote.** Escaneie um QR code e pilote os terminais do seu celular na
  mesma Wi-Fi.

Abra pelo menu "+" do header do app.

<br />

## IA no app

> Beta · só no desktop

O FiveDollars usa o CLI de IA que você já tem: `claude`, `codex` ou `gemini`.
**Sem API key, sem conta FiveDollars, e nada roteado pelos nossos servidores.**

Ele pode gerar testes para uma resposta, montar uma requisição a partir de uma
descrição em linguagem natural, escrever SQL com seu schema como contexto, e
rascunhar fluxos de diagrama. Todo resultado aparece primeiro como preview. O
app nunca aplica uma mudança sozinho, e segredos nunca entram no prompt, só
nomes de variáveis.

<br />

## Servidor MCP

O `fivedollars-mcp` permite que assistentes de IA como Claude e Cursor leiam e
executem suas requisições e coleções salvas. Adicione à sua configuração MCP:

```json
{
  "mcpServers": {
    "fivedollars": {
      "command": "npx",
      "args": ["-y", "fivedollars-mcp"]
    }
  }
}
```

Depois peça coisas como:

- "Liste minhas coleções"
- "Envie a requisição get-user usando staging"
- "Importe essa spec OpenAPI numa coleção" (`import_from_spec` também aceita
  coleções do Postman e cURL puro)
- "Escaneie as rotas desse repo e crie as requisições" (`import_from_source` lê
  handlers de Express, Fastify, NestJS e FastAPI)
- "Abra três agentes e despache essa tarefa" (as tools do cockpit pilotam o
  FiveCoding)

Tudo que um assistente cria cai numa **inbox MCP** para você revisar antes de
tocar no seu workspace. Tudo roda localmente.

<br />

## Extensão VS Code

Mesma UI do app desktop, embutida no VS Code, Cursor, VSCodium e outros
editores compatíveis com Open VSX. O HTTP passa pelo extension host: sem CORS,
sem cabeçalhos removidos.

```bash
code --install-extension LeandroDettmer.fivedollars     # VS Marketplace
cursor --install-extension LeandroDettmer.fivedollars   # Open VSX
```

Depois abra a Paleta de Comandos e rode `FiveDollars: Open`.

<br />

## Privacidade

- Coleções e ambientes ficam na sua máquina.
- As requisições vão direto para a URL de destino, sem proxy no meio.
- A IA roda pelo seu CLI local. Nenhum prompt ou resposta é enviado a um
  servidor do FiveDollars.
- Tokens do GitHub ficam no keychain do sistema operacional; senhas de banco
  vão para o secret store do app, nunca para o arquivo de workspace.
- O MCP lê apenas dados locais do workspace.
- A telemetria opcional pode ser desativada nas configurações.

Veja [SECURITY.md](SECURITY.md) para a política de segurança e como reportar
uma vulnerabilidade.

<br />

## Solução de problemas

| Problema | Solução |
|---|---|
| macOS informa que o app está corrompido | Rode `xattr -cr /Applications/FiveDollars.app` |
| MCP não encontra o workspace | Abra o app ao menos uma vez para criar os dados do workspace |
| Ferramentas MCP não aparecem | Reinicie o Claude / Cursor depois de editar a configuração MCP |
| Aba SQL ou FiveCoding está faltando | As duas são só no desktop e ficam escondidas no app web e na extensão VS Code |
| FiveCoding não consegue iniciar um agente | Confira se o CLI (`claude`, `codex`, `gemini`) está no seu `PATH` |

<br />

---

<div align="center">

**[Download](https://fivedollars.dev/install)** · **[App web](https://app.fivedollars.dev)** · **[Docs](https://fivedollars.dev/docs)** · **[Issues](https://github.com/LeandroDettmer/FiveDollars/issues)**

<sub>Feito com React, TypeScript, Tauri 2 e Rust · Local-first · Gratuito</sub>

</div>
