# Troubleshooting

Falhas comuns no golden path e como resolver.

## release-please não cria a GitHub Release {#release-please}

**Sintoma:** o PR de release (`chore: release main`) é mergeado mas nenhuma GitHub Release/tag aparece; o log mostra `There are untagged, merged release PRs outstanding - aborting`.

**Causa:** quirk do `release-please-action@v4` neste setup (não corta a release sozinho após o merge).

**Nudge manual (funciona):**
```bash
gh release create vX.Y.Z --target main --title vX.Y.Z \
  --notes "$(gh api repos/OWNER/REPO/contents/CHANGELOG.md --jq '.content' | base64 -d | awk '/^## /{c++} c==1{print} c==2{exit}')"
gh pr edit <release-pr#> --remove-label "autorelease: pending"
```
**Fix permanente:** o `release-please-action@v5` foi testado e **NÃO resolve** (aborta igual ao v4 — não é a versão da action). O quirk é mais fundo no setup (provavelmente o par `release-type: simple` + manifest, ou precisa de PAT em vez do GITHUB_TOKEN). Por ora, o nudge manual acima é o workaround.

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
