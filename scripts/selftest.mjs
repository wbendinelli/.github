#!/usr/bin/env node
// Selftest de COMPORTAMENTO das ferramentas da frota.
//
// Por que existe: doclint.mjs e brand-lint.mjs aplicam a MESMA regra de marca
// (doclint/rules/brand.json). Até 2026-08-30 só o brand-lint honrava o marcador
// de exceção — o marcador estava hardcoded nele. O efeito era um ADR que cita a
// grafia errada como evidência passar num gate e falhar no outro, e nada
// detectava isso porque não havia teste de comportamento, só um smoke test.
//
// A asserção 3 é a que teria pego o bug: as duas ferramentas têm de CONCORDAR.
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { cpSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')

// O fixture roda numa CÓPIA FORA da árvore do repo, e não in loco, por dois
// motivos que se somam:
//  1. `test/fixtures/` está no denyPaths de brand.json — precisa estar, senão a
//     violação deliberada de violacao-nua.md reprova o lint do próprio repo.
//     Rodando in loco, o denyPaths esconderia o fixture do teste também, e as
//     asserções passariam por ausência de achado em vez de por comportamento.
//  2. É mais fiel: um repo consumidor tem o fixture na raiz do que é varrido,
//     que é exatamente o que a cópia reproduz.
const TMP = mkdtempSync(join(tmpdir(), 'sapians-selftest-'))
process.on('exit', () => { try { rmSync(TMP, { recursive: true, force: true }) } catch {} })
cpSync(join(ROOT, 'test', 'fixtures', 'marca'), TMP, { recursive: true })
const FIXTURE = TMP

const run = (script, args) => {
  try {
    return { code: 0, out: execFileSync('node', [join(ROOT, 'scripts', script), ...args], { encoding: 'utf8' }) }
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout ?? '') + (e.stderr ?? '') }
  }
}

const fails = []
const check = (name, cond, detail = '') => {
  if (cond) console.log(`  ✔ ${name}`)
  else { console.log(`  ✘ ${name}${detail ? ` — ${detail}` : ''}`); fails.push(name) }
}

console.log('selftest · marca (doclint × brand-lint)')

const doc = run('doclint.mjs', [FIXTURE, '--config', join(ROOT, 'doclint', 'config.json')])
const brand = run('brand-lint.mjs', [FIXTURE])

const docNua = /BR001\s+violacao-nua\.md/.test(doc.out)
const docMarcada = /BR001\s+violacao-marcada\.md/.test(doc.out)
const brandNua = /violacao-nua\.md.*BR001/.test(brand.out)
const brandMarcada = /violacao-marcada\.md.*BR001/.test(brand.out)

check('doclint acusa a violação NÃO marcada', docNua, 'o marcador virou buraco: nada mais é pego')
check('doclint ignora a violação MARCADA', !docMarcada, 'o marcador não está sendo honrado')
check('brand-lint acusa a violação NÃO marcada', brandNua)
check('brand-lint ignora a violação MARCADA', !brandMarcada)
check('as DUAS ferramentas concordam', docNua === brandNua && docMarcada === brandMarcada,
  `doclint(nua=${docNua},marcada=${docMarcada}) × brand-lint(nua=${brandNua},marcada=${brandMarcada})`)

if (fails.length) { console.error(`\n${fails.length} asserção(ões) falharam.`); process.exit(1) }
console.log('\nTodas as asserções passaram.')
