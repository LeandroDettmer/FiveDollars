<!--
  README destinado ao repositório público github.com/LeandroDettmer/FiveDollars.
  Copia o conteúdo abaixo (sem este comentário) pro README.md daquele repo.
-->

# FiveDollars API Client

**FiveDollars** is a free HTTP API client for desktop, web, and your editor — a fast, lightweight alternative to Postman and Insomnia. Built with **React** and **Tauri**, requests in the desktop app go through Tauri's native HTTP layer, so **browser CORS restrictions don't apply** the way they would in a pure web client.

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/LeandroDettmer.fivedollars?label=VS%20Marketplace&color=2d2d30&labelColor=3c3c3c)](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars)
[![Open VSX](https://img.shields.io/open-vsx/v/LeandroDettmer/fivedollars?label=Open%20VSX&color=2d2d30&labelColor=3c3c3c)](https://open-vsx.org/extension/LeandroDettmer/fivedollars)
[![npm — fivedollars-mcp](https://img.shields.io/npm/v/fivedollars-mcp?label=npm%20fivedollars-mcp&color=2d2d30&labelColor=3c3c3c)](https://www.npmjs.com/package/fivedollars-mcp)
[![Website](https://img.shields.io/badge/website-fivedollars.dev-2d2d30?labelColor=3c3c3c)](https://fivedollars.dev)

> Send requests, organize collections, run scripts, and chain variables across calls — all from a native app, a VSCode panel, or directly through an AI assistant.

---

## Try it now

**Web demo:** [app.fivedollars.dev →](https://app.fivedollars.dev/) — try it instantly in your browser, no install required.

Or grab the **desktop app** or **VSCode extension** below for the full experience (native HTTP, no CORS restrictions, auto-updates).

---

## Three ways to use it

| Where | Install | Notes |
|-------|---------|-------|
| **Desktop** (macOS / Windows / Linux) | [fivedollars.dev/install](https://fivedollars.dev/install) | Tauri-based native app, auto-updates |
| **VSCode** | [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars) or `code --install-extension LeandroDettmer.fivedollars` | Same UI embedded in your editor |
| **Cursor / VSCodium / Theia** | [Open VSX page](https://open-vsx.org/extension/LeandroDettmer/fivedollars) or `cursor --install-extension LeandroDettmer.fivedollars` | Same UI embedded in your editor |
| **Claude / Cursor (AI assistants)** | `npx -y fivedollars-mcp` via your MCP config | Drives saved requests from the chat |

---

## Download — desktop

**[fivedollars.dev/install →](https://fivedollars.dev/install)**

The site **auto-detects your operating system** and serves the right installer (macOS, Linux, or Windows). One click, no guessing which file you need.

Prefer to pick a file manually, grab a previous version, or verify checksums? Browse the **[GitHub Releases](https://github.com/LeandroDettmer/FiveDollars/releases)** page directly — every build is published there with all assets attached.

| OS | Typical asset |
|----|---------------|
| **macOS** (Apple Silicon) | `.dmg` or `.app.tar.gz` |
| **Linux** | `.AppImage` or `.deb` |
| **Windows** | `.exe` installer |

> **macOS:** if you see *"FiveDollars is damaged and can't be opened"*, see [Troubleshooting](#troubleshooting).

---

## Install — VSCode / Cursor / VSCodium

The extension embeds the full FiveDollars UI into the editor. HTTP goes through the extension host process — no CORS, no stripped headers.

### From the marketplace

Open the Extensions panel, search **FiveDollars**, click **Install**.

- **VSCode** pulls from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars).
- **Cursor / VSCodium / Theia / Gitpod** pull from [Open VSX](https://open-vsx.org/extension/LeandroDettmer/fivedollars).

Or from the command line:

```bash
code   --install-extension LeandroDettmer.fivedollars
cursor --install-extension LeandroDettmer.fivedollars
codium --install-extension LeandroDettmer.fivedollars
```

### From a `.vsix`

Download the latest `.vsix` from either the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars) or the [Open VSX page](https://open-vsx.org/extension/LeandroDettmer/fivedollars), then:

```bash
code --install-extension fivedollars-<version>.vsix
```

After install: Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) → **FiveDollars: Open**.

---

## Use it from Claude / Cursor (MCP)

The [`fivedollars-mcp`](https://www.npmjs.com/package/fivedollars-mcp) server lets any [Model Context Protocol](https://modelcontextprotocol.io) client read your FiveDollars workspace and run saved requests. The assistant gets the full response (status, headers, parsed body, timing) back into the chat so it can chain calls and extract values.

### Setup

Edit your assistant's MCP config and add:

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

| Client | Config file |
|---|---|
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Claude Code (CLI) | `~/.claude.json` |
| Cursor | Settings → MCP → Add server: `npx -y fivedollars-mcp` |

Restart the assistant. The tools `fivedollars_list_collections`, `fivedollars_send_request`, `fivedollars_send_active_request`, etc., become available.

> 💡 The FiveDollars desktop app and VSCode extension both have a **One-click install** for this in **Settings → AI assistants**.

### Example prompts

- *"List my FiveDollars collections."*
- *"Run `get-user` in the `staging` environment and tell me what came back."*
- *"Send the request I have open with the `customer-A` account, then post the returned id to `update-user`."*

Everything runs **locally** — the server reads the same workspace file the desktop app and VSCode extension write to. No data is uploaded.

---

## Highlights

- **Collections** — folders of requests with import support for **Postman Collection v2.1** and **Insomnia** (JSON / YAML).
- **Environments** — variables (`{{baseUrl}}`, `{{token}}`, …) with **color tags** so you never confuse production with local.
- **Runner** — execute many requests from a folder in sequence, with iterations, delay, optional JSON data file, and selectable history detail.
- **Diagram canvas** — wire requests with edges; the response of one becomes the body of the next, executed in topological order.
- **Scripts** — per-request **pre-request** and **post-response** hooks via the `fv.*` API to read/write env vars, parse responses, and chain calls.
- **Git Sync** — version your workspace in a GitHub repo of your own (`.fivedollars/workspace.json`), with branch + commit + pull built in.
- **Auto-updates** — the desktop app checks for new releases and updates itself; the VSCode extension updates through the marketplace.
- **No CORS headaches** — desktop and editor requests go through native HTTP, not the browser's fetch.

---

## Requests

GET, POST, PUT, PATCH, DELETE — with full control over:

- **Headers** and **query / path params**
- **Body**: JSON, form-encoded, raw, binary, or GraphQL
- **Auth**: Basic, Bearer, API Key (values support `{{var}}` interpolation)

---

## Collections & import

- **Postman:** export as **Collection v2.1** JSON, then click **Import** in the sidebar.
- **Insomnia:** import the collection JSON or YAML directly.

Imported folders and requests show up in the sidebar — select one to edit and send.

---

## Environments

Create environments from the sidebar and add variables. Reference them anywhere with `{{name}}` — URL, headers, or body — and the **active** environment is applied right before each request.

Each environment can have a **color** to visually distinguish production, staging, local, etc. Click to activate; double-click to edit name, variables, and color.

**Example:** URL `{{baseUrl}}/api/users` with `baseUrl = https://api.example.com` resolves to `https://api.example.com/api/users`.

---

## Runner

From a folder menu → **Run**:

- Choose which requests to include.
- **Iterations:** fixed count, or a **JSON array** data file where each object supplies variables for one iteration.
- **Delay** between requests (ms).
- **Run in parallel** option dispatches every request with `Promise.allSettled` for light load tests.
- Toggle whether response bodies are kept in run history.

Configure in the runner panel and execute.

---

## Scripts (`fv.*`)

In the request panel, open **Scripts**:

- **Pre-request** (runs before send)
  - `fv.environment.get` / `fv.environment.set`
  - `fv.collectionVariables.get` / `fv.collectionVariables.set` (when the request belongs to a collection)
  - Values written via `set` apply to the active environment or collection for that request.
- **Post-response** (runs after the response arrives)
  - `fv.response` — `.json()`, `.status`, `.statusText`, `.headers`, `.body`
  - `fv.environment.set` and `fv.collectionVariables.set` (when applicable)

Useful for refreshing tokens, stamping timestamps, parsing JSON, and chaining variables across requests. Logs surface in the UI when available.

---

## Privacy

- Collections, environments, history, and secrets stay on your machine (Tauri app data dir or VSCode `globalStorage`).
- GitHub Personal Access Tokens (used for sharing/sync) live in the OS keychain.
- HTTP requests go directly from the app/extension to the URL you typed. No proxy in the middle.
- The MCP server reads the local workspace file — nothing is uploaded to FiveDollars or to your AI vendor on top of what the assistant already sees.
- Optional anonymous telemetry counts feature usage (no URLs, no payloads). Disable it in **Settings**.

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| **"FiveDollars is damaged"** (macOS) | Run `xattr -cr /Applications/FiveDollars.app` (adjust the path if the app lives elsewhere). |
| **Auto-detect picked the wrong installer** | Open the [GitHub Releases](https://github.com/LeandroDettmer/FiveDollars/releases) page and download the asset you need manually. |
| **CORS errors** | The **desktop** app and **VSCode extension** route requests through native HTTP — typical browser CORS restrictions don't apply. Web build behavior depends on how you host and call APIs. |
| **App didn't auto-update** | Re-download from [fivedollars.dev/install](https://fivedollars.dev/install) — the new version will replace the old install in place. |
| **MCP `No FiveDollars workspace data found`** | Open the desktop app or the VSCode extension at least once so the workspace JSON gets written to disk. |
| **MCP tools don't appear in Claude / Cursor** | Restart the assistant after editing the config file; double-check the path matches the OS row in the [Use it from Claude / Cursor](#use-it-from-claude--cursor-mcp) section. |

---

## Links

- **Download:** [fivedollars.dev/install](https://fivedollars.dev/install)
- **All releases:** [github.com/LeandroDettmer/FiveDollars/releases](https://github.com/LeandroDettmer/FiveDollars/releases)
- **VSCode extension (Visual Studio Marketplace):** [marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars)
- **VSCode extension (Open VSX):** [open-vsx.org/extension/LeandroDettmer/fivedollars](https://open-vsx.org/extension/LeandroDettmer/fivedollars)
- **MCP server (npm):** [npmjs.com/package/fivedollars-mcp](https://www.npmjs.com/package/fivedollars-mcp)
- **Issues & feedback:** [github.com/LeandroDettmer/FiveDollars/issues](https://github.com/LeandroDettmer/FiveDollars/issues)
