# FiveDollars

**FiveDollars** is a desktop and web HTTP API client—an alternative to Postman/Insomnia—built with **React** and **Tauri**. Outgoing requests use Tauri’s HTTP plugin in the native process, so **browser CORS does not apply** to the desktop app the way it would in a pure web client.

**Releases:** [github.com/LeandroDettmer/FiveDollars/releases](https://github.com/LeandroDettmer/FiveDollars/releases)

---

## Download / installation

Replace `VERSION` with a tag from the [releases page](https://github.com/LeandroDettmer/FiveDollars/releases) (for example `v0.1.25`), or resolve it from the API / CLI:

```bash
# GitHub CLI (recommended)
export VERSION="$(gh release view --repo LeandroDettmer/FiveDollars --json tagName -q .tagName)"

# Or: curl + jq
# export VERSION="$(curl -s https://api.github.com/repos/LeandroDettmer/FiveDollars/releases/latest | jq -r .tag_name)"
```

To list assets for a release (names and URLs):

- **GitHub CLI:** `gh release view "$VERSION" --repo LeandroDettmer/FiveDollars --json assets -q '.assets[].name'`
- **Browser:** open the release and check “Assets”.

Use the exact **ASSET_NAME** from that list in the download URL pattern:

`https://github.com/LeandroDettmer/FiveDollars/releases/download/VERSION/ASSET_NAME`

> **Note:** A given release may only ship some platforms (for example **macOS** often includes `FiveDollars-macos.dmg` and `FiveDollars.app.tar.gz`). Always confirm **Assets** on the release you use before scripting downloads.

### macOS

**Option A — DMG (typical install)**

```bash
curl -fL -o FiveDollars-macos.dmg \
  "https://github.com/LeandroDettmer/FiveDollars/releases/download/${VERSION}/FiveDollars-macos.dmg"
open FiveDollars-macos.dmg
```

Drag **FiveDollars** into **Applications** (or follow the installer UI).

**Option B — `.app` archive**

```bash
curl -fL -o FiveDollars.app.tar.gz \
  "https://github.com/LeandroDettmer/FiveDollars/releases/download/${VERSION}/FiveDollars.app.tar.gz"
tar -xzf FiveDollars.app.tar.gz
# Move FiveDollars.app to /Applications if you want a normal install path
```

**Gatekeeper / “app is damaged”:** if macOS blocks or shows *“FiveDollars is damaged”*, clear quarantine attributes (after copying the app to `/Applications`):

```bash
xattr -cr /Applications/FiveDollars.app
```

### Linux

Releases may ship Linux packages under different names over time (for example `.AppImage`, `.deb`, or archives). **Do not guess the filename**—use `gh release view` or the release page, set `ASSET_NAME`, then:

```bash
curl -fL -o "$ASSET_NAME" \
  "https://github.com/LeandroDettmer/FiveDollars/releases/download/${VERSION}/${ASSET_NAME}"
```

Install or run according to the asset type (e.g. `chmod +x` for AppImage, `sudo dpkg -i` for `.deb`).

### Windows

If a `.msi`, `.exe`, or portable archive is published, download with PowerShell (adjust `ASSET_NAME`):

```powershell
$VERSION = (Invoke-RestMethod https://api.github.com/repos/LeandroDettmer/FiveDollars/releases/latest).tag_name
$ASSET_NAME = "REPLACE_WITH_ASSET_FROM_RELEASES_PAGE"
Invoke-WebRequest -Uri "https://github.com/LeandroDettmer/FiveDollars/releases/download/$VERSION/$ASSET_NAME" -OutFile $ASSET_NAME
```

Or use **curl.exe** (Windows 10+):

```bat
set VERSION=v0.1.25
set ASSET_NAME=REPLACE_WITH_ASSET_FROM_RELEASES_PAGE
curl.exe -fL -o %ASSET_NAME% "https://github.com/LeandroDettmer/FiveDollars/releases/download/%VERSION%/%ASSET_NAME%"
```

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
| **404 on download URL** | Wrong `VERSION` or `ASSET_NAME`; confirm names on the [releases](https://github.com/LeandroDettmer/FiveDollars/releases) page or with `gh release view`. |
| **CORS** | In the **desktop** app, requests go through Tauri’s native HTTP layer, not the browser’s fetch to arbitrary origins—typical browser CORS restrictions do not apply the same way. (Web build behavior depends on how you host and call APIs.) |

---
