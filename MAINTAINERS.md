# Maintainers

## Quem mantém
- **@wbendinelli** (dono / único mantenedor por ora).

## Responsabilidades
- Consertar reusable workflow quebrado **com prioridade** (afeta os 6 repos).
- Revisar/mergear PRs.
- Anunciar breaking changes no CHANGELOG (e migrar os callers no mesmo PR-trem).
- Manter o toolchain pinado atualizado (Node/pnpm/Python/Terraform/actions).
- Triar issues (bug de workflow vs feature) e os PRs do dependabot (segurar majors de risco).

## Cadência de release
- **patch/minor:** conforme necessário (release-please automático + nudge manual).
- **breaking (major):** raro; anunciar e migrar os consumidores juntos.

## Como editar com segurança
Ver [`docs/maintaining-workflows.md`](./docs/maintaining-workflows.md) — testar num branch + repo consumidor antes do merge; `actionlint` valida em todo PR.

## Drift-check (recomendado, ~1h/trimestre)
Script `gh` que, pra cada repo: confirma que o CI chama o reusable (não copia-cola), branch protection ativa, dependabot presente, gitleaks limpo, versões batendo com o toolchain pinado.
