# Contribuindo nos repos SAPIANS

Herdado org-wide via `wbendinelli/.github`. Vale pra todo repo `sapians-*`.

## Conventional commits (obrigatório)

Toda mensagem segue [Conventional Commits](https://www.conventionalcommits.org):

```
<tipo>(<escopo opcional>): <descrição>
```

Tipos que **bumpam versão** (release-please): `feat` (minor) · `fix` (minor pré-1.0, patch pós) · `perf`.
`BREAKING CHANGE:` no rodapé → major (pós-1.0). Outros (`docs`, `refactor`, `test`, `build`, `ci`, `chore`, `style`) entram no CHANGELOG conforme config, sem bumpar.

## Fluxo

1. Branch a partir de `main` (`feat/…`, `fix/…`).
2. Hooks locais (husky/pre-commit) rodam lint + typecheck antes do push.
3. Abra PR → o CI (reusable de `wbendinelli/.github`) precisa passar.
4. Merge em `main` → release-please abre/atualiza a PR de release. Mergear a PR de release publica tag + GitHub Release.

## Toolchain

Node 22 · pnpm 9.15.9 · Python 3.12. Versões pinadas em `.nvmrc` / `packageManager` / `.python-version`.

## Documentação

README conforma ao skeleton (`templates/README.template.md`). Nomes de documento:
`adr/NNNN-kebab-title.md` · `runbooks/verbo-substantivo.md` · `postmortems/YYYY-MM-DD-titulo.md`.
