# FiveDollars API Client

Free API client for desktop and web, with an optional VSCode extension and MCP server.

Built with React and Tauri.

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/LeandroDettmer.fivedollars?label=VS%20Marketplace&color=2d2d30&labelColor=3c3c3c)](https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars)
[![Open VSX](https://img.shields.io/open-vsx/v/LeandroDettmer/fivedollars?label=Open%20VSX&color=2d2d30&labelColor=3c3c3c)](https://open-vsx.org/extension/LeandroDettmer/fivedollars)
[![npm — fivedollars-mcp](https://img.shields.io/npm/v/fivedollars-mcp?label=npm%20fivedollars-mcp&color=2d2d30&labelColor=3c3c3c)](https://www.npmjs.com/package/fivedollars-mcp)
[![Website](https://img.shields.io/badge/website-fivedollars.dev-2d2d30?labelColor=3c3c3c)](https://fivedollars.dev)

---

## Try it

| Platform | Link |
|---|---|
| Web app | https://app.fivedollars.dev |
| Desktop app | https://fivedollars.dev/install |
| VSCode extension | https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars |
| Open VSX extension | https://open-vsx.org/extension/LeandroDettmer/fivedollars |
| MCP server | https://www.npmjs.com/package/fivedollars-mcp |

---

## Features

### Collections

Organize requests into folders and collections.

Supports importing:
- Postman Collection v2.1
- Insomnia JSON
- Insomnia YAML

---

### Environments

Create environments with variables like:

```txt
{{baseUrl}}
{{token}}
```

Variables can be used in:
- URLs
- headers
- query params
- request bodies

Each environment can also have a color tag to help distinguish local, staging, and production environments.

---

### Request runner

Run folders of requests:
- sequentially or in parallel
- with delays
- with multiple iterations
- with optional JSON data files

Useful for testing flows and lightweight load testing.

---

### Scripts (`fv.*`)

Run scripts before or after requests.

Examples:
- refresh tokens
- store variables
- parse responses
- chain requests together

Available APIs include:
- `fv.environment.get`
- `fv.environment.set`
- `fv.collectionVariables.get`
- `fv.collectionVariables.set`
- `fv.response.json()`

---

### Diagram canvas

Connect requests visually in a graph.

Responses from one request can be passed into the next request automatically.

---

### Git sync

Sync your workspace with your own GitHub repository.

The workspace is stored as:

```txt
.fivedollars/workspace.json
```

Supports:
- pull
- commit
- branch switching

---

## Request support

Supports:
- GET
- POST
- PUT
- PATCH
- DELETE

Request features:
- headers
- query params
- path params
- JSON body
- form data
- raw body
- binary body
- GraphQL

Authentication:
- Bearer token
- Basic auth
- API key

---

## VSCode extension

FiveDollars also provides an optional extension for:
- VSCode
- Cursor
- VSCodium
- other Open VSX compatible editors

### Install from marketplace

```bash
code --install-extension LeandroDettmer.fivedollars
```

### Install from Open VSX

```bash
cursor --install-extension LeandroDettmer.fivedollars
codium --install-extension LeandroDettmer.fivedollars
```

Or install manually from a `.vsix` file.

After installation:

```txt
Command Palette → FiveDollars: Open
```

---

## MCP server

The `fivedollars-mcp` package allows AI assistants like Claude and Cursor to access your saved requests and collections.

Install through your MCP configuration:

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

Example prompts:
- "List my collections"
- "Run the active request"
- "Send the get-user request using staging"
- "Extract the returned token and store it"

Everything runs locally using your existing FiveDollars workspace data.

---

## Privacy

- Collections and environments stay on your machine
- Requests go directly to the target URL
- No proxy server in the middle
- GitHub tokens are stored in the OS keychain
- MCP reads local workspace data only
- Optional telemetry can be disabled in settings

---

## Troubleshooting

| Issue | Solution |
|---|---|
| macOS says app is damaged | `xattr -cr /Applications/FiveDollars.app` |
| Wrong installer downloaded | Download directly from GitHub Releases |
| MCP cannot find workspace | Open the app at least once to create workspace data |
| MCP tools do not appear | Restart Claude/Cursor after editing MCP config |

---

## Download

- Website: https://fivedollars.dev
- Desktop app: https://fivedollars.dev/install
- Releases: https://github.com/LeandroDettmer/FiveDollars/releases

---

## Links

- GitHub: https://github.com/LeandroDettmer/FiveDollars
- Issues: https://github.com/LeandroDettmer/FiveDollars/issues
- VS Marketplace: https://marketplace.visualstudio.com/items?itemName=LeandroDettmer.fivedollars
- Open VSX: https://open-vsx.org/extension/LeandroDettmer/fivedollars
- MCP package: https://www.npmjs.com/package/fivedollars-mcp
