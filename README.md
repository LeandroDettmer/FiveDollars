# FiveDollars

**FiveDollars** is a desktop and web HTTP API client—an alternative to Postman/Insomnia—built with **React** and **Tauri**. Outgoing requests use Tauri’s HTTP plugin in the native process, so **browser CORS does not apply** to the desktop app the way it would in a pure web client.

---

## Download

**[Open Releases →](https://github.com/LeandroDettmer/FiveDollars/releases)** — pick the latest release, scroll to **Assets**, and download the file for your OS (for example `.dmg` or `.app.tar.gz` on macOS, `.AppImage` / `.deb` on Linux, installer or archive on Windows).

Install or unpack as usual for that file type. If macOS says the app is damaged or blocked, see **Troubleshooting** below.

---

## Features (overview)

- **Collections** — folders of requests; import **Postman Collection v2.1** and **Insomnia** (JSON/YAML).
- **Environments** — variables (`{{baseUrl}}`, `{{token}}`, …) with **optional colors** to tag scope or risk (e.g. production vs local).
- **Runner** — run many requests from a folder in order: pick requests, iterations, delay, optional JSON data file, optional response body in history.
- **Scripts** — per-request **Pre-request** and **Post-response** hooks using the `fv.*` API (environment/collection variables, response helpers).
- **Requests** — GET/POST/PUT/PATCH/DELETE; headers, query/path params; body (JSON, form, raw); Basic, Bearer, API Key (values may use `{{var}}`).

---

## Collections & import

- **Postman:** export as **Collection v2.1** JSON, then use **Import** in the sidebar.
- **Insomnia:** import collection JSON or YAML.

Imported folders and requests appear in the sidebar; select a request to edit and send it.

---

## Environments

Create environments in the sidebar and define variables. Use `{{name}}` in URL, headers, or body; the **active** environment is applied before the request.

Each environment can have a **color** so you can distinguish production, staging, local, etc. Click to activate; double-click to edit name, variables, and color.

Example: URL `{{baseUrl}}/api/users` with `baseUrl = https://api.example.com` resolves to `https://api.example.com/api/users`.

---

## Runner

From a folder (e.g. folder menu → **Run**):

- Choose which requests to include.
- **Iterations:** fixed count or a **JSON array** data file; each object supplies variables for one iteration.
- **Delay** between requests (ms).
- Optionally include or omit **response body** in run history.

Configure in the runner panel, then execute.

---

## Scripts (`fv.*`)

In the request panel, **Scripts**:

- **Pre-request** (before send): `fv.environment.get` / `fv.environment.set`; if the request is in a collection, `fv.collectionVariables.get` / `fv.collectionVariables.set`. Values from `set` apply to the active environment or collection for that request.
- **Post-response** (after response): `fv.response` (e.g. `.json()`, `.status`, `.statusText`, `.headers`, `.body`), plus `fv.environment.set` and, when applicable, `fv.collectionVariables.set`.

Useful for tokens, timestamps, parsing JSON, and chaining variables across requests. Logs show in the UI when available.

---

## Troubleshooting

| Issue | What to try |
|--------|--------------|
| **“FiveDollars is damaged”** (macOS) | `xattr -cr /Applications/FiveDollars.app` (path may differ if the app lives elsewhere). |
| **Download link fails** | Use the **Assets** on the [latest release](https://github.com/LeandroDettmer/FiveDollars/releases) page; filenames can change between releases. |
| **CORS** | In the **desktop** app, requests go through Tauri’s native HTTP layer, not the browser’s fetch to arbitrary origins—typical browser CORS restrictions do not apply the same way. (Web build behavior depends on how you host and call APIs.) |

---
