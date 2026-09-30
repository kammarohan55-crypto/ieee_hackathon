import "./sites-env.mjs";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cli = new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url);
const vars = fileURLToPath(new URL("../.dev.vars", import.meta.url));
// The built config lives under dist/server. Point Wrangler to local secrets
// explicitly; never copy them into the distributable build directory.
const args = [fileURLToPath(cli), "dev", "--config", "dist/server/wrangler.json",
  "--local", "--persist-to", ".wrangler/state", "--ip", "127.0.0.1", "--inspector-port", "0",
  ...(existsSync(vars) ? ["--env-file", vars] : []), ...process.argv.slice(2)];
const result = spawnSync(process.execPath, args, { stdio: "inherit", windowsHide: true });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
