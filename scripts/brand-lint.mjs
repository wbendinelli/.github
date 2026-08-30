#!/usr/bin/env node
// brand-lint — guardrail de marca da frota SAPIANS.
// Fonte única da regra: doclint/rules/brand.json (mesmo regex que o doclint usa).
//
// Exceção deliberada: uma linha marcada com `brand-lint-ignore` é pulada. Existe
// porque documentação precisa poder CITAR a violação — um ADR que registra
// "o README dizia 'Sapians'" não é uma violação, é a evidência dela.

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, basename, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RULES = JSON.parse(readFileSync(join(HERE, "..", "doclint", "rules", "brand.json"), "utf8"));

const argv = process.argv.slice(2);
const FIX = argv.includes("--fix");
const ALL = argv.includes("--all");
const roots = argv.filter((a) => !a.startsWith("-"));
const IGNORE = RULES.ignoreMarker; // definição única: doclint/rules/brand.json

const SKIP_DIR = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage", ".turbo", ".vercel", "__pycache__", ".claude"]);
const EXT = ALL
  ? [".md", ".mdx", ".txt", ".json", ".yaml", ".yml", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".py", ".sh", ".example"]
  : [".md", ".mdx"];

const denied = (p) => {
  const b = basename(p);
  const u = p.replace(/\\/g, "/");
  return RULES.denyPaths.some((d) => u.includes(d) || (d === "CHANGELOG" && /^CHANGELOG/i.test(b)));
};

function* walk(d) {
  let es;
  try { es = readdirSync(d, { withFileTypes: true }); } catch { return; }
  for (const e of es) {
    const f = join(d, e.name);
    if (e.isDirectory()) { if (!SKIP_DIR.has(e.name)) yield* walk(f); }
    else yield f;
  }
}

let violations = 0, fixed = 0;
for (const root of roots.length ? roots : ["."]) {
  for (const file of walk(root)) {
    if (denied(file) || !EXT.includes(extname(file))) continue;
    let text;
    try { text = readFileSync(file, "utf8"); } catch { continue; }

    const lines = text.split("\n");
    let changed = false;
    lines.forEach((line, i) => {
      if (line.includes(IGNORE)) return;                 // exceção declarada
      if (i > 0 && lines[i - 1].includes(IGNORE)) return; // marcador na linha anterior
      for (const rule of RULES.rules) {
        const re = new RegExp(rule.pattern, rule.flags);
        if (!re.test(line)) continue;
        if (FIX) {
          lines[i] = line.replace(new RegExp(rule.pattern, rule.flags), rule.fix);
          changed = true; fixed++;
        } else {
          violations++;
          console.log(`${file}:${i + 1}: [${rule.id}] ${line.trim().slice(0, 110)}`);
        }
      }
    });
    if (changed) writeFileSync(file, lines.join("\n"));
  }
}

if (FIX) {
  console.log(`brand-lint --fix: ${fixed} ocorrência(s) corrigida(s).`);
  process.exit(0);
}
console.log(
  violations === 0
    ? "✔ brand-lint: nenhuma violação."
    : `✘ brand-lint: ${violations} violação(ões). A marca é SAPIANS em caixa-alta na prosa.\n` +
      `  Para citar a grafia errada de propósito (ADR, evidência), marque a linha com \`${IGNORE}\`.`
);
process.exit(violations > 0 ? 1 : 0);
