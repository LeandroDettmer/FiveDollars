<div align="center">

<img src="app-icon.png" alt="FiveDollars" width="120" height="120" />

# FiveDollars API Client

**A fast, free API client for desktop, web, and your editor.**

Test, organize, and automate HTTP requests — with environments, scripting, a request runner, a visual diagram canvas, Git sync, and an MCP server for AI assistants.

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/LeandroDettmer.fivedollars?label=VS%20Marketplace&color=2d2d30&labelColor=3c3c3c)](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars)
[![Open VSX](https://img.shields.io/open-vsx/v/LeandroDettmer/fivedollars?label=Open%20VSX&color=2d2d30&labelColor=3c3c3c)](https://open-vsx.org/extension/LeandroDettmer/fivedollars)
[![npm — fivedollars-mcp](https://img.shields.io/npm/v/fivedollars-mcp?label=npm%20fivedollars-mcp&color=2d2d30&labelColor=3c3c3c)](https://www.npmjs.com/package/fivedollars-mcp)
[![Website](https://img.shields.io/badge/website-fivedollars.dev-2d2d30?labelColor=3c3c3c)](https://fivedollars.dev)
[![GitHub stars](https://img.shields.io/github/stars/LeandroDettmer/FiveDollars?style=flat&color=2d2d30&labelColor=3c3c3c)](https://github.com/LeandroDettmer/FiveDollars)

[**Web app**](https://app.fivedollars.dev) · [**Download desktop**](https://fivedollars.dev/install) · [**VSCode extension**](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars) · [**Website**](https://fivedollars.dev)

</div>

<br />

<!-- Drop the app screenshot at screenshots/app.png to render it here -->
<div align="center">
  <img src="screenshots/app.png" alt="FiveDollars API Client" width="900" />
</div>

<br />

---

## Why FiveDollars

- **Free.** Core client is free on desktop and web — no account required to start.
- **Local-first.** Your collections, environments, and tokens stay on your machine.
- **Everywhere.** Native desktop (Tauri), browser web app, and a VSCode / Cursor extension share the same workspace format.
- **Automatable.** Scriptable requests, a batch runner, a visual canvas, and an MCP server that lets AI assistants drive your saved requests.

---

## Try it

| Platform | Link |
|---|---|
| 🌐 Web app | https://app.fivedollars.dev |
| 🖥️ Desktop app | https://fivedollars.dev/install |
| 🧩 VSCode extension | https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars |
| 🧩 Open VSX extension | https://open-vsx.org/extension/LeandroDettmer/fivedollars |
| 🤖 MCP server | https://www.npmjs.com/package/fivedollars-mcp |

Built with **React** + **TypeScript** + **Tauri 2**. HTTP runs through the native layer — no proxy, no CORS workarounds.

---

## Features

### 📁 Collections

Organize requests into folders and collections. Drag to reorder, nest folders, and run whole folders at once.

Imports from other tools:
- Postman Collection v2.1
- Insomnia JSON
- Insomnia YAML

### 🎨 Environments

Define variables and reuse them anywhere:

```txt
{{baseUrl}}
{{token}}
```

Usable in URLs, headers, query params, and request bodies. Each environment carries a color tag so local / staging / production stay visually distinct.

### ▶️ Request runner

Run a folder of requests:
- sequentially or in parallel
- with delays between calls
- across multiple iterations
- driven by optional JSON data files

Useful for testing flows and lightweight load testing.

### 📜 Scripts (`fv.*`)

Run JavaScript before or after a request — refresh tokens, store variables, parse responses, chain requests.

```js
const { token } = fv.response.json();
fv.environment.set("token", token);
```

Available APIs:
- `fv.environment.get` / `fv.environment.set`
- `fv.collectionVariables.get` / `fv.collectionVariables.set`
- `fv.response.json()`

### 🔗 Diagram canvas

Wire requests together visually in a graph. Pass a response from one request straight into the next.

### 🔄 Git sync

Sync a workspace with your own GitHub repository. Stored as:

```txt
.fivedollars/workspace.json
```

Supports pull, commit, and branch switching. Share collections with a team through a normal repo.

---

## Request support

**Methods:** GET · POST · PUT · PATCH · DELETE

**Body & params:** headers · query params · path params · JSON · form data · raw · binary · GraphQL

**Auth:** Bearer token · Basic auth · API key

---

## VSCode extension

An optional extension for VSCode, Cursor, VSCodium, and other Open VSX–compatible editors.

```bash
# VS Marketplace
code --install-extension LeandroDettmer.fivedollars

# Open VSX (Cursor / VSCodium)
cursor --install-extension LeandroDettmer.fivedollars
codium --install-extension LeandroDettmer.fivedollars
```

Or install manually from a `.vsix`. Then:

```txt
Command Palette → FiveDollars: Open
```

---

## MCP server

`fivedollars-mcp` lets AI assistants like Claude and Cursor read and run your saved requests and collections. Add it to your MCP config:

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
- "Run the active request"
- "Send the get-user request using staging"
- "Extract the returned token and store it"

Everything runs locally against your existing FiveDollars workspace.

---

## Privacy

- Collections and environments stay on your machine
- Requests go directly to the target URL — no proxy in the middle
- GitHub tokens are stored in the OS keychain
- MCP reads local workspace data only
- Optional telemetry can be disabled in settings

---

## Troubleshooting

| Issue | Solution |
|---|---|
| macOS says the app is damaged | `xattr -cr /Applications/FiveDollars.app` |
| Wrong installer downloaded | Download directly from GitHub Releases |
| MCP cannot find workspace | Open the app at least once to create workspace data |
| MCP tools do not appear | Restart Claude/Cursor after editing the MCP config |

---

## Download

- Website — https://fivedollars.dev
- Desktop app — https://fivedollars.dev/install
- Releases — https://github.com/LeandroDettmer/FiveDollars/releases

---

## Links

- GitHub — https://github.com/LeandroDettmer/FiveDollars
- Issues — https://github.com/LeandroDettmer/FiveDollars/issues
- VS Marketplace — https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars
- Open VSX — https://open-vsx.org/extension/LeandroDettmer/fivedollars
- MCP package — https://www.npmjs.com/package/fivedollars-mcp

---

<div align="center">
<sub>Built with React + Tauri · Local-first · Free</sub>
</div>
