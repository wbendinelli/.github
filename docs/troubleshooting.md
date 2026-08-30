# Troubleshooting

Falhas comuns no golden path e como resolver.

## release-please não cria a GitHub Release {#release-please}

**Sintoma:** o PR de release é mergeado, o `.release-please-manifest.json` **é bumpado**, mas nenhuma tag e nenhuma GitHub Release aparecem — e o run termina com `conclusion=success`. Na execução seguinte o log mostra `There are untagged, merged release PRs outstanding - aborting`.

**Causa (provada em 2026-08-30):** a chave `"separate-pull-requests": false` no `release-please-config.json` de um repositório de **pacote único**.

Em repo de um pacote o default de `separatePullRequests` já é `true` — escrever `false` é um override da guarda que existe exatamente para evitar isto. Com `false`, o plugin `Merge` cria a branch **sem sufixo de componente** (`release-please--branches--main` em vez de `release-please--branches--main--components--<pkg>`).

Pós-merge, o release-please compara o componente extraído da **branch** (`undefined`) contra o componente configurado (`package-name`). Não bate, e ele **descarta o release em silêncio** — sem log de erro, sem falha do job.

O `autorelease: pending` e o `untagged, merged release PRs outstanding` são **consequência tardia**, não causa. Perseguir esse sintoma leva à investigação errada.

**Conserto permanente — uma linha:**
```bash
# apagar a chave do release-please-config.json
"separate-pull-requests": false
```
Não escrever `true`, não adicionar `pull-request-title-pattern`. Os title-patterns são **inertes** aqui: o descarte acontece no componente da branch, antes de qualquer parse de título.

**Não muda o nome da tag.** Com `include-component-in-tag: false`, o componente resolve para vazio e a tag continua saindo como `vX.Y.Z`.

**Corolário que morde:** mudar a config **não renomeia a branch de um PR já aberto**. PR de release cuja branch é `release-please--branches--main` (sem `--components--`) deve ser **FECHADO**, nunca mergeado — mergear reproduz o descarte e deixa mais um `autorelease: pending` órfão. O próximo run abre um PR novo, já com a branch correta.

**Evidência da correlação, medida na frota (2026-08-30):** dos repositórios com merge real de PR de release, os que tinham `false` + `package-name` (`sapians-api`, `sapians-corpus`, `sapians-infra`, `sapians-xneuron`) **não cortaram nenhuma release sozinhos**; os que não tinham a chave ou tinham `true` (`sapians-auth`, `.github`, `sapians-engram`) **cortaram todas**.

**Remediação de emergência**, só para destravar um release já preso (não é conserto):
```bash
gh release create vX.Y.Z --target main --title vX.Y.Z --generate-notes
gh api -X DELETE repos/OWNER/REPO/issues/<pr#>/labels/autorelease:%20pending
```

> A explicação anterior deste verbete — "quirk do `release-please-action@v4`", com a hipótese de `release-type: simple` ou necessidade de PAT — era **falsa**. `release-type` não discrimina (falharam `python` e `simple`; funcionaram `node` e `python`) e o token estava correto nos dois grupos. Registrado aqui para que ninguém reinvestigue nessa direção.

## "GitHub Actions is not permitted to create or approve pull requests"

**Causa:** toggle desligado no repo. **Fix:**
```bash
gh api -X PUT repos/OWNER/REPO/actions/permissions/workflow \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true
```

## CI de Node falha no biome por causa do package.json {#biome-packagejson}

**Sintoma:** `biome check` falha em `package.json` (ex.: array `lint-staged` re-expandido pra multi-linha) logo após uma release.

**Causa:** o bump de versão do release-please reescreve `package.json` e re-expande arrays, violando o formatter do biome.

**Fix:** adicionar `package.json` ao `files.ignore` do `biome.json` do repo (permanente).

## gitleaks falha com falso-positivo

**Sintoma:** `security.yml` vermelho num arquivo de exemplo (ex.: `JWT_SECRET=` vazio em `.env.example`).

**Causa/fix:** o baseline já allowlista `*.example/*.sample/*.template`. Pra outros casos, criar `.gitleaks.toml` no repo (tem precedência sobre o baseline). Ver [`gitleaks-baseline.md`](./gitleaks-baseline.md).

## gitleaks-action "Resource not accessible by integration"

**Causa:** a `gitleaks-action@v2` chama a API do GitHub (comentar PR) e exige perms/licença. **Fix:** já usamos o **binário** direto (não a action) — least-privilege, sem API.

## Reusable workflow "not allowed" num repo privado

**Causa:** repos privados não conseguem chamar reusables de outro repo privado sem permissão. **Fix (uma vez):**
```bash
gh api -X PUT repos/wbendinelli/.github/actions/permissions/access -f access_level=user
```

## Branch protection: required check "pending" pra sempre num release-PR

**Causa:** PRs criados pelo `GITHUB_TOKEN` (release-please/dependabot) não disparam outros workflows → o check exigido nunca aparece. **Fix:** admin-merge o release-PR (`gh pr merge --admin`), ou não exigir check em release-PRs.

## Required check com nome antigo trava todos os PRs

**Causa:** branch protection exige um check cujo nome mudou (ex.: ao adotar o reusable, o job vira `ci / <nome>`). **Fix:** atualizar o contexto:
```bash
gh api -X PATCH repos/OWNER/REPO/branches/main/protection/required_status_checks \
  -F strict=true -f 'contexts[]=ci / Lint + Typecheck + Build + Test'
```
