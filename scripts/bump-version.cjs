// Sincroniza package.json → tauri.conf.json (rodado após npm version)
const pkg = require("../package.json");
const tauri = require("../src-tauri/tauri.conf.json");
tauri.version = pkg.version;
require("fs").writeFileSync(
  require("path").join(__dirname, "../src-tauri/tauri.conf.json"),
  JSON.stringify(tauri, null, 2)
);
console.log("tauri.conf.json →", pkg.version);
