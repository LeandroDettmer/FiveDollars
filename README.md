# FiveDollars API Client

**FiveDollars** is a free, open-source HTTP API client for desktop and web — a fast, lightweight alternative to Postman and Insomnia. Built with **React** and **Tauri**, requests in the desktop app go through Tauri's native HTTP layer, so **browser CORS restrictions don't apply** the way they would in a pure web client.

> Send requests, organize collections, run scripts, and chain variables across calls — all from a native app that stays out of your way.

---

## Download

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

## Highlights

- **Collections** — folders of requests with import support for **Postman Collection v2.1** and **Insomnia** (JSON / YAML).
- **Environments** — variables (`{{baseUrl}}`, `{{token}}`, …) with **color tags** so you never confuse production with local.
- **Runner** — execute many requests from a folder in sequence, with iterations, delay, optional JSON data file, and selectable history detail.
- **Scripts** — per-request **pre-request** and **post-response** hooks via the `fv.*` API to read/write env vars, parse responses, and chain calls.
- **Auto-updates** — the desktop app checks for new releases and updates itself; no need to re-download manually.
- **No CORS headaches** — desktop requests go through the native HTTP plugin instead of the browser's fetch.

---

## Requests

GET, POST, PUT, PATCH, DELETE — with full control over:

- **Headers** and **query / path params**
- **Body**: JSON, form-encoded, or raw
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

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| **"FiveDollars is damaged"** (macOS) | Run `xattr -cr /Applications/FiveDollars.app` (adjust the path if the app lives elsewhere). |
| **Auto-detect picked the wrong installer** | Open the [GitHub Releases](https://github.com/LeandroDettmer/FiveDollars/releases) page and download the asset you need manually. |
| **CORS errors** | The **desktop** app routes requests through Tauri's native HTTP layer — typical browser CORS restrictions don't apply. Web build behavior depends on how you host and call APIs. |
| **App didn't auto-update** | Re-download from [fivedollars.dev/install](https://fivedollars.dev/install) — the new version will replace the old install in place. |

---

## Links

- **Download:** [fivedollars.dev/install](https://fivedollars.dev/install)
- **All releases:** [github.com/LeandroDettmer/FiveDollars/releases](https://github.com/LeandroDettmer/FiveDollars/releases)
- **Issues & feedback:** [github.com/LeandroDettmer/FiveDollars/issues](https://github.com/LeandroDettmer/FiveDollars/issues)
