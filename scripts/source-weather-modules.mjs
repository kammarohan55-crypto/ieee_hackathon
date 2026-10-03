import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import ts from "typescript";

// Execute the actual schemas/route in Node without reading any private config.
export async function sourceWeatherModules() {
  const directory = path.resolve(".sites-runtime/source-weather-tests");
  await mkdir(directory, { recursive: true });
  const names = ["references", "weather-context", "european-sites", "ai-metadata", "field", "source-weather"];
  for (const name of [...names, "route-source-weather"]) {
    const file = name === "route-source-weather" ? "app/api/source-weather/route.ts" : `lib/${name}.ts`;
    const code = ts.transpileModule(await readFile(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
      .replace(/"(?:@\/lib\/|\.\/)([\w-]+)"/g, '"./$1.mjs"');
    await writeFile(path.join(directory, `${name}.mjs`), code);
  }
  return { source: await import(pathToFileURL(path.join(directory, "source-weather.mjs"))), route: await import(pathToFileURL(path.join(directory, "route-source-weather.mjs"))), catalogue: await import(pathToFileURL(path.join(directory, "references.mjs"))) };
}
