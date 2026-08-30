#!/usr/bin/env node
// doclint — gate de documentação da frota SAPIANS (ADR-0015).
// Verifica README por perfil, .sapians-repo.yml por schema, e a marca.
// Baseline por repositório: regra bloqueia desde o dia 1, dívida existente é
// congelada, e o baseline só encolhe.

import { readFileSync, existsSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CFG = JSON.parse(readFileSync(join(HERE, '..', 'doclint', 'config.json'), 'utf8'))
const BRAND = JSON.parse(readFileSync(join(HERE, '..', 'doclint', 'rules', 'brand.json'), 'utf8'))
const BASELINE_FILE = '.sapians-doclint-baseline.json'

// ─── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
const flag = (n, d = null) => { const i = argv.indexOf(n); return i === -1 ? d : (argv[i + 1] ?? true) }
const has = n => argv.includes(n)
const ROOT = resolve(argv.find(a => !a.startsWith('-') && !['human','github','json'].includes(a)) || '.')
const FORMAT = flag('--format', 'human')
const WRITE_BASELINE = has('--write-baseline')
const DO_INIT = has('--init')
const MAX_AGE = Number(flag('--baseline-max-age', CFG.baselineMaxAgeDays))
const TODAY = flag('--today', new Date().toISOString().slice(0, 10))

// ─── YAML mínimo, deliberadamente restrito ───────────────────────────────────
// Aceita apenas o subconjunto que .sapians-repo.yml usa: chave: valor escalar,
// e um bloco `doclint:` com `profile:` e `waivers:` (lista de mapas).
// Qualquer construção fora disso vira erro explícito — nunca palpite silencioso.
function parseRepoYaml (text) {
  const out = {}, errors = []
  const lines = text.split(/\r?\n/)
  let inWaivers = false, cur = null
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    if (!raw.trim() || raw.trim().startsWith('#')) continue
    const indent = raw.length - raw.trimStart().length
    const line = raw.trim()

    if (indent === 0) {
      inWaivers = false; cur = null
      const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
      if (!m) { errors.push({ line: i + 1, text: line }); continue }
      const [, k, v] = m
      out[k] = v === '' ? {} : unquote(v)
      continue
    }
    if (line.startsWith('- ')) {
      if (!inWaivers) { const m = line.slice(2).match(/^([A-Za-z_][\w-]*):\s*(.*)$/); if (!m) errors.push({ line: i + 1, text: line }); continue }
      cur = {}; out.doclint.waivers.push(cur)
      const m = line.slice(2).match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
      if (m) cur[m[1]] = unquote(m[2])
      continue
    }
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (!m) { errors.push({ line: i + 1, text: line }); continue }
    const [, k, v] = m
    if (k === 'waivers') { out.doclint = out.doclint || {}; out.doclint.waivers = []; inWaivers = true; continue }
    if (cur) cur[k] = unquote(v)
    else { out.doclint = out.doclint || {}; if (typeof out.doclint !== 'object') out.doclint = {}; out.doclint[k] = unquote(v) }
  }
  return { data: out, errors }
}
const unquote = v => v.replace(/^["'](.*)["']$/, '$1').trim()

// ─── markdown: parser tolerante ──────────────────────────────────────────────
// Um linter que reprova por razão errada perde a autoridade. Este parser:
//  · ignora headings dentro de bloco de código
//  · atravessa wrappers <div align="center">
//  · segmenta heading bilíngue por · — |, e aceita qualquer segmento
function stripFences (md) {
  return md.replace(/^```[\s\S]*?^```/gm, m => m.replace(/[^\n]/g, ' '))
}
function normalizeHeading (h) {
  return h
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '')  // badge linkado
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')               // imagem
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')            // link
    .replace(/<[^>]+>/g, '')                            // html inline
    .replace(/[`*_#]/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .trim()
}
function headingSegments (h) {
  return normalizeHeading(h).split(/\s*[·—|]\s*/).map(s => s.trim().toLowerCase()).filter(Boolean)
}
function parseMd (md) {
  const clean = stripFences(md)
  const lines = clean.split(/\r?\n/)
  const headings = []
  let h1 = null
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.*)$/)
    if (!m) continue
    const level = m[1].length
    const entry = { level, raw: m[2], segs: headingSegments(m[2]), line: i + 1 }
    if (level === 1 && !h1) h1 = entry
    if (level >= 2) headings.push(entry)
  }
  return { headings, h1, lines }
}
function sectionBody (parsed, heading) {
  const start = heading.line
  const next = parsed.headings.find(h => h.line > start && h.level <= heading.level)
  return parsed.lines.slice(start, next ? next.line - 1 : undefined).join('\n')
}

// ─── badges ──────────────────────────────────────────────────────────────────
function detectBadges (md) {
  const head = md.split(/\r?\n/).slice(0, 40).join('\n')
  const urls = [...head.matchAll(/\((https?:\/\/[^)\s]+)\)/g)].map(m => m[1])
  const kinds = new Set()
  for (const u of urls) {
    if (/actions\/workflows\/.*badge\.svg/.test(u)) kinds.add('ci')
    if (/github\/v\/release/.test(u)) kinds.add('release')
    if (/badge\/license-/i.test(u) || /\/LICENSE/i.test(u)) kinds.add('license')
    if (/(arxiv|ssrn|preprint)/i.test(u)) kinds.add('preprint')
    if (/(doi\.org|zenodo)/i.test(u)) kinds.add('doi')
    if (/(pypi|npmjs|badge\.fury)/i.test(u)) kinds.add('package')
  }
  return kinds
}

// ─── findings ────────────────────────────────────────────────────────────────
const findings = []
const add = (rule, file, line, message, extra = {}) =>
  findings.push({ rule, severity: CFG.severities[rule] || 'error', file, line, message, ...extra })

// ─── .sapians-repo.yml ───────────────────────────────────────────────────────
function checkRepoConfig (root) {
  const p = join(root, '.sapians-repo.yml')
  if (!existsSync(p)) { add('SR001', '.sapians-repo.yml', 0, 'arquivo ausente — rode com --init para uma sugestão inferida'); return null }
  const { data, errors } = parseRepoYaml(readFileSync(p, 'utf8'))
  for (const e of errors) add('SR010', '.sapians-repo.yml', e.line, `linha não reconhecida pelo schema: ${e.text}`)

  const tier = String(data.tier ?? '').trim()
  const cls = String(data.class ?? '').trim()
  if (!CFG.tiers.includes(tier)) add('SR020', '.sapians-repo.yml', 0, `tier inválido: ${tier || '(vazio)'} — esperado ${CFG.tiers.join('|')}`)
  if (!CFG.classes.includes(cls)) add('SR021', '.sapians-repo.yml', 0, `class inválida: ${cls || '(vazio)'} — esperado ${CFG.classes.join('|')}`)

  if (CFG.tiers.includes(tier) && CFG.classes.includes(cls)) {
    const m = CFG.matrix[tier]
    if (m.unusual.includes(cls)) add('SR031', '.sapians-repo.yml', 0, `combinação incomum: tier ${tier} × class ${cls} — consciente? registre waiver ou corrija o tier`)
    else if (!m.allow.includes(cls)) add('SR030', '.sapians-repo.yml', 0, `combinação inválida: tier ${tier} × class ${cls} — permitido em ${tier}: ${m.allow.join(', ')}`)
  }
  return data
}

// ─── waivers ─────────────────────────────────────────────────────────────────
function activeWaivers (cfgData) {
  const list = cfgData?.doclint?.waivers ?? []
  const active = new Set()
  for (const w of list) {
    if (!w.rule || !CFG.severities[w.rule]) { add('SR050', '.sapians-repo.yml', 0, `waiver aponta regra inexistente: ${w.rule}`); continue }
    if (!w.reason || String(w.reason).length < 30) { add('SR050', '.sapians-repo.yml', 0, `waiver de ${w.rule} sem justificativa suficiente (mínimo 30 caracteres)`); continue }
    if (!w.expires) { add('SR050', '.sapians-repo.yml', 0, `waiver de ${w.rule} sem data de expiração`); continue }
    if (String(w.expires) < TODAY) { add('SR050', '.sapians-repo.yml', 0, `waiver de ${w.rule} expirou em ${w.expires}`); continue }
    active.add(w.rule)
  }
  return active
}

// ─── README ──────────────────────────────────────────────────────────────────
function checkReadme (root, profileName, repoName, cfgData) {
  const p = join(root, 'README.md')
  if (!existsSync(p)) { add('RP001', 'README.md', 0, 'README.md ausente'); return }
  const md = readFileSync(p, 'utf8')
  const parsed = parseMd(md)
  const profile = CFG.profiles[profileName]

  if (!parsed.h1) add('RM001', 'README.md', 0, 'sem título H1')
  else {
    const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!norm(parsed.h1.raw).includes(norm(repoName)) && !norm(repoName).includes(norm(parsed.h1.raw)))
      add('RM002', 'README.md', parsed.h1.line, `H1 "${normalizeHeading(parsed.h1.raw)}" não corresponde ao repositório "${repoName}"`)
  }

  // linha de identidade, derivada do .sapians-repo.yml
  const idLine = md.split(/\r?\n/).findIndex(l => /^>\s*\*\*Tier/i.test(l))
  if (idLine === -1) add('RM010', 'README.md', 0, 'sem a linha de identidade `> **Tier:** … **Classe:** …`')
  else if (cfgData?.tier && cfgData?.class) {
    const l = md.split(/\r?\n/)[idLine]
    const t = (l.match(/Tier:\*\*\s*`?([A-Z])`?/) || [])[1]
    const c = (l.match(/(?:Classe|Class):\*\*\s*`?([A-Za-z]+)`?/) || [])[1]
    if (t && c && (t !== cfgData.tier || c !== cfgData.class))
      add('XR010', 'README.md', idLine + 1, `README diz ${t}/${c} mas .sapians-repo.yml diz ${cfgData.tier}/${cfgData.class}`)
  }

  for (const sec of profile.sections) {
    const wanted = [sec.canonical.toLowerCase(), ...(sec.aliases || [])]
    const found = parsed.headings.find(h => h.segs.some(s => wanted.includes(s)))
    if (!found) { add('RM020', 'README.md', 0, `seção obrigatória ausente: "## ${sec.canonical}"`); continue }
    const body = sectionBody(parsed, found)
    if (sec.requiresTable && !/^\s*\|.*\|/m.test(body))
      add('RM030', 'README.md', found.line, `"## ${normalizeHeading(found.raw)}" precisa conter tabela`)
    if (sec.requiresBibtex && !/@\w+\{/.test(body))
      add('RM031', 'README.md', found.line, `"## ${normalizeHeading(found.raw)}" precisa conter bloco BibTeX`)
    if (sec.requiresIsoDate && !/\d{4}-\d{2}-\d{2}/.test(body))
      add('RM050', 'README.md', found.line, `"## ${normalizeHeading(found.raw)}" precisa de data ISO — entrega de cliente sem data é o modo de falha da classe`)
  }

  const badges = detectBadges(md)
  for (const spec of profile.badges) {
    if (spec.startsWith('oneOf:')) {
      const opts = spec.slice(6).split(',')
      if (!opts.some(o => badges.has(o))) add('RM040', 'README.md', 0, `nenhum badge de ${opts.join(' / ')} encontrado`)
    } else if (!badges.has(spec)) add('RM040', 'README.md', 0, `badge de ${spec} ausente`)
  }

  for (const f of profile.files) if (!existsSync(join(root, f))) add('RP001', f, 0, `${f} ausente`)
}

// ─── marca ───────────────────────────────────────────────────────────────────
function walk (dir, acc = []) {
  const skip = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.turbo', '.vercel', '__pycache__', '.claude'])
  for (const e of readdirSync(dir)) {
    if (skip.has(e)) continue
    const p = join(dir, e)
    let st; try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) walk(p, acc)
    else if (/\.mdx?$/.test(e)) acc.push(p)
  }
  return acc
}
function checkBrand (root) {
  const rule = BRAND.rules[0]
  const re = new RegExp(rule.pattern, rule.flags)
  for (const file of walk(root)) {
    const rel = file.slice(root.length + 1)
    if (BRAND.denyPaths.some(d => rel.includes(d))) continue
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    lines.forEach((l, i) => { re.lastIndex = 0; if (re.test(l)) add('BR001', rel, i + 1, rule.message) })
  }
}

// ─── baseline ────────────────────────────────────────────────────────────────
const key = f => `${f.rule}|${f.file}|${f.message}`
function loadBaseline (root) {
  const p = join(root, BASELINE_FILE)
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { schema: 1, entries: [] }
}
function applyBaseline (root) {
  const bl = loadBaseline(root)
  const present = new Set(findings.map(key))
  const known = new Map(bl.entries.map(e => [e.key, e]))
  for (const f of findings) if (known.has(f.key = key(f))) { f.baselined = true; f.since = known.get(f.key).since }
  for (const e of bl.entries) {
    if (!present.has(e.key)) add('SR060', BASELINE_FILE, 0, `entrada de baseline obsoleta (já corrigida): ${e.key}`)
    else if (MAX_AGE && daysBetween(e.since, TODAY) > MAX_AGE) {
      const f = findings.find(x => x.key === e.key); if (f) { f.baselined = false; f.message += ` [dívida com ${daysBetween(e.since, TODAY)} dias, limite ${MAX_AGE}]` }
    }
  }
}
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)

// ─── init ────────────────────────────────────────────────────────────────────
function infer (root) {
  const at = f => existsSync(join(root, f))
  if (at('CITATION.cff')) return { class: 'Research', tier: 'C' }
  if (at('main.tf') || readdirSync(root).some(f => f.endsWith('.tf'))) return { class: 'IaC', tier: 'I' }
  if (at('Dockerfile') || at('cloudbuild.yaml')) return { class: 'Service', tier: 'B' }
  if (at('pyproject.toml') || at('package.json')) return { class: 'Library', tier: 'C' }
  return { class: 'Content', tier: 'D' }
}

// ─── main ────────────────────────────────────────────────────────────────────
const repoName = basename(ROOT)
const cfgData = checkRepoConfig(ROOT)
const waived = activeWaivers(cfgData)
const profileName = cfgData?.doclint?.profile || CFG.classProfile[cfgData?.class] || 'product'
if (CFG.profiles[profileName]) checkReadme(ROOT, profileName, repoName, cfgData)
checkBrand(ROOT)

for (let i = findings.length - 1; i >= 0; i--) if (waived.has(findings[i].rule)) findings.splice(i, 1)

if (DO_INIT) {
  const g = infer(ROOT)
  console.log(`# .sapians-repo.yml inferido para ${repoName}\nschema: 1\nclass: ${g.class}\ntier: ${g.tier}\ndescription: "<uma linha, 40-200 caracteres>"`)
  process.exit(0)
}

applyBaseline(ROOT)

if (WRITE_BASELINE) {
  const entries = findings.filter(f => f.severity === 'error' && f.rule !== 'SR060').map(f => ({ key: key(f), since: TODAY }))
  writeFileSync(join(ROOT, BASELINE_FILE), JSON.stringify({ schema: 1, generated: TODAY, entries }, null, 2) + '\n')
  console.log(`baseline escrito: ${entries.length} entradas congeladas em ${BASELINE_FILE}`)
  process.exit(0)
}

const errs = findings.filter(f => f.severity === 'error' && !f.baselined)
const warns = findings.filter(f => f.severity === 'warn' || f.baselined)

if (FORMAT === 'json') {
  console.log(JSON.stringify({ repo: repoName, profile: profileName, findings }, null, 2))
} else if (FORMAT === 'github') {
  for (const f of errs) console.log(`::error file=${f.file},line=${f.line || 1},title=${f.rule}::${f.message}`)
  for (const f of warns) console.log(`::warning file=${f.file},line=${f.line || 1},title=${f.rule}::${f.message}`)
} else {
  const tier = cfgData?.tier ?? '?', cls = cfgData?.class ?? '?'
  console.log(`\n${repoName} · profile=${profileName} · tier=${tier} class=${cls}\n`)
  const show = (list, mark) => { for (const f of list) console.log(`  ${mark} ${f.rule.padEnd(6)} ${f.file}${f.line ? ':' + f.line : ''}\n           ${f.message}${f.baselined ? `  [baseline ${f.since}]` : ''}`) }
  show(errs, '✖'); show(warns, '⚠')
  console.log(`\n  ${errs.length} erro(s) · ${warns.length} aviso(s)\n`)
}

process.exit(errs.length ? 1 : 0)
