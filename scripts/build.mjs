import { spawnSync } from "node:child_process";
for (const script of ["scripts/run-framework.mjs", "scripts/build-offline.mjs"]) {
  const result = spawnSync(process.execPath, [script, ...(script.includes("run-framework") ? ["build"] : [])], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
