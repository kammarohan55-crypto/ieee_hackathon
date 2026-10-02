import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import ts from "typescript";
import postcss from "postcss";

// Source/domain checks only; no browser rendering, device or live provider is exercised.
const dir = path.resolve(".sites-runtime/evidence-lab-tests");
await mkdir(dir, { recursive: true });
const output = ts.transpileModule(await readFile("lib/validation-report.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
await writeFile(path.join(dir, "validation-report.mjs"), output);
const { validationReportSchema } = await import(pathToFileURL(path.join(dir, "validation-report.mjs")));
const fixture = { passed: 3, total: 4, generatedAt: "2026-10-02T10:00:00Z", liveAI: false };
const tests = [];
function test(name, run) {
  try { run(); tests.push({ name, passed: true }); }
  catch (error) { tests.push({ name, passed: false, error: error.message }); }
}

test("A failing software suite remains displayable with its real denominator", () => {
  assert.deepEqual(validationReportSchema.parse(fixture), fixture);
  assert.equal(validationReportSchema.parse({ ...fixture, passed: 0 }).passed, 0);
});
test("A zero or invalid denominator cannot appear as engineering evidence", () => {
  for (const total of [0, -1, 2, 4.5, Infinity, "4"]) {
    assert.equal(validationReportSchema.safeParse({ ...fixture, total }).success, false);
  }
});
test("Malformed counts and dates fail safely", () => {
  for (const passed of [-1, 4.5, Infinity, "3"]) {
    assert.equal(validationReportSchema.safeParse({ ...fixture, passed }).success, false);
  }
  for (const generatedAt of ["not a timestamp", "", null]) {
    assert.equal(validationReportSchema.safeParse({ ...fixture, generatedAt }).success, false);
  }
});
test("The software summary requires an explicit no-live-AI label", () => {
  for (const liveAI of [true, undefined, "false"]) {
    assert.equal(validationReportSchema.safeParse({ ...fixture, liveAI }).success, false);
  }
});

const css = postcss.parse(await readFile("app/console.css", "utf8"));
const tokens = new Map();
css.walkDecls(/^--evidence-/, (entry) => tokens.set(entry.prop, entry.value));
function value(selectorPart, property) {
  let found;
  css.walkRules((rule) => {
    if (rule.selector.includes(selectorPart)) {
      rule.walkDecls(property, (entry) => { found = entry.value; });
    }
  });
  assert.ok(found, `No ${property} declaration found for ${selectorPart}`);
  return found.replace(/var\((--[\w-]+)\)/g, (_, token) => {
    assert.ok(tokens.has(token), `Unknown token ${token}`);
    return tokens.get(token);
  });
}
function luminance(color) {
  assert.match(color, /^#[\da-f]{6}$/i);
  const rgb = color.slice(1).match(/.{2}/g).map((entry) => parseInt(entry, 16) / 255)
    .map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}
function contrast(foreground, background) {
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
for (const [name, foreground, background] of [
  ["Lab citizen response", ".el-human-response p", ".el-human-response,"],
  ["Lab source quote", ".el-source-trace blockquote", ".el-source-trace)"],
  ["Lab image provenance", ".el-method-details dd", ".el-method-details)"],
  ["Lab empty state", ".el-empty p", ".el-empty,"],
  ["Map dossier heading", ".geo-dossier h3", ".geo-dossier,"],
  ["Map coordinates", ".geo-metadata .geo-coordinate", ".geo-dossier,"],
  ["River completeness text", ".river-completeness > p", ".river-completeness,"],
  ["River missing media", ".river-no-media p", ".river-no-media,"],
]) {
  test(`${name} has a source color pair of at least 4.5:1`, () => {
    const ratio = contrast(value(foreground, "color"), value(background, "background"));
    assert.ok(ratio >= 4.5, `${name}: ${ratio.toFixed(2)}:1`);
  });
}
test("Lab tabpanel and evidence buttons retain a visible focus color", () => {
  assert.equal(value(".el-inspection-content):focus-visible", "outline"), "3px solid #7ddbec");
  assert.ok(contrast(tokens.get("--evidence-accent"), tokens.get("--evidence-surface")) >= 3);
});
test("The preserved-source label remains readable at the lightest original-panel gradient stop", () => {
  assert.ok(contrast(value(".el-original p.el-label", "color"), "#28514d") >= 4.5);
});

for (const result of tests) console.log(`${result.passed ? "PASS" : "FAIL"} ${result.name}${result.error ? `: ${result.error}` : ""}`);
console.log(`Evidence Lab source/domain checks: ${tests.filter((result) => result.passed).length}/${tests.length} passed.`);
if (tests.some((result) => !result.passed)) process.exitCode = 1;
