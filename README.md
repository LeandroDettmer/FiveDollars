<div align="center">

<img src="fivedollars-github-social.png" alt="FiveDollars API Client" width="800" />

**The HTTP client for your everyday work, fully local. Now with SQL, too.**

A privacy-first alternative to Postman and Insomnia — and to a heavyweight SQL
client. Build, organize, and automate HTTP requests with environments, scripting,
a batch runner, an executable request canvas, and Git sync. Then query your
database in the same app, and run a cockpit of AI coding agents next to it — on
macOS, Windows, and Linux.

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/LeandroDettmer.fivedollars?label=VS%20Marketplace&color=2d2d30&labelColor=3c3c3c)](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars)
[![Open VSX](https://img.shields.io/open-vsx/v/LeandroDettmer/fivedollars?label=Open%20VSX&color=2d2d30&labelColor=3c3c3c)](https://open-vsx.org/extension/LeandroDettmer/fivedollars)
[![npm — fivedollars-mcp](https://img.shields.io/npm/v/fivedollars-mcp?label=npm%20fivedollars-mcp&color=2d2d30&labelColor=3c3c3c)](https://www.npmjs.com/package/fivedollars-mcp)
[![Website](https://img.shields.io/badge/website-fivedollars.dev-2d2d30?labelColor=3c3c3c)](https://fivedollars.dev)
[![GitHub stars](https://img.shields.io/github/stars/LeandroDettmer/FiveDollars?style=flat&color=2d2d30&labelColor=3c3c3c)](https://github.com/LeandroDettmer/FiveDollars)

[**Web app**](https://app.fivedollars.dev) · [**Download desktop**](https://fivedollars.dev/install) · [**VSCode extension**](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars) · [**Docs**](https://fivedollars.dev/docs) · [**Website**](https://fivedollars.dev)

**English** · [Português (Brasil)](README.pt-BR.md)

</div>

<br />

<!-- Main app screenshot lives at screenshots/app.png. Replace it with a capture
     that shows the current UI (ideally with the SQL tab or FiveCoding grid in
     view) whenever the interface changes. -->
<div align="center">
  <img src="screenshots/app.png" alt="FiveDollars API Client" width="900" />
</div>

<br />

---

## Overview

FiveDollars is a local-first API client that runs natively on desktop, in the
browser, and inside your editor — all sharing the same workspace format. No
account, no proxy, no subscription. On desktop it goes further: a built-in SQL
client, a cockpit of real terminals running your AI coding agents, and AI
features that use the CLI you already have installed.

- **Free.** The core client is free on desktop and web. No account required to start.
- **Local-first.** Collections, environments, and tokens stay on your machine, and
  the app works offline.
- **Cross-platform.** Native desktop for macOS, Windows, and Linux (Tauri), a
  browser web app, and a VSCode / Cursor extension all share the same workspace
  format.
- **HTTP + SQL + AI agents.** One window for the request you are debugging, the
  query behind it, and the agents writing the fix.
- **Automatable.** Scriptable requests, a batch runner, an executable canvas, and
  an MCP server that lets AI assistants drive your saved requests.
- **Migrate in minutes.** Import existing Postman, Insomnia, OpenAPI, HAR, cURL,
  and Hoppscotch collections and keep working.

Built with React, TypeScript, Tauri 2, and Rust. HTTP runs through the native
layer, so there is no proxy in the middle and no CORS workarounds.

---

## Availability

| Platform | Link |
|---|---|
| Web app | https://app.fivedollars.dev |
| Desktop app | https://fivedollars.dev/install |
| VSCode extension | https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars |
| Open VSX extension | https://open-vsx.org/extension/LeandroDettmer/fivedollars |
| MCP server | https://www.npmjs.com/package/fivedollars-mcp |

> The SQL client, FiveCoding, in-app AI, and login capture are **desktop-only and
> in beta**. They are hidden in the web app and in the VSCode extension.

---

## Features

### HTTP client

**Methods:** GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, CONNECT, TRACE — plus
**WebSocket, SSE, and MQTT** as first-class request types, not add-ons.

**Bodies and params:** headers, query params, path params, JSON, form data,
URL-encoded, raw, binary, GraphQL. Attach a file inline from a JSON body by
typing `{key}` — the Base64 payload is substituted only at send time.

**Auth:** 12 schemes — Basic, Bearer, API key, JWT, Digest, OAuth 1.0, OAuth 2.0,
Hawk, AWS SigV4, NTLM, Akamai EdgeGrid, and ASAP — plus `inherit`, so a folder or
collection can define auth once and every request below it picks it up. OAuth 2.0
takes a token you paste; there is no built-in grant flow yet.

**Workspace:** drag a tab to the right of the main panel for a VS Code-like split
view, open multiple windows on the same workspace, and reach everything through
the command palette.

### SQL client · beta, desktop only

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
- **Guard rails.** A confirmation step for dangerous statements — `DELETE` or
  `UPDATE` without a `WHERE`, `DROP`, and friends.
- **Process list.** Inspect running queries and kill the one holding the lock.
- **Saved as one node.** The whole tab — connection plus every query sub-tab —
  saves as a single node in your collection and reopens exactly as you left it.
  Passwords never touch `data.json`.

### FiveCoding · beta, desktop only

<!-- Uncomment when screenshots/fivecoding.png exists:
<div align="center">
  <img src="screenshots/fivecoding.png" alt="FiveCoding agent cockpit" width="900" />
</div>
-->

**A cockpit for your coding agents. Up to 9 real terminals, side by side.**

FiveCoding runs Claude Code, Codex, Gemini CLI, or any command in real terminals
inside FiveDollars. Each one in its own folder, optionally on an isolated git
worktree — and a "maestro" Claude can open the others, dispatch tasks, and
collect their reports via MCP.

- **Real terminals.** A true PTY with the agent's original TUI: shortcuts,
  `/commands`, and colors work just like your terminal.
- **Isolated worktrees.** Several agents on the same repo, each on its own
  branch — nobody steps on anyone's work.
- **Maestro & scouts.** One Claude pilots the cockpit: it opens terminals, sends
  instructions, and collects results, all through a local MCP.
- **Sessions that come back.** Closed the app? On reopen, every terminal resumes
  the conversation exactly where it left off, scrollback included.
- **Cockpit in your collection.** Save the whole grid as a collection node and
  reopen the same setup in one click — the conversation never goes with it.
- **Live token meter.** A toolbar meter adds up the tab's tokens in real time
  while the agents work.
- **Changes panel.** The `git diff` for each pane, right next to the terminal
  that produced it.

Open it from the app header's "+" menu.

### AI in the app · beta, desktop only

FiveDollars uses the AI CLI you already have — `claude`, `codex`, or `gemini`.
**No API key, no FiveDollars account, and nothing routed through our servers:**
the app shells out to the binary on your machine.

It can generate tests for a response, build a request from a plain-language
description, write SQL (with your schema and indexes as context, plus a warning
when a query looks expensive), and draft diagram flows. Every result is shown as
a preview first — the app never applies a change on its own.

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

Run a folder of requests:

- sequentially or in parallel
- with delays between calls
- across multiple iterations
- **data-driven from a JSON file**, one run per row, retrying only the rows that
  failed

Runs continue in the background while you switch workspaces.

### Scripts & tests

Run sandboxed JavaScript before or after a request to refresh tokens, store
variables, parse responses, or chain calls.

```js
const { token } = fv.response.json();
fv.environment.set("token", token);
```

Available APIs include `fv.environment`, `fv.collectionVariables`, and
`fv.response.json()`.

Prefer no code? **Codeless tests** build assertions from a field, an operator, and
an expected value. **Contract drift** flags a response that no longer matches the
shape the request used to return.

### Diagram canvas

Wire a flow together visually and execute it. Five node types:

| Node | What it does |
|---|---|
| Request | Runs an HTTP request; its response feeds the next node |
| SQL | Runs a query against a saved connection |
| Data list | Iterates a list with for-each |
| Login capture | Opens an embedded browser, you log in, the token is extracted |
| Agent | Dispatches a FiveCoding agent and waits for its report |

Extract variables from responses with wildcard paths, branch with if/else, and
keep inline notes documenting the flow — all saved inside the collection itself.

> Agent steps run **sequentially**: two agent nodes drawn in parallel still
> execute one after the other.

### Schedules

Schedule a single request or a whole Runner sequence at a fixed time or on an
interval — "every 30 minutes", "at 09:00". Schedules run **while the app is
open**; there is no daemon and nothing runs in our cloud.

### Git & sync

- **Git sync.** Sync a workspace with your own GitHub repository, stored at
  `.fivedollars/workspace.json`. Pull, commit, and switch branches, so pull
  requests become the review channel for collection changes.
- **Encrypted sync via the GitHub API.** End-to-end encrypted (Argon2id →
  AES-256-GCM) and works without git installed — including from mobile Safari.
- **Pair Device.** Move a workspace to another device by scanning a QR code. The
  key travels in the URL fragment, so it never reaches GitHub.

---

## VSCode extension

An optional extension for VSCode, Cursor, VSCodium, and other Open VSX–compatible
editors. Same UI as the desktop app, embedded in your editor, with HTTP running
through the extension host — no CORS, no stripped headers.

```bash
# VS Marketplace
code --install-extension LeandroDettmer.fivedollars

# Open VSX (Cursor / VSCodium)
cursor --install-extension LeandroDettmer.fivedollars
codium --install-extension LeandroDettmer.fivedollars
```

Or install manually from a `.vsix` file. Then open the Command Palette and run:

```txt
FiveDollars: Open
```

---

## MCP server

`fivedollars-mcp` lets AI assistants such as Claude and Cursor read and run your
saved requests and collections — 19 tools in total. Add it to your MCP
configuration:

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
- "Import this OpenAPI spec into a collection" — `import_from_spec` also takes
  Postman collections and raw cURL
- "Scan the routes in this repo and create the requests" —
  `import_from_source` reads Express, Fastify, NestJS, and FastAPI handlers
- "Open three agents and dispatch this task" — five cockpit tools drive
  FiveCoding

Anything an assistant creates lands in an **MCP inbox** for you to review before
it touches your workspace. Everything runs locally against your existing
FiveDollars workspace.

---

## Privacy

- Collections and environments stay on your machine.
- Requests go directly to the target URL, with no proxy in the middle.
- **AI runs through your local CLI.** No API key, and no prompt or response is
  sent to a FiveDollars server.
- GitHub tokens are stored in the OS keychain; database passwords go to the app's
  secret store, never into the workspace file.
- MCP reads local workspace data only.
- The usage dashboard is aggregated on-device.
- Optional telemetry can be disabled in settings.

See [SECURITY.md](SECURITY.md) for the security policy and how to report a
vulnerability.

---

## Customization

- Multiple themes, light and dark included.
- Remappable keyboard shortcuts for the actions you use most.
- Pick your own monospace font for editors and terminals.
- Usage and storage dashboards, computed locally.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| macOS reports the app is damaged | Run `xattr -cr /Applications/FiveDollars.app` |
| Wrong installer downloaded | Download directly from GitHub Releases |
| MCP cannot find the workspace | Open the app at least once to create workspace data |
| MCP tools do not appear | Restart Claude / Cursor after editing the MCP config |
| SQL or FiveCoding tab is missing | Both are desktop-only — they are hidden in the web app and the VSCode extension |
| FiveCoding cannot start an agent | Make sure the CLI (`claude`, `codex`, `gemini`) is on your `PATH` |

---

## Download

- Website — https://fivedollars.dev
- Desktop app — https://fivedollars.dev/install
- Releases — https://github.com/LeandroDettmer/FiveDollars/releases

---

## Links

- Docs — https://fivedollars.dev/docs
- GitHub — https://github.com/LeandroDettmer/FiveDollars
- Issues — https://github.com/LeandroDettmer/FiveDollars/issues
- VS Marketplace — https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars
- Open VSX — https://open-vsx.org/extension/LeandroDettmer/fivedollars
- MCP package — https://www.npmjs.com/package/fivedollars-mcp

---

<div align="center">
<sub>Built with React, Tauri, and Rust · Local-first · Free</sub>
</div>
