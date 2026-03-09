// Decrementa o patch (0.1.4 → 0.1.3) em package.json e tauri.conf.json
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

const pkg = require(path.join(root, "package.json"));
const parts = pkg.version.split(".").map(Number);
if (parts.length >= 3 && parts[2] > 0) {
  parts[2]--;
  pkg.version = parts.join(".");
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify(pkg, null, 2) + "\n");

  const tauri = require(path.join(root, "src-tauri/tauri.conf.json"));
  tauri.version = pkg.version;
  fs.writeFileSync(path.join(root, "src-tauri/tauri.conf.json"), JSON.stringify(tauri, null, 2) + "\n");

  console.log("Versão →", pkg.version);
} else {
  console.error("Não foi possível decrementar (patch já é 0):", pkg.version);
  process.exit(1);
}
