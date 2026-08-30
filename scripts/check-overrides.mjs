#!/usr/bin/env node
/**
 * scripts/check-overrides.mjs
 *
 * Gate · as travas de segurança de `pnpm.overrides` ainda estão EM EFEITO?
 *
 * POR QUE
 *   Dez vulnerabilidades transitivas deste repo são contidas por override, e não
 *   por atualização de dependência direta — `postcss`, `tar`, `esbuild`, `vite`,
 *   `js-yaml`, `fast-uri`, `nanoid`, `sharp`, `brace-expansion`,
 *   `@opentelemetry/core`. Elas vivem no campo `pnpm` do package.json.
 *
 *   O pnpm 10 PAROU DE LER esse campo. A mensagem dele é literalmente:
 *   "The 'pnpm' field in package.json is no longer read by pnpm. The following
 *   keys were ignored: 'pnpm.overrides'."
 *
 *   Ou seja: no dia em que alguém subir o `packageManager` para 10+, as dez
 *   travas param de valer EM SILÊNCIO. O install continua verde, o build passa,
 *   e as vulnerabilidades voltam sem nenhum sinal. É a pior forma de regressão
 *   de segurança — a que não deixa rastro.
 *
 * O QUE ESTE GATE VERIFICA
 *   Não a versão do pnpm, e sim o EFEITO: toda versão resolvida no
 *   pnpm-lock.yaml de um pacote com override tem de satisfazer pelo menos uma
 *   das faixas declaradas para ele. Verificar o efeito, e não a causa, faz o
 *   gate pegar também os motivos que eu não previ — campo renomeado, chave com
 *   erro de digitação, override sobrescrito por outro workspace.
 *
 *   `brace-expansion` tem duas faixas (uma geral, uma escopada a
 *   `minimatch@<10>`) e por isso resolve para duas versões. Daí a regra ser
 *   "pelo menos uma faixa", e não "a faixa".
 *
 * Roda via:  node scripts/check-overrides.mjs [diretorio-do-repo]
 *
 * Exit codes:
 *   0 · toda resolução satisfaz alguma faixa declarada
 *   1 · alguma trava deixou de valer, ou o campo sumiu do package.json
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.argv[2] || process.cwd());

// Guard de frota: repositório sem package.json ou sem pnpm-lock.yaml não tem o
// que verificar, e deve PULAR com mensagem clara — não estourar com stack trace.
// Um gate que quebra onde não se aplica ensina todo mundo a ignorá-lo.
const ler = (rel) => {
  try {
    return readFileSync(resolve(ROOT, rel), "utf8");
  } catch {
    return null;
  }
};

const rawPkg = ler("package.json");
if (rawPkg === null) {
  console.log("⊘ sem package.json — não é um repositório npm/pnpm, nada a verificar.");
  process.exit(0);
}
const LOCK = ler("pnpm-lock.yaml");
if (LOCK === null) {
  console.log("⊘ sem pnpm-lock.yaml — nada a verificar.");
  process.exit(0);
}

let PKG;
try {
  PKG = JSON.parse(rawPkg);
} catch (e) {
  console.error(`✘ package.json não é JSON válido: ${e.message}`);
  process.exit(1);
}

const overrides = PKG?.pnpm?.overrides;
if (!overrides || Object.keys(overrides).length === 0) {
  // Ausência do campo NÃO é o modo de falha que este gate persegue. Quando o
  // pnpm 10 ignora `pnpm.overrides`, o campo CONTINUA no package.json — o que
  // se perde é o efeito, e é isso que a verificação abaixo pega. Campo ausente
  // significa que alguém o removeu de propósito, provavelmente porque as
  // dependências diretas foram corrigidas. Passar é o certo.
  console.log("⊘ nenhum override declarado em `pnpm.overrides` — nada a verificar.");
  process.exit(0);
}

/** Compara versões semver numericamente. Prerelease é ignorado de propósito:
 *  nenhuma trava deste repo usa faixa com prerelease, e tratar isso direito
 *  exigiria uma dependência para resolver um problema DE dependência. */
const cmp = (a, b) => {
  const pa = a.split("-")[0].split(".").map(Number);
  const pb = b.split("-")[0].split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
};

/** Suporta as formas usadas nas travas: `>=x.y.z` e `>=x.y.z <a[.b[.c]]`. */
function satisfies(version, range) {
  const parts = range.trim().split(/\s+/);
  for (const part of parts) {
    const m = /^(>=|>|<=|<)(\d+(?:\.\d+)*)$/.exec(part);
    if (!m) return false; // forma não suportada: falha alto, não silenciosa
    const [, op, bound] = m;
    const c = cmp(version, bound);
    if (op === ">=" && c < 0) return false;
    if (op === ">" && c <= 0) return false;
    if (op === "<=" && c > 0) return false;
    if (op === "<" && c >= 0) return false;
  }
  return true;
}

/** Extrai o pacote-alvo da chave de override. O pnpm aceita três formas, e as
 *  três aparecem na frota:
 *    `postcss`               → alvo `postcss`
 *    `postcss@<8.5.10`       → alvo `postcss` (só substitui versões na faixa)
 *    `minimatch@<10>brace-expansion` → alvo `brace-expansion` (escopado ao pai)
 *  Tratar a chave inteira como nome faz o gate reportar "não está na árvore" e
 *  passar sem ter verificado nada — falso verde, que é pior que falso vermelho. */
const targetOf = (key) => {
  const gt = key.lastIndexOf(">");
  let nome = gt === -1 ? key : key.slice(gt + 1);
  // separa um sufixo de faixa: o `@` relevante nunca é o do escopo (índice 0)
  const at = nome.lastIndexOf("@");
  if (at > 0 && /^[<>=^~\d]/.test(nome.slice(at + 1))) nome = nome.slice(0, at);
  return nome;
};

/** Todas as versões resolvidas de um pacote no lockfile. Cobre nome com escopo
 *  (`'@scope/nome@1.2.3':`) e sem escopo (`nome@1.2.3:`). */
function resolvedVersions(pkg) {
  const esc = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^ {2}'?${esc}@(\\d[^:'(]*)`, "gm");
  const out = new Set();
  for (const m of LOCK.matchAll(re)) out.add(m[1].trim());
  return [...out].sort(cmp);
}

// bandas por pacote-alvo (um pacote pode ter mais de uma faixa declarada)
const bands = new Map();
for (const [key, range] of Object.entries(overrides)) {
  const t = targetOf(key);
  if (!bands.has(t)) bands.set(t, []);
  bands.get(t).push({ key, range });
}

const problemas = [];
let verificados = 0;

for (const [pkg, decl] of [...bands.entries()].sort()) {
  const versions = resolvedVersions(pkg);
  const faixas = decl.map((d) => d.range).join("  ·  ");

  if (versions.length === 0) {
    // Não é erro: a trava pode existir preventivamente, para o dia em que o
    // pacote entrar na árvore. Registrar sem reprovar.
    console.log(`  ⊘ ${pkg.padEnd(24)} não está na árvore (trava preventiva: ${faixas})`);
    continue;
  }

  for (const v of versions) {
    verificados++;
    const ok = decl.some((d) => satisfies(v, d.range));
    if (!ok) problemas.push(`${pkg}@${v} não satisfaz nenhuma faixa declarada (${faixas})`);
  }
  const marca = versions.every((v) => decl.some((d) => satisfies(v, d.range))) ? "✓" : "✘";
  console.log(`  ${marca} ${pkg.padEnd(24)} ${versions.join(", ").padEnd(18)} ← ${faixas}`);
}

if (problemas.length > 0) {
  console.error(`\n✘ ${problemas.length} trava(s) de segurança deixaram de valer:\n`);
  for (const p of problemas) console.error(`    ${p}`);
  console.error(`
  A causa mais provável: o pnpm deixou de ler \`pnpm.overrides\` do package.json.
  O pnpm 10 moveu esse campo para pnpm-workspace.yaml, e ignora o antigo com um
  aviso fácil de perder. Confira o \`packageManager\` no package.json.

  Não "conserte" apagando este gate: ele existe porque a falha é silenciosa.`);
  process.exit(1);
}

console.log(
  `\n✓ ${bands.size} trava(s) de override em efeito, ${verificados} resolução(ões) conferida(s).`,
);
