#!/usr/bin/env node
// new-repo — gera o esqueleto conforme do golden path SAPIANS.
//
// POR QUE ISTO EXISTE COMO CÓDIGO E NÃO COMO CHECKLIST
// O onboarding era uma lista de 7 passos em prosa. Listas de passos derivam da
// realidade em silêncio: em 2026-08-30 a lista não mencionava `.sapians-repo.yml`
// nem o gate de documentação (ADR-0015), embora os dois fossem obrigatórios havia
// semanas, e os exemplos apontavam para uma tag que nenhum repo usava mais.
// Um gerador não deriva: ou roda e produz o padrão, ou quebra e alguém conserta.
//
// USO
//   node scripts/new-repo.mjs <diretorio> --class <Classe> --tier <Tier> [--name <nome>]
//   node scripts/new-repo.mjs . --class Service --tier B --name sapians-billing
//
// O que gera: .sapians-repo.yml · README.md (do template do perfil) ·
// .github/workflows/docs-lint.yml · .github/dependabot.yml · SECURITY.md
// Não gera: LICENSE (decisão jurídica, varia por org) nem release-please
// (depende do release-type da linguagem) — os dois são apontados no relatório final.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve, basename } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const CFG = JSON.parse(readFileSync(join(ROOT, 'doclint', 'config.json'), 'utf8'))
// O pin sai do version.txt deste repositório. Literal no código viraria a
// próxima mentira do onboarding — foi assim que os exemplos ficaram em @v0.4.1
// enquanto a frota inteira já estava em @v0.5.0.
const PIN = 'v' + readFileSync(join(ROOT, 'version.txt'), 'utf8').trim()
const TODAY = new Date().toISOString().slice(0, 10)

const argv = process.argv.slice(2)
const flag = n => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1] }
// Posicional = o primeiro token que não é flag NEM valor de flag. Preciso
// percorrer, e não filtrar: `--name x dir` e `dir --name x` têm de dar no mesmo.
const positional = (() => {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { i++; continue }
    return argv[i]
  }
  return '.'
})()
const target = resolve(positional)
const cls = flag('--class')
const tier = flag('--tier')
const name = flag('--name') || basename(target)
const owner = flag('--owner') || 'sapians-hq'

const die = m => { console.error(`erro: ${m}`); process.exit(1) }
if (!cls || !tier) die('faltam --class e --tier.\n' +
  `  classes: ${CFG.classes.join(' | ')}\n  tiers:   ${CFG.tiers.join(' | ')}`)
if (!CFG.classes.includes(cls)) die(`class inválida: ${cls} — esperado ${CFG.classes.join(' | ')}`)
if (!CFG.tiers.includes(tier)) die(`tier inválido: ${tier} — esperado ${CFG.tiers.join(' | ')}`)

// O perfil sai do MESMO mapa que o doclint usa para julgar (classProfile). Se o
// gerador escolhesse por conta própria, geraria repo que o gate reprova — que é
// a definição de padrão quebrado.
const profile = CFG.classProfile[cls]
if (!profile) die(`doclint/config.json não mapeia a class ${cls} para um perfil`)

const tmpl = join(ROOT, 'templates', `README.${profile}.template.md`)
if (!existsSync(tmpl)) die(`template ausente: ${tmpl}`)

const w = (rel, content) => {
  const p = join(target, rel)
  if (existsSync(p)) { console.log(`  ·  mantido (já existe): ${rel}`); return }
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, content)
  console.log(`  +  ${rel}`)
}

console.log(`\nnew-repo · ${name} · class=${cls} tier=${tier} perfil=${profile}\n`)

w('.sapians-repo.yml',
`# Declaração de tier do golden path SAPIANS.
class: ${cls}
tier: ${tier}
description: TODO — uma linha, o que este repositório é.
`)

// Os templates usam placeholders em <colchete-angular>. A linha de identidade
// é substituída por regex, e não literalmente, porque cada perfil declara um
// conjunto diferente de valores possíveis (`<A|B|I>`, `<C|D>`, `C` fixo…) e o
// doclint compara essa linha com o .sapians-repo.yml — se ela sair errada, o
// gerador produz repo que o gate reprova em XR010.
w('README.md', readFileSync(tmpl, 'utf8')
  .replace(/^> \*\*Tier:\*\* `[^`]*` · \*\*Class(e)?:\*\* `[^`]*`$/m,
           (_, e) => `> **Tier:** \`${tier}\` · **Class${e || ''}:** \`${cls}\``)
  // O perfil research é escrito em inglês por decisão do padrão, e usa
  // <repo-name>. Substituir as duas formas evita H1 vazio nesse perfil.
  .replaceAll('<nome-do-repo>', name)
  .replaceAll('<repo-name>', name)
  .replaceAll('<owner>', owner)
  .replaceAll('<repo>', name)
  // RM050 exige data ISO no Status do perfil client. A data de GERAÇÃO é a
  // resposta correta: "este é o estado, e é desta data". Deixar o placeholder
  // faria o gerador entregar um repo que já nasce com aviso.
  .replace(/^<Estado da entrega[\s\S]*?característico desta classe\.>$/m,
           `${TODAY} — TODO: estado da entrega nesta data.`))

w('.github/workflows/docs-lint.yml',
`name: Docs lint

# Gate de documentação (ADR-0015). Verifica o README contra o perfil declarado
# em .sapians-repo.yml e a grafia da marca na prosa .md do repositório.
#
# config-ref governa a FERRAMENTA inteira, não só as regras: o reusable faz
# checkout deste repositório nessa ref e roda o doclint de lá. Pinar em tag.
on:
  push:
    branches: [main]
    paths: ["README.md", ".sapians-repo.yml", ".sapians-doclint-baseline.json"]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  docs:
    uses: wbendinelli/.github/.github/workflows/docs-lint.yml@${PIN}
    with:
      config-ref: ${PIN}
`)

w('.github/dependabot.yml', readFileSync(join(ROOT, 'templates', 'dependabot.yml'), 'utf8'))

console.log(`
Falta você decidir (o gerador não decide por você):
  · LICENSE            — varia por organização e por o repositório ser público
  · release-please     — depende do release-type da linguagem (node|python|simple|terraform-module)
  · topics e description no GitHub — a vitrine da organização

Verifique antes de abrir a primeira PR:
  node ${join(ROOT, 'scripts', 'doclint.mjs')} ${target}
`)
