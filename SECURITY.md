# Security Policy

## Supported Versions

Security updates are provided for the latest released version of each
distribution channel:

| Channel | Supported |
| --- | --- |
| Desktop app (latest release) | :white_check_mark: |
| Web app (app.fivedollars.dev) | :white_check_mark: |
| VSCode / Open VSX extension (latest) | :white_check_mark: |
| MCP server (`fivedollars-mcp`, latest) | :white_check_mark: |
| Older releases | :x: |

Please upgrade to the latest version before reporting an issue, as it may
already be fixed.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, report privately through one of these channels:

- **GitHub Security Advisories** (preferred): use the
  [Report a vulnerability](https://github.com/LeandroDettmer/FiveDollars/security/advisories/new)
  button on the repository's Security tab.
- **Email**: leandro.dettmer@clinicorp.com

Please include as much detail as possible:

- The affected component (desktop, web, extension, or MCP server) and version.
- A description of the vulnerability and its potential impact.
- Steps to reproduce, including a proof of concept if available.
- Any suggested remediation.

## Response Process

- **Acknowledgement**: within 5 business days of your report.
- **Assessment**: we will investigate and confirm the issue, then share an
  expected timeline for a fix.
- **Resolution**: a patch will be released as soon as practical, prioritized by
  severity. You will be kept informed of progress.
- **Disclosure**: we follow coordinated disclosure. Please give us a reasonable
  window to release a fix before any public disclosure. Credit will be given to
  reporters who wish to be acknowledged.

## Scope

This policy covers the FiveDollars desktop app, web app, VSCode/Open VSX
extension, and the `fivedollars-mcp` server in this repository.

Because FiveDollars sends user-defined HTTP requests, behavior resulting from a
user's own request configuration (e.g. requests to untrusted endpoints, secrets
stored in plain-text request bodies) is the user's responsibility and is out of
scope. Vulnerabilities in the application that allow unintended access to local
data, credentials, or code execution are in scope.

## Security Best Practices for Users

- Keep the app and extension updated to the latest version.
- Avoid storing sensitive credentials in shared collections or environments.
- Use environment variables for secrets rather than hardcoding them in requests.
- Review requests imported from untrusted sources before sending them.
