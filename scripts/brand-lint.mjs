#!/usr/bin/env node
// SAPIANS brand-lint — a marca é sempre "SAPIANS" (caixa-alta) em prosa.
// Reusa o regex canônico de sapians-docs/packages/docs-pipeline/src/validate.ts
// (BRAND_BAD_FORM): casa só a forma title-case "Sapians" com word-boundary que
// PRESERVA identificadores técnicos (@sapians/…, sapians-repo, sapians.com.br,
// paths, e-mails). Lowercase "sapians" técnico NUNCA é tocado.
//
// Uso:
//   node brand-lint.mjs [dirs...]          # lint .md (gate de CI), exit 1 se achar
//   node brand-lint.mjs --all [dirs...]    # lint prosa+conteúdo+código (report)
//   node brand-lint.mjs --fix --all [dirs] # corrige in-place (Sapians → SAPIANS)
//
// Denylist (nunca tocar): o próprio validador, o STYLE.md (exemplos
// pedagógicos da forma errada), CHANGELOGs (histórico), lockfiles, e os itens
// adiados por decisão (iCalendar PRODID em calendar.ts/test, openapi.yaml).

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, basename, extname } from "node:path";

// Detecção (não-global p/ test por linha) e substituição (global).
const DETECT = /(?<![a-zA-Z0-9_/\-@.])Sapians(?![a-zA-Z0-9_/\-])/;
const REPLACE = /(?<![a-zA-Z0-9_/\-@.])Sapians(?![a-zA-Z0-9_/\-])/g;

const args = process.argv.slice(2);
const FIX = args.includes("--fix");
const ALL = args.includes("--all");
const roots = args.filter((a) => !a.startsWith("--"));
if (roots.length === 0) roots.push(".");

const MD_EXT = new Set([".md", ".mdx"]);
const ALL_EXT = new Set([
  ".md", ".mdx", ".txt", ".json", ".yaml", ".yml",
  ".ts", ".tsx", ".js", ".mjs", ".cjs", ".py", ".sh", ".example",
]);
const DENY_DIR = new Set([
  "node_modules", ".git", "dist", "build", ".next", "coverage",
  ".turbo", ".vercel", "__pycache__", ".claude",
]);

function denyFile(p) {
  const b = basename(p);
  // Artefatos de eval gerados (saídas do modelo + baseline de regressão) — histórico.
  if (p.replace(/\\/g, "/").includes("/reports/eval/")) return true;
  if (/^CHANGELOG/i.test(b)) return true;
  if (b === "STYLE.md") return true; // exemplos pedagógicos da forma errada
  if (b === "validate.ts") return true; // o próprio validador de marca
  if (b === "brand-lint.mjs") return true; // este script
  if (b === "calendar.ts" || b === "calendar.test.ts") return true; // PRODID (adiado)
  if (b === "openapi.yaml" || b === "openapi.yml") return true; // contrato (adiado)
  if (/\.lock$/.test(b)) return true;
  if (b === "pnpm-lock.yaml" || b === "package-lock.json" || b === "yarn.lock") return true;
  return false;
}

function* walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (DENY_DIR.has(e.name)) continue;
      yield* walk(full);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

const exts = ALL ? ALL_EXT : MD_EXT;
let violations = 0;
let fixedFiles = 0;

for (const root of roots) {
  let st;
  try { st = statSync(root); } catch { continue; }
  const files = st.isDirectory() ? [...walk(root)] : [root];
  for (const f of files) {
    if (denyFile(f)) continue;
    // .env.example tem extname ".example"
    const ext = f.endsWith(".env.example") ? ".example" : extname(f);
    if (!exts.has(ext)) continue;
    let content;
    try { content = readFileSync(f, "utf8"); } catch { continue; }
    if (!content.includes("Sapians")) continue;
    const lines = content.split("\n");
    let hit = false;
    for (let i = 0; i < lines.length; i++) {
      if (DETECT.test(lines[i])) {
        hit = true;
        violations++;
        console.log(`${f}:${i + 1}: ${lines[i].trim().slice(0, 100)}`);
      }
    }
    if (hit && FIX) {
      writeFileSync(f, content.replace(REPLACE, "SAPIANS"));
      fixedFiles++;
    }
  }
}

if (FIX) {
  console.log(`\n✔ brand-lint --fix: ${fixedFiles} arquivo(s) corrigido(s), ${violations} ocorrência(s) → SAPIANS.`);
  process.exit(0);
} else {
  console.log(`\n${violations === 0 ? "✔ brand-lint: nenhuma violação." : `✘ brand-lint: ${violations} violação(ões) — marca deve ser SAPIANS (caixa-alta) em prosa.`}`);
  process.exit(violations > 0 ? 1 : 0);
}
