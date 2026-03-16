# FiveDollars API Client

**API Client** for Desktop and Web — an alternative to Postman/Insomnia. HTTP request client built with **React** and **Tauri**. Requests are sent via Tauri's HTTP plugin in the native process, avoiding browser CORS.

![FiveDollars interface - Collections, Environments, request and response](docs/images/overview.png)

---

## What the app offers

- **Collections** — organize requests in folders; import **Postman v2.1** and **Insomnia** collections (JSON/YAML).
- **Environments** — environments with variables (`{{baseUrl}}`, `{{token}}`, etc.) and **colors to tag importance or type** (e.g. red for Production, green for Local).
- **Runner** — run multiple requests from a folder in sequence, with iterations, delay, JSON data file, and option to save response in history.
- **Scripts** — Pre-request and Post-response per request (dynamic tokens, extract data from response, write to variables).
- **Requests** — GET, POST, PUT, PATCH, DELETE; headers, query/path params, body (JSON, form, raw); Basic, Bearer, API Key auth.

---

## Environments and colors

Create environments in the sidebar and define variables (e.g. `baseUrl`, `token`). Use `{{name}}` in URL, headers or body; the active environment is applied before the request.

Each environment can have a **color** so you can **tag importance or type** (production, staging, local, etc.) and spot it quickly in the list. Click an environment to activate; double-click to edit name, variables and color.

![Environments with colors to tag importance](docs/images/environments.png)

Example: URL `{{baseUrl}}/api/users` with environment `{ "baseUrl": "https://api.example.com" }` becomes `https://api.example.com/api/users`.

---

## Runner

Run multiple requests from a folder in sequence:

- **Selection** — choose which requests to run (check/uncheck).
- **Iterations** — run N times or use a **data file** (JSON array of objects); each object becomes a set of variables per iteration.
- **Delay** — interval in ms between requests.
- **Response body** — option to include or exclude the body in run history entries.

Open the Runner from a folder in the sidebar (e.g. folder menu → "Run") and configure in the panel before executing.

### Configure run (folder)

![Configure Run - Folder](docs/images/runner-config.png)

### Runner in progress

![Runner running](docs/images/runner-running.png)

---

## Importing collections

- **Postman v2.1**: export the collection as JSON (Collection v2.1) and use **Import** in the sidebar.
- **Insomnia**: import Insomnia collections (JSON or YAML).

After importing, folders and requests appear in the sidebar; click a request to load and send it.

---

## Scripts: Pre-request and Post-response

Per request (**Scripts** tab in the request panel):

- **Pre-request**: runs **before** sending.
  - API: `fv.environment.get(key)` / `fv.environment.set(key, value)`.
  - If the request belongs to a collection: `fv.collectionVariables.get(key)` / `fv.collectionVariables.set(key, value)`.
  - Values set with `set` are applied to the active environment (or the collection) and used in the same request.
- **Post-response**: runs **after** receiving the response.
  - API: `fv.response` (`.json()`, `.status`, `.statusText`, `.headers`, `.body`), `fv.environment.set(...)` and, if there is a collection, `fv.collectionVariables.set(...)`.

Useful for dynamic tokens, timestamps, extracting data from the response and writing to variables for the next requests. Script logs appear in the UI when available.

---

## Requests

Methods: GET, POST, PUT, PATCH, DELETE. Support for headers, query params, path params and body (JSON, form, raw). Auth: Basic, Bearer, API Key (values can use `{{var}}`).

---

# For developers

## Prerequisites

- **Node.js** 18+
- **Rust** (for Tauri): [rustup.rs](https://rustup.rs)
- **npm** or another package manager

### Linux (Ubuntu/Debian): system dependencies

Before `npm run tauri dev` or `npm run tauri build`, install the libraries used by Tauri/WebKit:

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libglib2.0-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

---

## How to run the repository

```bash
npm install
npm run tauri dev
```

The first Rust build may take a few minutes.

---

## Build installable app

### 1. Icon (optional)

Use a **1024×1024 px** image (PNG) and generate the icons:

```bash
npm run tauri icon path/to/your-image-1024.png
```

### 2. Build

```bash
npm install
npm run tauri build
```

### 3. Where to find the executable

| Platform  | Folder (under `src-tauri/`)     | Files        |
|-----------|----------------------------------|--------------|
| **Windows** | `target/release/bundle/msi/` and `target/release/bundle/nsis/` | `.msi`, `.exe` |
| **macOS**   | `target/release/bundle/dmg/` and `target/release/bundle/macos/`  | `.dmg`, `.app` |
| **Linux**   | `target/release/bundle/deb/` or `target/release/bundle/appimage/` | `.deb`, `.AppImage` |

---

## GitHub Release (download: Mac, Windows, Linux)

The repository has a workflow that **builds the app for macOS, Windows and Linux** and **attaches them to the Release** when you publish a release.

### Version (for release maintainers)

The version must match in `package.json` and `src-tauri/tauri.conf.json`. Use the scripts (any dev can use):

| Command           | Effect |
|-------------------|--------|
| `npm run patch`   | Bump patch: `0.1.4` → `0.1.5` (updates both files) |
| `npm run unpatch` | Lower patch: `0.1.5` → `0.1.4` (useful to fix before publishing) |

After running `npm run patch` (or `unpatch`), commit the changes before creating the tag.

### Release steps

1. **Bump version**  
   Run `npm run patch` (or edit both files manually).

2. **Commit and push**  
   `git add package.json src-tauri/tauri.conf.json` → commit → push to `main`.

3. **Publish the release**  
   On GitHub: **Releases** → **Create a new release** → choose or create a tag (e.g. `v0.1.5`) → **Publish release**.  
   Or use **Actions** → **Release** → **Run workflow** and enter the tag (e.g. `v0.1.5`).

4. **What happens**  
   GitHub Actions runs the **Release** job in parallel for **macOS**, **Linux** and **Windows**.  
   When done, the release for that tag gets the installers: **FiveDollars-macos.dmg**, **FiveDollars-windows.msi** (and/or **.exe**), **FiveDollars-linux.AppImage** (and/or **.deb**).

5. **Where to download**  
   In the repository: **Releases** → choose the tag → download the file for your system.

- **macOS:** open the `.dmg`, drag the app to Applications. If you see *"FiveDollars is damaged"* (the app is not signed with an Apple certificate), use **right-click on the app** → **Open** → **Open** in the confirmation. Alternative in Terminal: `xattr -cr /Applications/FiveDollars.app`.
- **Windows:** run the `.msi` or `.exe` installer.
- **Linux:** use the `.AppImage` (grant execute permission if needed) or install the `.deb`.

---

## Project structure

- **`src/`** – React frontend
  - **`components/`** – RequestPanel, ResponsePanel, Sidebar, CollectionTree, EnvironmentEditor, RunnerPanel, RunnerConfigPanel, RunnerContent, BodyEditor, etc.
  - **`store/`** – Zustand (global state)
  - **`lib/`** – `http.ts` (fetch via Tauri), `resolveEnv.ts` (`{{var}}` substitution), `importCollection.ts`, `runPostResponseScript.ts` (pre/post scripts), `urlUtils.ts`, Postman/Insomnia parsers
  - **`types/`** – types (collections, requests, environments)
  - **`locales/`** – i18n (e.g. `en.ts`, `pt-BR.ts`)
- **`src-tauri/`** – Rust backend (Tauri 2 + HTTP plugin)
- **`App.css`** – dark theme (VS Code style), column layout

---

### Common errors

- *"FiveDollars is damaged"*  
  Run in Terminal: `xattr -cr /Applications/FiveDollars.app`
