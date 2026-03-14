/**
 * Dev wrapper: temporarily hides src/proxy.ts so Next.js 16 doesn't
 * error on the "both middleware.ts and proxy.ts detected" check.
 * Restores the file on process exit (Ctrl+C, SIGTERM, etc.).
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PROXY_SRC = path.join(__dirname, "..", "src", "proxy.ts");
const PROXY_BAK = path.join(__dirname, "..", ".proxy.ts.bak");

const hasSrc = fs.existsSync(PROXY_SRC);
if (hasSrc) {
  fs.renameSync(PROXY_SRC, PROXY_BAK);
  console.log("→ Moved src/proxy.ts aside for dev");
}

function restore() {
  if (hasSrc && fs.existsSync(PROXY_BAK)) {
    try {
      fs.renameSync(PROXY_BAK, PROXY_SRC);
      console.log("\n→ Restored src/proxy.ts");
    } catch (_) {}
  }
}

const child = spawn("next", ["dev"], { stdio: "inherit", shell: true });

process.on("SIGINT", () => { restore(); process.exit(0); });
process.on("SIGTERM", () => { restore(); process.exit(0); });
process.on("exit", restore);

child.on("exit", (code) => {
  restore();
  process.exit(code ?? 0);
});
