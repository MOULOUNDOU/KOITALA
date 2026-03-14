/**
 * Build wrapper: temporarily hides src/proxy.ts so Next.js 16 doesn't
 * error on the "both middleware.ts and proxy.ts detected" check.
 * The file is restored (even on failure) after the build completes.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PROXY_SRC = path.join(__dirname, "..", "src", "proxy.ts");
const PROXY_BAK = path.join(__dirname, "..", ".proxy.ts.bak");

const hasSrc = fs.existsSync(PROXY_SRC);
if (hasSrc) {
  fs.renameSync(PROXY_SRC, PROXY_BAK);
  console.log("→ Moved src/proxy.ts aside for build");
}

let exitCode = 0;
try {
  execSync("next build", { stdio: "inherit" });
} catch (err) {
  exitCode = err.status ?? 1;
} finally {
  if (hasSrc && fs.existsSync(PROXY_BAK)) {
    fs.renameSync(PROXY_BAK, PROXY_SRC);
    console.log("→ Restored src/proxy.ts");
  }
}

process.exit(exitCode);
