<div align="center">

<img src="fivedollars-github-social.png" alt="FiveDollars API Client" width="800" />

<br />

# HTTP · SQL · AI agents. One window, fully local.

**A free, privacy-first alternative to Postman and Insomnia, with a SQL client and a
cockpit for your coding agents built in.** No account, no proxy, no cloud.
Native on macOS, Windows, and Linux. Also in the browser and inside VS Code.

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

[**Docs**](https://fivedollars.dev/docs) · [**Website**](https://fivedollars.dev) · [**VS Code extension**](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars) · [**Releases**](https://github.com/LeandroDettmer/FiveDollars/releases) · [**Report an issue**](https://github.com/LeandroDettmer/FiveDollars/issues)

**English** · [Português (Brasil)](README.pt-BR.md)

</div>

<br />

<!-- Main app screenshot. Ideal capture: 16:10 window (~1600×1000) showing a request
     with a response, plus the SQL or FiveCoding tab visible in the tab bar. -->
<div align="center">
  <img src="screenshots/app.png" alt="FiveDollars: request editor with a live response" width="900" />
</div>

<br />

## Three tools in one window

<table>
<tr>
<td width="33%" valign="top">

### 🌐 HTTP client

**The everyday API client, without the account.**

- REST, GraphQL, **WebSocket, SSE, MQTT**
- 12 auth schemes, inherited down folders
- Environments, scripts, codeless tests
- Runner, schedules, executable diagram canvas
- Import Postman, Insomnia, OpenAPI, HAR, cURL

[Details ↓](#http-client)

</td>
<td width="33%" valign="top">

### 🗄️ SQL client

**Query the database behind the request.**

- PostgreSQL, MySQL, SQLite, SQL Server
- Dialect-aware autocomplete, `EXPLAIN` as a graph
- Edit results like a spreadsheet, commit when ready
- Guard rails for `DELETE`/`UPDATE` without `WHERE`
- Saved in your collection, passwords in the keychain

[Details ↓](#sql-client)

</td>
<td width="33%" valign="top">

### 🤖 FiveCoding

**A cockpit for your coding agents.**

- Up to 9 real terminals: Claude Code, Codex, Gemini CLI
- Each agent on its own git worktree
- A maestro Claude dispatches scouts via MCP
- Sessions resume after restart, scrollback included
- Live token meter and per-pane `git diff`

[Details ↓](#fivecoding)

</td>
</tr>
</table>

<br />

## Why FiveDollars

| | |
|---|---|
| 🆓 **Free** | The core client is free on desktop and web. No account, no trial, no seat pricing. |
| 🔒 **Local-first** | Collections, environments, and tokens live on your disk. Works offline. Requests go straight to the target, no proxy. |
| 🖥️ **Everywhere** | Native desktop (Tauri + Rust), browser app, and a VS Code / Cursor extension share one workspace format. |
| 🤝 **AI on your terms** | AI features shell out to the `claude`, `codex`, or `gemini` CLI already on your machine. No API key, nothing routed through us. |
| 📦 **Migrate in minutes** | Import Postman, Insomnia, OpenAPI, HAR, cURL, and Hoppscotch. Export back to Postman v2.1. |
| 🔁 **Git-native sync** | Your workspace is a JSON file in your own repo. Pull requests become the review channel for API changes. |

<br />

## Get started

| Platform | Install |
|---|---|
| **macOS** | Download the `.dmg` from [fivedollars.dev/install](https://fivedollars.dev/install) |
| **Windows** | Download the `.exe` installer from [fivedollars.dev/install](https://fivedollars.dev/install) |
| **Linux** | `.AppImage` or `.deb` from [GitHub Releases](https://github.com/LeandroDettmer/FiveDollars/releases/latest) |
| **Browser** | [app.fivedollars.dev](https://app.fivedollars.dev), nothing to install |
| **VS Code / Cursor** | `code --install-extension LeandroDettmer.fivedollars` |
| **MCP for AI assistants** | `npx -y fivedollars-mcp` (see [MCP server](#mcp-server)) |

> **Beta and desktop-only:** the SQL client, FiveCoding, in-app AI, and login
> capture. They are hidden in the web app and in the VS Code extension.

<br />

---

## HTTP client

**Methods:** GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, CONNECT, TRACE, plus
**WebSocket, SSE, and MQTT** as first-class request types.

**Bodies and params:** headers, query params, path params, JSON, form data,
URL-encoded, raw, binary, GraphQL. Attach a file inline from a JSON body by
typing `{key}`; the Base64 payload is substituted only at send time.

**Auth:** Basic, Bearer, API key, JWT, Digest, OAuth 1.0, OAuth 2.0, Hawk, AWS
SigV4, NTLM, Akamai EdgeGrid, and ASAP, plus `inherit`, so a folder or collection
defines auth once and every request below picks it up. OAuth 2.0 takes a pasted
token; there is no built-in grant flow yet.

**Workspace:** drag a tab to the right for a VS Code-like split view, open several
windows on the same workspace, and reach everything from the command palette.

<details>
<summary><b>Collections, environments, runner, scripts, diagrams, schedules, sync</b></summary>

<br />

### Collections & import

Organize requests into folders and collections, drag to reorder or move between
collections, nest folders, and run an entire folder at once.

Imports: **Postman Collection v2.1**, **Insomnia** (JSON and YAML),
**OpenAPI / Swagger**, **HAR**, **cURL**, and **Hoppscotch**. Exports back to
Postman v2.1, and generates Markdown documentation from a collection.

### Environments

Define variables once and reuse them anywhere:

```txt
{{baseUrl}}
{{token}}
```

Usable in URLs, headers, query params, bodies, and auth fields. Each environment
carries a color tag so local, staging, and production stay visually distinct.
Mock-data helpers autocomplete as you type, and collection-scoped private
variables keep secrets out of the shared workspace.

### Runner

Run a folder of requests sequentially or in parallel, with delays, across
multiple iterations, or **data-driven from a JSON file** (one run per row,
retrying only the rows that failed). Runs continue in the background while you
switch workspaces.

### Scripts & tests

Sandboxed JavaScript before or after a request to refresh tokens, store
variables, parse responses, or chain calls.

```js
const { token } = fv.response.json();
fv.environment.set("token", token);
```

APIs include `fv.environment`, `fv.collectionVariables`, and `fv.response.json()`.

Prefer no code? **Codeless tests** build assertions from a field, an operator, and
an expected value. **Contract drift** flags a response that no longer matches the
shape the request used to return.

### Diagram canvas

Wire a flow together visually and execute it.

| Node | What it does |
|---|---|
| Request | Runs an HTTP request; its response feeds the next node |
| SQL | Runs a query against a saved connection |
| Data list | Iterates a list with for-each |
| Login capture | Opens an embedded browser, you log in, the token is extracted |
| Agent | Dispatches a FiveCoding agent and waits for its report |

Extract variables with wildcard paths, branch with if/else, and keep inline notes,
all saved inside the collection. Agent steps run **sequentially**, even when drawn
in parallel.

### Schedules

Schedule a request or a whole Runner sequence at a fixed time or on an interval
("every 30 minutes", "at 09:00"). Schedules run **while the app is open**; there
is no daemon and nothing runs in our cloud.

### Git & sync

- **Git sync.** Sync a workspace with your own GitHub repository, stored at
  `.fivedollars/workspace.json`. Pull, commit, and switch branches.
- **Encrypted sync via the GitHub API.** End-to-end encrypted (Argon2id →
  AES-256-GCM), works without git installed, including from mobile Safari.
- **Pair Device.** Move a workspace to another device by scanning a QR code. The
  key travels in the URL fragment and never reaches GitHub.

</details>

<br />

## SQL client

> Beta · desktop only

<!-- Uncomment when screenshots/sql.png exists:
<div align="center">
  <img src="screenshots/sql.png" alt="FiveDollars SQL client" width="900" />
</div>
-->

A TablePlus-style database client inside the app: connect to **PostgreSQL, MySQL,
SQLite, or SQL Server**, browse tables, views and indexes, and write SQL with
dialect-aware autocomplete.

- **Run and read.** Results in a grid, `EXPLAIN` rendered as a graph, and a query
  history that keeps cached results.
- **Edit like a spreadsheet.** Change cells in the result grid; edits are staged
  and only applied when you commit them.
- **Guard rails.** A confirmation step for dangerous statements: `DELETE` or
  `UPDATE` without a `WHERE`, `DROP`, and friends.
- **Process list.** Inspect running queries and kill the one holding the lock.
- **Saved as one node.** The whole tab, connection plus every query sub-tab,
  saves as a single node in your collection. Passwords never touch `data.json`.
- **AI-assisted SQL.** Describe the query; the app drafts it with your schema and
  indexes as context, warns when it looks expensive, and offers `EXPLAIN` before
  anything runs.

<br />

## FiveCoding

> Beta · desktop only

<!-- Uncomment when screenshots/fivecoding.png exists:
<div align="center">
  <img src="screenshots/fivecoding.png" alt="FiveCoding agent cockpit" width="900" />
</div>
-->

**Up to 9 real terminals, side by side, running Claude Code, Codex, Gemini CLI,
or any command.** Each one in its own folder, optionally on an isolated git
worktree. A "maestro" Claude can open the others, dispatch tasks, and collect
their reports through a local MCP.

- **Real terminals.** A true PTY with the agent's original TUI: shortcuts,
  `/commands`, and colors work just like your terminal.
- **Isolated worktrees.** Several agents on the same repo, each on its own
  branch. Nobody steps on anyone's work.
- **Maestro & scouts.** One Claude pilots the cockpit: opens terminals, sends
  instructions, collects results. A **Squad** panel shows who dispatched whom.
- **Sessions that come back.** Closed the app? On reopen, every terminal resumes
  the conversation where it left off, scrollback included.
- **Cockpit in your collection.** Save the whole grid as a collection node and
  reopen the same setup in one click.
- **Live token meter and changes panel.** Tokens add up in real time, and each
  pane's `git diff` sits right next to the terminal that produced it.
- **Skills & plugins.** Browse and install Claude Code plugins without leaving
  the app.
- **FiveRemote.** Scan a QR code and drive the terminals from your phone on the
  same Wi-Fi.

Open it from the app header's "+" menu.

<br />

## AI in the app

> Beta · desktop only

FiveDollars uses the AI CLI you already have: `claude`, `codex`, or `gemini`.
**No API key, no FiveDollars account, and nothing routed through our servers.**

It can generate tests for a response, build a request from a plain-language
description, write SQL with your schema as context, and draft diagram flows.
Every result is shown as a preview first. The app never applies a change on its
own, and secrets never enter the prompt, only variable names.

<br />

## MCP server

`fivedollars-mcp` lets AI assistants such as Claude and Cursor read and run your
saved requests and collections. Add it to your MCP configuration:

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

Then ask things like:

- "List my collections"
- "Send the get-user request using staging"
- "Import this OpenAPI spec into a collection" (`import_from_spec` also takes
  Postman collections and raw cURL)
- "Scan the routes in this repo and create the requests" (`import_from_source`
  reads Express, Fastify, NestJS, and FastAPI handlers)
- "Open three agents and dispatch this task" (cockpit tools drive FiveCoding)

Anything an assistant creates lands in an **MCP inbox** for you to review before
it touches your workspace. Everything runs locally.

<br />

## VS Code extension

Same UI as the desktop app, embedded in VS Code, Cursor, VSCodium, and other Open
VSX compatible editors. HTTP runs through the extension host: no CORS, no
stripped headers.

```bash
code --install-extension LeandroDettmer.fivedollars     # VS Marketplace
cursor --install-extension LeandroDettmer.fivedollars   # Open VSX
```

Then open the Command Palette and run `FiveDollars: Open`.

<br />

## Privacy

- Collections and environments stay on your machine.
- Requests go directly to the target URL, with no proxy in the middle.
- AI runs through your local CLI. No prompt or response is sent to a FiveDollars server.
- GitHub tokens are stored in the OS keychain; database passwords go to the app's
  secret store, never into the workspace file.
- MCP reads local workspace data only.
- Optional telemetry can be disabled in settings.

See [SECURITY.md](SECURITY.md) for the security policy and how to report a
vulnerability.

<br />

## Troubleshooting

| Issue | Solution |
|---|---|
| macOS reports the app is damaged | Run `xattr -cr /Applications/FiveDollars.app` |
| MCP cannot find the workspace | Open the app at least once to create workspace data |
| MCP tools do not appear | Restart Claude / Cursor after editing the MCP config |
| SQL or FiveCoding tab is missing | Both are desktop-only and hidden in the web app and VS Code extension |
| FiveCoding cannot start an agent | Make sure the CLI (`claude`, `codex`, `gemini`) is on your `PATH` |

<br />

---

<div align="center">

**[Download](https://fivedollars.dev/install)** · **[Web app](https://app.fivedollars.dev)** · **[Docs](https://fivedollars.dev/docs)** · **[Issues](https://github.com/LeandroDettmer/FiveDollars/issues)**

<sub>Built with React, TypeScript, Tauri 2, and Rust · Local-first · Free</sub>

</div>
